/**
 * (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 *  单词表--->单词编码--->单词识别
 */
// | 单词     | 种别   | 助记符号 | 编码 |
// | -------- | ------ | -------- | ---- |
// | add      | name   |          |      |
// | subtract | name   |          |      |
// | number   | number |          |      |
// | （       | paren  |          |      |
// | ）       | paren  |          |      |
// | 空格     | sp     |          |      |
function tokenizer(input){
    let currPos = 0;
    const tokens = [];
    while(currPos < input.length){
        let ch = input[currPos];
        // 如果是空格直接消耗
        const sp = /\s/
        if(sp.test(ch)){
         currPos++;
         continue;   
        }
        // 如果是左括号
        if(ch == '('){
            tokens.push({
                type:'paren',
                value:'('
            });
            currPos++;
            continue;
        }
        // 如果是单词 add
        const letters = /[a-z]/i;
        if(letters.test(ch)){
            let name = ''; // 多消耗一个分隔符号
            while(letters.test(ch)){
                name += ch;
                currPos++;
                ch = input[currPos];
            }
            tokens.push({
                type:'name',
                value:name
            });
            continue;
        }
        // 如果是数字
        const numbers = /[0-9]/;
        if(numbers.test(ch)){
            let number = '';
            while(numbers.test(ch)){
                number += ch;
                currPos++;
                ch = input[currPos];
            }
            tokens.push({
                type:'number',
                value:parseFloat(number)
            });
            continue;
        }
        // 如果是右括号
        if(ch == ')'){
            tokens.push({
                type:'paren',
                value:')'
            });
            currPos++;
            continue;
        }
        currPos++;
        continue;
    }
    return tokens;
}
// name := add | substract;
// number := 0-9;
// CallExpression = number | (name CallExpression CallExpression)

function parser(tokens){
    let index = 0;
    function walk(){
        let token = tokens[index];
        if(token.type == 'number'){
            index++;//3
            return {
                type:'NumberLiteral',
                value:token.value
            }
        }
        if(token.type == 'paren'&&token.value == '('){ // 0
            token = tokens[++index];// 1消耗右括号 add
            const callExpression = {
                type:'CallExpression',
                name:token.value,
                params:[]
            };
            token = tokens[++index];// 2 // 消耗名称add
            while(token.type !== 'paren'|| token.type=='paren'&&token.value !== ')'){
                callExpression.params.push(walk());
                token = tokens[index];
            }
            index++;// 跳过最后的右括号
            return callExpression;
        }
        throw new TypeError(token.type);
    }
    const program = {
        type:'Program',
        body:[]
    }
    while(index < tokens.length){
        program.body.push(walk());
    }
    return program;

}
// {
// 	"type": "Program",
// 	"body": [{
// 			"type": "CallExpression",
// 			"name": "add",
// 			"params": [{
// 					"type": "NumberLiteral",
// 					"value": 2
// 				}, {
// 					"type": "NumberLiteral",
// 					"value": 3
// 				}
// 			]
// 		}
// 	]
// }
function traverser(ast,visitor){
    function traverseArray(array,parent){
        for(let i = 0, len = array.length; i < len; i++){
            traverseNode(array[i],parent)
        }
    }
    function traverseNode(node,parent){
        const methods = visitor&&visitor[node.type];
        if(methods&&methods.enter){
            console.log('enter--->>>node',node,parent);
            methods.enter(node,parent)
        }
        switch(node.type){
            case 'Program':
                traverseArray(node.body,node);
                break;
            case 'CallExpression':
                traverseArray(node.params,node);
                break;
            case 'NumberLiteral':
                break;
            default:
                break;
        }
        if(methods&&methods.exit){
            console.log('exit<<<---node',node,parent);
            methods.exit(node,parent)
        }
    }
    traverseNode(ast,null);
}

function transformer(ast){
    // enter Program
    // enter CallExpression add
    // enter NumberLiteral --- params[0]
    // exit  NumberLiteral
    // enter CallExpression --- params[1]
    // enter NumberLiteral --- params[1][0]
    // exit  NumberLiteral --- params[1][0]
    // enter NumberLiteral --- params[1][1]
    // exit NumberLiteral --- params[1][1]
    // exit CallExpression --- params[1]
    // exit CallExpression --- params[1]
    // exit Program
    const newAst = {
        type:'Program',
        body:[]
    };
    ast._context = newAst.body;
    traverser(ast, {
      NumberLiteral: {
        enter(node, parent) {
            parent._context.push({
                type:'NumberLiteral',
                value:node.value
            });
        }
      },
      CallExpression: {
        enter(node, parent) {
            let expression = {
                type:'CallExpression',
                callee:{
                    type:'Identifier',
                    name:node.name
                },
                arguments:[]
            }
            node._context = expression.arguments;
            // 为什么要加这个判断
            if(parent.type !== 'CallExpression'){
                expression = {
                    type:'ExpressionStatement',
                    expression:expression
                };
            }
            parent._context.push(expression);
            
        }
      }
    });
    return newAst;
}

function codeGenerator(ast){

}

function compiler(input){
    let tokens = tokenizer(input);
    let ast = parser(tokens);
    let newAst = transformer(ast);
    let output = codeGenerator(newAst);
    return output;
}

// module.exports = {
//     tokenizer,
//     parser,
//     traverser,
//     transformer,
//     codeGenerator,
//     compiler
// };
window.tokenizer = tokenizer;
window.parser = parser;
window.traverser = traverser;
window.transformer = transformer;