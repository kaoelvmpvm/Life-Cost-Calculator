/* Google Apps Script 網頁應用程式嵌入：避免前端跨來源寫入試算表。 */
(() => {
  "use strict";
  function initializeCloudPoll() {
    const raw = window.LIFE_COST_CLOUD_VOTE_URL;
    if (typeof raw !== "string" || !raw.trim()) return;
    const url = raw.trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(url)) {
      console.warn("雲端投票網址格式不正確；目前保留單機模擬投票模式。");
      return;
    }
    const cloud = document.getElementById("cloud-poll");
    const demo = document.getElementById("demo-poll");
    const frame = document.getElementById("cloud-vote-frame");
    const link = document.getElementById("cloud-vote-direct");
    const section = document.getElementById("poll-section");
    if (!cloud || !demo || !frame || !link || !section) return;
    // 部署完成才啟用真正雲端介面；示範版不會與正式票數混用。
    frame.src = url;
    link.href = url;
    demo.hidden = true;
    cloud.hidden = false;
    section.classList.add("cloud-ready");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeCloudPoll);
  else initializeCloudPoll();
})();
