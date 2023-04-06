
import Compressed from './compress';
import Identity from './identity';

/**
css.stringify(object, [options]) 函数接受一个 AST 对象（由 css.parse 产生）并返回一个 CSS 字符串。
@param {object} object - 需要序列化为 CSS 字符串的 AST 对象
@param {object} [options] - 可选的对象，其中可以包含以下选项：
    indent: 用于缩进输出的字符串。默认为两个空格。
    compress: 忽略注释和额外的空格。
    sourcemap: 在 CSS 输出中返回一个源映射。
    当创建源映射时，强烈建议使用 css.parse 的 source 选项。
    指定 sourcemap: 'generator' 可以返回 SourceMapGenerator 对象而不是序列化源映射。
    inputSourcemaps: （默认启用，指定 false 可以禁用）在生成输出源映射时读取输入文件引用的任何源映射。
    启用此选项时，可能需要进行文件系统访问以读取引用的源映射。
*/

export default function (node, options) {
  options = options || {};

  // var compiler = options.compress
  //   ? new Compressed(options)
  //   : new Identity(options);

  var compiler = new Compressed(options);

  var code = compiler.compile(node);
  return code;
};
