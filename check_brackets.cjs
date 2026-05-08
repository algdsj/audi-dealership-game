const fs = require('fs');

const filePath = process.argv[2] || 'src/App.jsx';
const content = fs.readFileSync(filePath, 'utf-8');

let stack = [];
let lineNum = 1;
let inJSXComment = false;
let inString = false;
let stringChar = '';

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const prevChar = i > 0 ? content[i - 1] : '';
  const nextChar = i < content.length - 1 ? content[i + 1] : '';

  // 跟踪行号
  if (char === '\n') {
    lineNum++;
    continue;
  }

  // 跳过字符串中的内容
  if (inString) {
    if (char === stringChar && prevChar !== '\\') {
      inString = false;
    }
    continue;
  }

  // 检查是否进入字符串
  if (char === '"' || char === "'" || char === '`') {
    inString = true;
    stringChar = char;
    continue;
  }

  // 跳过 JSX 注释
  if (char === '{' && nextChar === '*') {
    inJSXComment = true;
    i++; // 跳过 '*'
    continue;
  }
  if (inJSXComment) {
    if (char === '*' && nextChar === '}') {
      inJSXComment = false;
      i++; // 跳过 '}'
    }
    continue;
  }

  // 检查括号
  if (char === '{') {
    stack.push({ char: '{', line: lineNum, index: i });
  } else if (char === '}') {
    if (stack.length === 0) {
      console.log(`Error: Extra '}' at line ${lineNum}, index ${i}`);
      process.exit(1);
    }
    const last = stack.pop();
    if (last.char !== '{') {
      console.log(`Error: Mismatched brackets at line ${lineNum}. Expected '${last.char}', but found '}'`);
      console.log(`  Opening bracket at line ${last.line}, index ${last.index}`);
      process.exit(1);
    }
  }
}

if (stack.length > 0) {
  const last = stack[stack.length - 1];
  console.log(`Error: Unclosed '{' at line ${last.line}, index ${last.index}`);
  console.log(`Total unclosed brackets: ${stack.length}`);
  stack.forEach((item, idx) => {
    console.log(`  ${idx + 1}. Line ${item.line}, index ${item.index}`);
  });
} else {
  console.log('All brackets are properly matched!');
}
