/* Node.js 18+：node --test tests/cost-model.test.cjs */
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculate, DEFAULTS } = require("../js/cost-model.js");

test("原教材預設值與核心公式不可變", () => {
  const output = calculate(DEFAULTS);
  assert.equal(output.activeYears, 38);
  assert.equal(output.totalCycles, 456);
  assert.equal(output.padsPerCycle, 30);
  assert.equal(output.totalPadsLifetime, 13680);
  assert.equal(output.padCostPerCycle, 186);
  assert.equal(output.addOnCostPerMonth, 500);
  assert.equal(output.totalMonthlyCost, 686);
  assert.equal(output.totalLifetimeCost, 312816);
});
test("取消四項可選開銷不影響用品費用", () => {
  const output = calculate({painkillers:false,heatPacks:false,laundry:false,supplements:false});
  assert.equal(output.addOnCostPerMonth,0);
  assert.equal(output.totalMonthlyCost,186);
  assert.equal(output.totalLifetimeCost,84816);
});
test("夜用比例的 0% 和 60% 均依原公式計算", () => {
  assert.equal(calculate({nightRatio:0}).padCostPerCycle,150);
  assert.equal(calculate({nightRatio:60}).padCostPerCycle,222);
});
test("情境輸入不改變預設常數", () => {
  calculate({startAge:18,endAge:40,periodDays:10,padsPerDay:10});
  assert.equal(DEFAULTS.startAge,12);
  assert.equal(DEFAULTS.periodDays,6);
});
test("拒絕無效數值", () => {
  assert.throws(() => calculate({startAge:"not-a-number"}), TypeError);
});
test("生活消費換算維持原教材設定", () => {
  const e = calculate(DEFAULTS).equivalents;
  assert.equal(e.boba,5214);
  assert.equal(e.bento,2844);
  assert.equal(e.iphone,"9.8");
  assert.equal(e.flight,"26.1");
});
