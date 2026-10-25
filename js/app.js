/* 互動控制：教材文字和計算規則由 index.html 與 cost-model.js 保留。 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const nf = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });
  const numericFields = ["startAge", "endAge", "periodDays", "padsPerDay", "dayPadPrice", "nightPadPrice", "nightRatio"];
  const extras = ["painkillers", "heatPacks", "laundry", "supplements"];
  const pollCounts = { 1: { a: 0, b: 0, c: 0 }, 2: { a: 0, b: 0, c: 0 } };
  const snapshots = { A: null, B: null };
  let chart = null;
  let current = null;
  let settingsTouched = false;
  const safeSession = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    put(key, val) { try { sessionStorage.setItem(key, val); } catch {} },
    drop(key) { try { sessionStorage.removeItem(key); } catch {} }
  };

  function getValues() {
    const values = {};
    for (const name of numericFields) values[name] = Number($(name).value);
    for (const name of extras) values[name] = $("c-" + name).checked;
    return values;
  }
  function renderNumbers(result) {
    const targets = {
      "res-years": result.activeYears,
      "res-totalCycles": result.totalCycles,
      "res-totalLifetimeCost": result.totalLifetimeCost,
      "res-monthlyCost": Math.round(result.totalMonthlyCost),
      "res-totalPads": Math.round(result.totalPadsLifetime),
      "eq-boba": result.equivalents.boba,
      "eq-bento": result.equivalents.bento,
      "eq-iphone": result.equivalents.iphone,
      "eq-flight": result.equivalents.flight,
      "breakdown-pads": Math.round(result.padCostLifetime),
      "breakdown-extra": Math.round(result.addOnCostLifetime),
      "breakdown-pads-pct": Math.round(result.padRatio * 100) + "%",
      "breakdown-extra-pct": Math.round(result.addOnRatio * 100) + "%"
    };
    Object.entries(targets).forEach(([id, value]) => {
      const node = $(id);
      if (node) node.textContent = typeof value === "number" ? nf.format(value) : value;
    });
    if ($("formula-text")) {
      $("formula-text").textContent =
        result.activeYears + " 年 × 12 次／年 = " + result.totalCycles + " 次；每次衛生棉 " +
        nf.format(result.padCostPerCycle) + " 元 + 每月延伸開銷 " +
        nf.format(result.addOnCostPerMonth) + " 元 = 單月 " +
        nf.format(result.totalMonthlyCost) + " 元；生涯估算為 " +
        nf.format(result.totalMonthlyCost) + " × " + result.totalCycles + " 次。";
    }
  }
  function drawChart(result) {
    const canvas = $("costChart");
    if (!canvas || typeof Chart === "undefined") {
      if ($("chart-fallback")) $("chart-fallback").hidden = false;
      if (canvas) canvas.hidden = true;
      return;
    }
    const data = [Math.round(result.padCostLifetime), Math.round(result.addOnCostLifetime)];
    if (chart) {
      chart.data.datasets[0].data = data;
      chart.update("none");
      return;
    }
    try {
      chart = new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: ["衛生棉基本費用", "延伸/隱形開銷 (藥品/衛生劑等)"],
          datasets: [{ data, backgroundColor: ["#be123c", "#0f766e"], borderWidth: 0, hoverOffset: 5 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: "67%",
          plugins: {
            legend: { position: "bottom", labels: { color: "#334155", boxWidth: 13, font: { size: 13, family: "Noto Sans TC" } } },
            tooltip: { callbacks: { label: context => " NT$ " + nf.format(context.raw) } }
          }
        }
      });
    } catch (error) {
      console.warn("成本圖表無法載入，已保留文字版分析。", error);
      canvas.hidden = true;
      if ($("chart-fallback")) $("chart-fallback").hidden = false;
    }
  }
  function refreshLabels(values) {
    numericFields.forEach(key => {
      if ($("v-" + key)) $("v-" + key).textContent = values[key];
      if ($(key)) $(key).setAttribute("aria-valuetext", String(values[key]));
    });
  }
  function calculateCost() {
    try {
      const values = getValues();
      refreshLabels(values);
      current = CostModel.calculate(values);
      renderNumbers(current);
      drawChart(current);
    } catch (error) {
      console.error("試算失敗", error);
      if ($("calculation-error")) {
        $("calculation-error").hidden = false;
        $("calculation-error").textContent = "試算暫時無法完成，請確認參數設定後再試一次。";
      }
    }
  }
  function resetDefaults() {
    const defaults = CostModel.DEFAULTS;
    numericFields.forEach(key => { $(key).value = defaults[key]; });
    extras.forEach(key => { $("c-" + key).checked = defaults[key]; });
    settingsTouched = false;
    calculateCost();
    updateProgress();
  }
  function scrollToSection(id) {
    const node = $(id);
    if (node) node.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }
  function renderPolls() {
    for (const pollId of [1, 2]) {
      const data = pollCounts[pollId];
      const total = data.a + data.b + data.c;
      for (const choice of ["a", "b", "c"]) {
        const pct = total ? data[choice] / total * 100 : 0;
        $("poll" + pollId + "-" + choice + "-count").textContent = data[choice] + " 票 (" + Math.round(pct) + "%)";
        $("p" + pollId + "-" + choice + "-bar").style.width = pct + "%";
      }
      const countNode = $("poll" + pollId + "-total");
      if (countNode) countNode.textContent = "本機累計 " + total + " 票";
    }
  }
  function vote(pollId, option) {
    if (!pollCounts[pollId] || !Object.hasOwn(pollCounts[pollId], option)) return;
    pollCounts[pollId][option] += 1;
    renderPolls();
    updateProgress();
  }
  function resetPolls() {
    for (const id of [1, 2]) for (const key of ["a", "b", "c"]) pollCounts[id][key] = 0;
    renderPolls();
    updateProgress();
  }
  function saveSnapshot(name) {
    if (!current || !["A", "B"].includes(name)) return;
    snapshots[name] = { result: current, values: getValues() };
    renderComparison();
  }
  function renderComparison() {
    for (const label of ["A", "B"]) {
      const node = $("compare-" + label.toLowerCase());
      if (node) node.textContent = snapshots[label]
        ? "NT$ " + nf.format(snapshots[label].result.totalLifetimeCost)
        : "尚未儲存";
    }
    const result = $("compare-delta");
    if (!result) return;
    if (!snapshots.A || !snapshots.B) {
      result.textContent = "請分別儲存情境 A 和情境 B，以比較相同公式下的結果。";
    } else {
      const delta = snapshots.B.result.totalLifetimeCost - snapshots.A.result.totalLifetimeCost;
      result.textContent = "B 相較 A：" + (delta >= 0 ? "增加 " : "減少 ") + "NT$ " + nf.format(Math.abs(delta));
    }
  }
  function setupCards() {
    const cards = $("reflection-section")?.querySelectorAll(".grid > div") || [];
    cards.forEach((card, index) => {
      const question = Array.from(card.children).find(el => el.classList?.contains("bg-white"));
      const heading = card.querySelector("h4");
      if (!question || !heading) return;
      const id = "reflection-question-" + (index + 1);
      question.id = id;
      question.hidden = true;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "reveal-toggle";
      btn.setAttribute("aria-controls", id);
      btn.setAttribute("aria-expanded", "false");
      btn.textContent = "展開思考引導";
      heading.insertAdjacentElement("afterend", btn);
      btn.addEventListener("click", () => {
        const isExpanded = btn.getAttribute("aria-expanded") === "true";
        question.hidden = isExpanded;
        btn.setAttribute("aria-expanded", String(!isExpanded));
        btn.textContent = isExpanded ? "展開思考引導" : "收合思考引導";
        updateProgress();
      });
    });
  }
  function setupRangeControls() {
    numericFields.forEach(key => {
      const slider = $(key);
      if (!slider) return;
      const label = slider.previousElementSibling;
      if (label?.tagName === "LABEL") {
        label.htmlFor = key;
        slider.setAttribute("aria-label", label.textContent.trim());
      }
      slider.addEventListener("input", () => {
        settingsTouched = true;
        calculateCost();
        updateProgress();
      });
      const row = document.createElement("div");
      row.className = "range-row";
      const parent = slider.parentNode;
      parent.replaceChild(row, slider);
      const makeBtn = (symbol, direction) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "range-step no-print";
        btn.textContent = symbol;
        btn.setAttribute("aria-label", (direction < 0 ? "減少" : "增加") + label.textContent.trim().split("：")[0]);
        btn.addEventListener("click", () => {
          const candidate = Number(slider.value) + direction * Number(slider.step || 1);
          slider.value = String(Math.max(Number(slider.min), Math.min(Number(slider.max), candidate)));
          slider.dispatchEvent(new Event("input", { bubbles: true }));
        });
        return btn;
      };
      row.append(makeBtn("−", -1), slider, makeBtn("＋", 1));
    });
  }
  function setupVotes() {
    for (const id of [1, 2]) {
      for (const choice of ["a", "b", "c"]) {
        const button = $("poll" + id + "-options")?.children[["a","b","c"].indexOf(choice)];
        if (!button) continue;
        button.removeAttribute("onclick");
        button.addEventListener("click", () => vote(id, choice));
        button.setAttribute("aria-label", "在第 " + id + " 題模擬累計一票：" + button.querySelector("span")?.textContent);
      }
    }
    $("reset-polls")?.addEventListener("click", resetPolls);
    renderPolls();
  }
  function updateProgress() {
    const stages = [
      true,
      settingsTouched,
      Boolean(snapshots.A || snapshots.B),
      Boolean($("reflection-section")?.querySelector('[aria-expanded="true"]')),
      Object.values(pollCounts).some(p => p.a + p.b + p.c > 0),
      Boolean($("reflection-note")?.value.trim())
    ];
    const completed = stages.filter(Boolean).length;
    if ($("progress-text")) $("progress-text").textContent = "探索進度 " + completed + "／6";
    if ($("progress-bar")) $("progress-bar").style.width = (completed / stages.length * 100) + "%";
    const track = document.querySelector(".progress-track");
    if (track) track.setAttribute("aria-valuenow", String(completed));
  }
  function setupNotes() {
    const field = $("reflection-note");
    if (!field) return;
    field.value = safeSession.get("lifeCostReflection") || "";
    const updatePrintNote = () => {
      const printed = $("print-note");
      if (printed) printed.textContent = field.value.trim() || "（此處留白，可列印後手寫）";
    };
    updatePrintNote();
    field.addEventListener("input", () => {
      safeSession.put("lifeCostReflection", field.value);
      updatePrintNote();
      updateProgress();
    });
    $("clear-note")?.addEventListener("click", () => {
      if (field.value && !window.confirm("要清除這個分頁的反思筆記嗎？")) return;
      field.value = "";
      safeSession.drop("lifeCostReflection");
      updatePrintNote();
      updateProgress();
      field.focus();
    });
  }
  function init() {
    setupRangeControls();
    extras.forEach(key => $("c-" + key)?.addEventListener("change", () => {
      settingsTouched = true; calculateCost(); updateProgress();
    }));
    document.querySelectorAll("[data-scroll-target]").forEach(btn =>
      btn.addEventListener("click", () => scrollToSection(btn.dataset.scrollTarget))
    );
    $("reset-defaults")?.addEventListener("click", resetDefaults);
    $("print-worksheet")?.addEventListener("click", () => window.print());
    $("snapshot-a")?.addEventListener("click", () => { saveSnapshot("A"); updateProgress(); });
    $("snapshot-b")?.addEventListener("click", () => { saveSnapshot("B"); updateProgress(); });
    setupCards();
    setupVotes();
    setupNotes();
    calculateCost();
    renderComparison();
    updateProgress();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  // 同時提供瀏覽器主控台的相容入口（不再使用行內事件）。
  window.calculateCost = calculateCost;
  window.resetDefaults = resetDefaults;
  window.scrollToSection = scrollToSection;
  window.vote = vote;
})();
