const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const backend = fs.readFileSync("apps-script/Code.gs","utf8");
const votingUI = fs.readFileSync("apps-script/VoteApp.html","utf8");
const homepage = fs.readFileSync("index.html","utf8");
const embed = fs.readFileSync("js/cloud-embed.js","utf8");
const config = fs.readFileSync("js/cloud-config.js","utf8");

test("Apps Script 後端可通過 JS 語法檢查",()=>{
  assert.doesNotThrow(()=>new Function(backend));
});
test("Apps Script 前端腳本可通過 JS 語法檢查",()=>{
  const script=votingUI.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(script,"missing client script");
  assert.doesNotThrow(()=>new Function(script[1]));
});
test("後端含鎖、匿名裝置去重、教師權限及指定試算表",()=>{
  assert.match(backend,/19p_AsOe6_ndC1jEPjnk_hERdGXCE3Ft0g7UePBIZXig/);
  assert.match(backend,/LockService\.getScriptLock/);
  assert.match(backend,/SHA_256/);
  assert.match(backend,/requireTeacher_/);
  assert.match(backend,/teacherCloseSession/);
  assert.match(backend,/function studentVote/);
});
test("保留原投票問句及所有選項",()=>{
  for(const text of [
    "你或你身邊的同學，曾有過",
    "經常或偶爾會有這種情況",
    "從來沒有，補給都很充裕",
    "不清楚 / 沒注意過",
    "你認為學校提供免費衛生棉",
    "各樓層廁所內部（包含女廁與無性別廁所）",
    "健康中心 / 保健室",
    "班級導師櫃或教官室"
  ]) assert.ok(votingUI.includes(text),text);
});
test("網站保留單機示範並支援配置後嵌入",()=>{
  for(const id of ["demo-poll","cloud-poll","cloud-vote-frame","cloud-vote-direct"])
    assert.ok(homepage.includes('id="'+id+'"'));
  assert.ok(homepage.includes('./js/cloud-config.js'));
  assert.ok(homepage.includes('./js/cloud-embed.js'));
  assert.doesNotThrow(()=>new Function(embed));
  assert.match(config,/LIFE_COST_CLOUD_VOTE_URL\s*=\s*""/);
});
