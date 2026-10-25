const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/design-v2.css", "utf8");

test("new design stylesheet and content-height workspace are installed", () => {
  assert.match(html, /href="\.\/css\/design-v2\.css"/);
  assert.match(html, /id="calculator-section"[^>]*\bitems-start\b/);
  assert.match(html, /class="parameter-card\b/);
  assert.match(html, /class="result-rail\b/);
  assert.match(css, /\.calculator-workspace\s*\{/);
  assert.match(css, /align-items:\s*start\s*!important/);
  assert.match(css, /align-self:\s*start\s*!important/);
});
test("four distinctive SVG illustrations preserve all existing equivalent result IDs", () => {
  for (const id of ["eq-boba", "eq-bento", "eq-iphone", "eq-flight"])
    assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1);
  assert.equal((html.match(/class="equiv-card__art"/g) || []).length, 4);
  assert.equal((html.match(/class="equiv-card equiv-card--/g) || []).length, 4);
  for (const label of ["珍珠奶茶 (NT$60)", "豐盛便當 (NT$110)", "旗艦款 iPhone (NT$3.2萬)", "日本來回機票 (NT$1.2萬)"])
    assert.ok(html.includes(label));
});
test("cost insights now form a row below the calculator and before classroom discussion", () => {
  const a = html.indexOf('id="calculator-section"');
  const b = html.indexOf('id="insight-section"');
  const c = html.indexOf('id="reflection-section"');
  assert.ok(a >= 0 && a < b && b < c);
  assert.equal((html.match(/id="costChart"/g) || []).length, 1);
  assert.equal((html.match(/id="breakdown-pads"/g) || []).length, 1);
  assert.equal((html.match(/id="breakdown-extra"/g) || []).length, 1);
});
test("redesign preserves cloud voting and the A4 print styles", () => {
  assert.match(html, /id="cloud-vote-frame"/);
  assert.match(html, /\.\/js\/cloud-config\.js/);
  assert.match(html, /\.\/js\/cloud-embed\.js/);
  assert.match(css, /@media print/);
  assert.match(css, /#insight-section\s*\{/);
  assert.match(css, /@media \(max-width: 500px\)/);
});
test("document structure has balanced main divs and sections", () => {
  assert.equal((html.match(/<div\b/g) || []).length, (html.match(/<\/div>/g) || []).length);
  assert.equal((html.match(/<section\b/g) || []).length, (html.match(/<\/section>/g) || []).length);
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
});
