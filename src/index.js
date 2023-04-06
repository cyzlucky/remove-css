const css = require('css');
const fs = require('fs');
const path = require('path');

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
function removeCSS(from, all) {
    // 将CSS文本解析为AST
    const fromAST = css.parse(from);
    const allAST = css.parse(all);

    // console.log("fromAST: ", fromAST.stylesheet.rules);
    // console.log("allAST", allAST.stylesheet.rules);

    // 在第二个参数中找到需要删除的选择器和规则
    const toRemove = new Set();
    fromAST.stylesheet.rules.forEach((fromRule, fromIndex) => {

        // console.log(`fromRule[${fromIndex}]: `, fromRule);
        // console.log(`fromRuleStr[${fromIndex}]: `, css.stringify(rulesItemToStyleSheet(fromRule)));

        allAST.stylesheet.rules.forEach((allRule, index) => {
            if (css.stringify(rulesItemToStyleSheet(fromRule)) === css.stringify(rulesItemToStyleSheet(allRule))) {
                toRemove.add(index);
            }
        });
    });

    // 删除需要删除的选择器和规则
    allAST.stylesheet.rules = allAST.stylesheet.rules.filter(
        (rule, index) => !toRemove.has(index)
    );

    // 将AST重新序列化为CSS文本并返回
    return css.stringify(allAST);
}

const fromPath = path.resolve(__dirname, './css/from.css');
const allPath = path.resolve(__dirname, './css/all.css');
const resultPath = path.resolve(__dirname, './css/result.css');

const from = fs.readFileSync(fromPath, 'utf8');
const all = fs.readFileSync(allPath, 'utf8');

// 删除CSS选择器和规则
const result = removeCSS(from, all);

// 将结果写入文件
fs.writeFileSync(resultPath, result);