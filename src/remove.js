import parseCSS from "./utils/parse/parseCSS";
import stringifyCSS from "./utils/stringify/stringify";

function rulesItemToStyleSheet(item) {
  const styleSheet = {
    "type": "stylesheet",
    "stylesheet": {
      "rules": [item]
    }
  };
  return styleSheet;
}

// 从第一个参数中删除第二个参数中的CSS选择器和规则
export function removeCSS(from, all) {
  // 将CSS文本解析为AST
  const fromAST = parseCSS(from);
  const allAST = parseCSS(all);

  // 在第二个参数中找到需要删除的选择器和规则
  const toRemove = new Set();
  fromAST.stylesheet.rules.forEach((fromRule, fromIndex) => {
    allAST.stylesheet.rules.forEach((allRule, index) => {
      if (
        stringifyCSS(rulesItemToStyleSheet(fromRule)) ===
        stringifyCSS(rulesItemToStyleSheet(allRule))
      ) {
        toRemove.add(index);
      }
    });
  });

  // 删除需要删除的选择器和规则
  allAST.stylesheet.rules = allAST.stylesheet.rules.filter(
    (rule, index) => !toRemove.has(index)
  );

  // 将AST重新序列化为CSS文本并返回
  return stringifyCSS(allAST);
}
