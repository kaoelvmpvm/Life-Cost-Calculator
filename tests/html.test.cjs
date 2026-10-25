const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html","utf8");

test("保留原有三個思辨主題",()=>{
  for(const title of ["月經貧窮與生理用品課稅","校園免費生理用品的位置與隱私","生理假：形式平等 vs. 實質平等"])
    assert.ok(html.includes(title), title);
});
test("保留原有兩道投票題目",()=>{
  assert.ok(html.includes("Q1. 你或你身邊的同學"));
  assert.ok(html.includes("Q2. 你認為學校提供免費衛生棉"));
});
test("核心路徑存在並已移除行內事件",()=>{
  for(const ref of ["./css/styles.css","./js/cost-model.js","./js/app.js"])assert.ok(html.includes(ref));
  assert.doesNotMatch(html,/\bon(?:click|input|change)\s*=/i);
  assert.ok(html.includes('id="reflection-note"'));
  assert.ok(html.includes('id="print-note"'));
});
test("模擬投票不得誤稱跨裝置同步",()=>{
  assert.ok(html.includes("本機模擬 · 非跨裝置統計"));
  assert.ok(html.includes("不會收集姓名、同步其他裝置"));
});
