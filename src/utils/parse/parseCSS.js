// http://www.w3.org/TR/CSS21/grammar.html
var commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g

/*
    options 参数是一个可选的对象，其中可以包含以下选项：
        silent: 在解析错误时静默失败。
        source: 包含 CSS 的文件路径。
*/

export default function (css, options) {
  var options = options || {};

  /**
   * 用于跟踪行号和列号的变量
   */
  var lineno = 1;
  var column = 1;

  /**
   * 根据输入字符串更新行号和列号
   */
  function updatePosition(str) {
    // 匹配换行符，更新行号
    lineno += (str.match(/\n/g) || []).length;

    // 获取最后一个换行符的索引，更新列号
    const lastIndex = str.lastIndexOf('\n');
    if (~lastIndex) {
      column = str.length - lastIndex - 1;
    } else {
      column += str.length;
    }
  }

  /**
   * 为节点添加位置信息
   */
  function position() {
    // 记录起始位置
    const start = { line: lineno, column: column };
    return node => {
      // 为节点添加位置信息
      node.position = { start, end: { line: lineno, column: column }, source: options.source };
      whitespace();
      return node;
    };
  }

  // 用于记录节点位置信息的构造函数
  const Position = ({ source }) => ({
    start: { line: lineno, column: column },
    end: { line: lineno, column: column },
    source,
    get content() {
      return css;
    },
  });


  /**
   * 用于报错的函数
   */
  var errorsList = [];
  function error(msg) {
    var err = new Error(options.source + ':' + lineno + ':' + column + ': ' + msg);
    err.reason = msg;
    err.filename = options.source;
    err.line = lineno;
    err.column = column;
    err.source = css;

    // 判断是否静默处理错误
    if (options.silent) {
      errorsList.push(err);
    } else {
      throw err;
    }
  }

  /**
   * 解析样式表
   */
  function stylesheet() {
    // 解析样式规则
    var rulesList = rules();

    return {
      type: 'stylesheet',
      stylesheet: {
        source: options.source,
        rules: rulesList,
        parsingErrors: errorsList,
      },
    };
  }

  /**
   * 匹配左括号
   */
  function open() {
    return match(/^{\s*/);
  }

  /**
   * 匹配右括号
   */
  function close() {
    return match(/^}/);
  }

  /**
   * 解析样式规则集
   */
  function rules() {
    var node;
    var rules = [];

    // 忽略空格
    whitespace();

    // 解析注释
    comments(rules);

    // 解析规则集
    while (
      css.length &&
      css.charAt(0) != '}' &&
      (node = atrule() || rule())
    ) {
      if (node !== false) {
        rules.push(node);
        // 解析注释
        comments(rules);
      }
    }
    return rules;
  }

  /**
   * 匹配 `re` 并返回捕获到的结果
   */
  function match(re) {
    var m = re.exec(css);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  }

  /**
   * 解析空格
   */
  function whitespace() {
    match(/^\s*/);
  }

  /**
   * 解析注释
   */
  function comments(rules) {
    var c;
    rules = rules || [];

    // 解析所有注释
    while ((c = comment())) {
      if (c !== false) {
        rules.push(c);
      }
    }
    return rules;
  }

  /**
   * 解析注释
   */
  function comment() {
    // 记录位置信息
    var pos = position();

    // 判断是否为注释
    if ('/' != css.charAt(0) || '*' != css.charAt(1)) return;

    // 查找注释结束位置
    var i = 2;
    while ("" != css.charAt(i) && ('*' != css.charAt(i) || '/' != css.charAt(i + 1))) ++i;
    i += 2;

    // 判断注释是否正确结束
    if ("" === css.charAt(i - 1)) {
      return error('End of comment missing');
    }

    // 提取注释内容
    var str = css.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    css = css.slice(i);
    column += 2;

    return pos({
      type: 'comment',
      comment: str,
    });
  }

  /**
   * 解析选择器
   */
  function selector() {
    var m = match(/^([^{]+)/);
    if (!m) return;

    // 去除注释并替换逗号
    return trim(m[0])
      .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
      .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function (m) {
        return m.replace(/,/g, '\u200C');
      })
      .split(/\s*(?![^(]*\)),\s*/)
      .map(function (s) {
        return s.replace(/\u200C/g, ',');
      });
  }

  /**
   * 解析属性声明
   */
  function declaration() {
    var pos = position();

    // 提取属性
    var prop = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
    if (!prop) return;
    prop = trim(prop[0]);

    // 判断是否有冒号
    if (!match(/^:\s*/)) return error("property missing ':'");

    // 提取属性值
    var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);

    // 构造属性声明对象
    var ret = pos({
      type: 'declaration',
      property: prop.replace(commentre, ''),
      value: val ? trim(val[0]).replace(commentre, '') : '',
    });

    // 忽略分号
    match(/^[;\s]*/);

    return ret;
  }

  /**
   * 解析属性声明列表
   */
  function declarations() {
    var decls = [];

    // 判断是否有左括号
    if (!open()) return error("missing '{'");
    comments(decls);

    // 解析属性声明
    var decl;
    while ((decl = declaration())) {
      if (decl !== false) {
        decls.push(decl);
        comments(decls);
      }
    }

    // 判断是否有右括号
    if (!close()) return error("missing '}'");
    return decls;
  }


  /**
  * 解析关键帧
  */
  function keyframe() {
    var m;
    var vals = [];
    var pos = position();

    // 解析关键帧值
    while ((m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/))) {
      vals.push(m[1]);
      match(/^,\s*/);
    }

    // 如果没有解析到关键帧值则返回null
    if (!vals.length) return;

    // 构造关键帧对象
    return pos({
      type: 'keyframe',
      values: vals,
      declarations: declarations(),
    });
  }

  /**
   * 解析关键帧集
   */
  function atkeyframes() {
    var pos = position();

    // 匹配 @keyframes 关键字
    var m = match(/^@([-\w]+)?keyframes\s*/);
    if (!m) return;

    var vendor = m[1];

    // 解析关键帧名称
    var m = match(/^([-\w]+)\s*/);
    if (!m) return error("@keyframes missing name");
    var name = m[1];

    // 判断是否有左括号
    if (!open()) return error("@keyframes missing '{'");

    var frame;
    var frames = comments();

    // 解析关键帧
    while ((frame = keyframe())) {
      frames.push(frame);
      frames = frames.concat(comments());
    }

    // 判断是否有右括号
    if (!close()) return error("@keyframes missing '}'");

    // 构造关键帧集对象
    return pos({
      type: 'keyframes',
      name: name,
      vendor: vendor,
      keyframes: frames,
    });
  }

  /**
   * 解析支持查询
   */
  function atsupports() {
    var pos = position();

    // 匹配 @supports 关键字
    var m = match(/^@supports *([^{]+)/);
    if (!m) return;

    var supports = trim(m[1]);

    // 判断是否有左括号
    if (!open()) return error("@supports missing '{'");

    var style = comments().concat(rules());

    // 判断是否有右括号
    if (!close()) return error("@supports missing '}'");

    // 构造支持查询对象
    return pos({
      type: 'supports',
      supports: supports,
      rules: style,
    });
  }

  /**
   * 解析 :host 伪类
   */
  function athost() {
    var pos = position();

    // 匹配 @host 关键字
    var m = match(/^@host\s*/);
    if (!m) return;

    // 判断是否有左括号
    if (!open()) return error("@host missing '{'");

    var style = comments().concat(rules());

    // 判断是否有右括号
    if (!close()) return error("@host missing '}'");

    // 构造 :host 伪类对象
    return pos({
      type: 'host',
      rules: style,
    });
  }

  // 解析 @media 规则
  function atmedia() {
    // 记录当前解析位置
    var pos = position();
    // 匹配 @media 规则
    var m = match(/^@media *([^{]+)/);
    // 如果匹配不到，返回空
    if (!m) return;
    // 获取媒体查询条件
    var media = trim(m[1]);
    // 如果无法解析出大括号，报错返回
    if (!open()) return error("@media missing '{'");
    // 获取样式规则并添加注释
    var style = comments().concat(rules());
    // 如果无法解析出大括号，报错返回
    if (!close()) return error("@media missing '}'");
    // 返回解析结果
    return pos({
      type: 'media',
      media: media,
      rules: style
    });
  }

  // 解析自定义媒体查询
  function atcustommedia() {
    // 记录当前解析位置
    var pos = position();
    // 匹配 @custom-media 规则
    var m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
    // 如果匹配不到，返回空
    if (!m) return;
    // 返回解析结果
    return pos({
      type: 'custom-media',
      name: trim(m[1]),
      media: trim(m[2])
    });
  }

  // 解析分页媒体查询
  function atpage() {
    // 记录当前解析位置
    var pos = position();
    // 匹配 @page 规则
    var m = match(/^@page */);
    // 如果匹配不到，返回空
    if (!m) return;
    // 获取选择器
    var sel = selector() || [];
    // 如果无法解析出大括号，报错返回
    if (!open()) return error("@page missing '{'");
    // 获取样式声明并添加注释
    var decls = comments();
    var decl;
    while ((decl = declaration())) {
      decls.push(decl);
      decls = decls.concat(comments());
    }
    // 如果无法解析出大括号，报错返回
    if (!close()) return error("@page missing '}'");
    // 返回解析结果
    return pos({
      type: 'page',
      selectors: sel,
      declarations: decls
    });
  }

  // 解析 @document 规则
  function atdocument() {
    // 记录当前解析位置
    var pos = position();
    // 匹配 @document 规则
    var m = match(/^@([-\w]+)?document *([^{]+)/);
    // 如果匹配不到，返回空
    if (!m) return;
    // 获取厂商前缀和文档条件
    var vendor = trim(m[1]);
    var doc = trim(m[2]);
    // 如果无法解析出大括号，报错返回
    if (!open()) return error("@document missing '{'");
    // 获取样式规则并添加注释
    var style = comments().concat(rules());
    // 如果无法解析出大括号，报错返回
    if (!close()) return error("@document missing '}'");
    // 返回解析结果
    return pos({
      type: 'document',
      document: doc,
      document: doc,
      vendor: vendor,
      rules: style
    });
  }

  // 解析 @font-face 规则
  function atfontface() {
    // 记录当前解析位置
    var pos = position();
    // 匹配 @font-face 规则
    var m = match(/^@font-face\s*/);
    // 如果匹配不到，返回空
    if (!m) return;
    // 如果无法解析出大括号，报错返回
    if (!open()) return error("@font-face missing '{'");
    // 获取样式声明并添加注释
    var decls = comments();
    var decl;
    while ((decl = declaration())) {
      decls.push(decl);
      decls = decls.concat(comments());
    }
    // 如果无法解析出大括号，报错返回
    if (!close()) return error("@font-face missing '}'");
    // 返回解析结果
    return pos({
      type: 'font-face',
      declarations: decls
    });
  }

  // 解析 @import 规则
  var atimport = _compileAtrule('import');

  // 解析 @charset 规则
  var atcharset = _compileAtrule('charset');

  // 解析 @namespace 规则
  var atnamespace = _compileAtrule('namespace');

  // 根据参数生成解析方法
  function _compileAtrule(name) {
    // 构造正则表达式
    var re = new RegExp('^@' + name + '\s*([^;]+);');
    // 返回解析方法
    return function () {
      // 记录当前解析位置
      var pos = position();
      // 匹配 @规则
      var m = match(re);
      // 如果匹配不到，返回空
      if (!m) return;
      // 构造解析结果
      var ret = { type: name };
      ret[name] = m[1].trim();
      // 返回解析结果
      return pos(ret);
    }
  }

  // 解析非块级 @规则
  function atrule() {
    // 如果第一个字符不是 '@'，返回空
    if (css[0] != '@') return;
    // 逐个尝试匹配 @规则
    return atkeyframes()
      || atmedia()
      || atcustommedia()
      || atsupports()
      || atimport()
      || atcharset()
      || atnamespace()
      || atdocument()
      || atpage()
      || athost()
      || atfontface();
  }

  // 解析规则
  function rule() {
    // 记录当前解析位置
    var pos = position();
    // 获取选择器
    var sel = selector();
    // 如果选择器不存在，报错返回
    if (!sel) return error('selector missing');
    // 获取注释
    comments();
    // 构造解析结果
    return pos({
      type: 'rule',
      selectors: sel,
      declarations: declarations()
    });
  }

  return addParent(stylesheet());
};

// 去除字符串两侧空格
function trim(str) {
  return str ? str.replace(/^\s+|\s+$/g, '') : '';
}

// 为每个节点添加非可枚举的父节点引用
function addParent(obj, parent) {
  // 判断当前对象是否是节点
  var isNode = obj && typeof obj.type === 'string';
  // 如果是节点，设置其父节点为传入的 parent 参数，否则使用子节点作为父节点
  var childParent = isNode ? obj : parent;

  // 递归处理所有子节点
  for (var k in obj) {
    var value = obj[k];
    if (Array.isArray(value)) {
      value.forEach(function (v) { addParent(v, childParent); });
    } else if (value && typeof value === 'object') {
      addParent(value, childParent);
    }
  }

  // 如果是节点，为其添加父节点引用
  if (isNode) {
    Object.defineProperty(obj, 'parent', {
      configurable: true,
      writable: true,
      enumerable: false,
      value: parent || null
    });
  }

  return obj;
}
