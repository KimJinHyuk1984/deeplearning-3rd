/* Lesson 2-1: one neuron, manual parameter search, and an arithmetic worksheet. */
(function () {
  "use strict";
  const records = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]];
  const keys = ["w1", "w2", "b"];
  const state = { draft: { w1: "1", w2: "1", b: "0" }, history: [], selected: 0 };
  const subscribers = [];
  let serial = 0;
  function round(value) { const rounded = Number(value.toFixed(10)); return rounded === 0 ? 0 : rounded; }
  function display(value) { return String(round(value)); }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, handler, primary) {
    const node = el("button", "button" + (primary ? " button-primary" : ""), text);
    node.type = "button"; node.addEventListener("click", handler); return node;
  }
  function params() {
    const result = {};
    for (const key of keys) {
      const raw = state.draft[key].trim(), value = Number(raw);
      if (!raw || !Number.isFinite(value) || value < -3 || value > 3 || Math.abs(value * 10 - Math.round(value * 10)) > 1e-8) return null;
      result[key] = value;
    }
    return result;
  }
  function evaluate(p, row) {
    const first = round(p.w1 * row[0]), second = round(p.w2 * row[1]);
    const z = round(first + second + p.b), prediction = z >= 0 ? 1 : 0;
    return { first: first, second: second, z: z, prediction: prediction, correct: prediction === row[2] };
  }
  function correctCount(p) { return records.filter(function (row) { return evaluate(p, row).correct; }).length; }
  function notify() { subscribers.forEach(function (update) { update(); }); }
  function setParams(p) { keys.forEach(function (key) { state.draft[key] = String(p[key]); }); notify(); }
  function parameterControls() {
    const group = el("div", "neuron-controls");
    const controls = keys.map(function (key) {
      const label = el("label", "neuron-control", key === "b" ? "편향 b" : "가중치 " + key);
      const input = el("input", "sheet-input"); input.type = "number"; input.min = "-3"; input.max = "3"; input.step = "0.1";
      input.id = "neuron-param-" + (++serial); input.dataset.parameter = key; label.htmlFor = input.id;
      const slider = el("input", "neuron-slider"); slider.type = "range"; slider.min = "-3"; slider.max = "3"; slider.step = "0.1";
      slider.setAttribute("aria-label", (key === "b" ? "편향 b" : "가중치 " + key) + " 슬라이더"); slider.dataset.parameterSlider = key;
      const error = el("span", "neuron-input-note"); error.id = input.id + "-note"; input.setAttribute("aria-describedby", error.id);
      input.addEventListener("input", function () { state.draft[key] = input.value; notify(); });
      slider.addEventListener("input", function () { state.draft[key] = slider.value; notify(); });
      label.append(input, error); const box = el("div", "neuron-control-box"); box.append(label, slider); group.append(box);
      return { input: input, slider: slider, error: error, key: key };
    });
    function update() {
      controls.forEach(function (control) {
        const raw = state.draft[control.key], value = Number(raw);
        const valid = raw.trim() !== "" && Number.isFinite(value) && value >= -3 && value <= 3 && Math.abs(value * 10 - Math.round(value * 10)) < 1e-8;
        control.input.value = raw; control.input.setAttribute("aria-invalid", String(!valid));
        control.error.textContent = valid ? "" : "−3~3 범위에서 0.1 간격으로 입력하세요.";
        if (valid) control.slider.value = raw;
      });
    }
    update(); subscribers.push(update); return group;
  }
  function table(headers, caption) {
    const wrap = el("div", "lesson-table-wrap"), node = el("table", "observation-table neuron-table"), head = el("thead"), tr = el("tr"), body = el("tbody");
    headers.forEach(function (text) { const th = el("th", "", text); th.scope = "col"; tr.append(th); });
    head.append(tr); node.append(el("caption", "sr-only", caption), head, body); wrap.append(node);
    return { wrap: wrap, body: body };
  }

  window.WIDGETS["neuron-search"] = function (host) {
    const panel = el("div", "interactive-widget neuron-search");
    panel.append(el("h3", "widget-title", "찾을 값은 w1, w2, b입니다."), parameterControls());
    const summary = el("output", "neuron-summary"); summary.setAttribute("aria-live", "polite");
    const grid = table(["입력 [x1, x2]", "정답", "계산값 z", "예측", "비교"], "현재 가중치와 편향으로 네 조합을 예측한 결과");
    const views = records.map(function (row) {
      const tr = el("tr"), z = el("td"), prediction = el("td"), match = el("td");
      tr.append(el("td", "", "[" + row.slice(0, 2).join(", ") + "]"), el("td", "", String(row[2])), z, prediction, match); grid.body.append(tr);
      return { tr: tr, z: z, prediction: prediction, match: match };
    });
    function update() {
      const p = params(); summary.textContent = p ? "맞힌 조합 " + correctCount(p) + " / 4 · z가 0 이상이면 예측 1" : "가중치와 편향을 확인하면 계산을 이어갑니다.";
      views.forEach(function (view, index) {
        const result = p ? evaluate(p, records[index]) : null;
        view.z.textContent = result ? display(result.z) : "—";
        view.prediction.textContent = result ? String(result.prediction) : "—";
        view.match.textContent = result ? (result.correct ? "일치" : "다름") : "입력 확인";
        view.tr.dataset.match = result ? String(result.correct) : "unknown";
      });
    }
    panel.append(summary, grid.wrap, button("시작값으로 돌아가기", function () { setParams({ w1: 1, w2: 1, b: 0 }); }), el("p", "widget-note", "정답은 1-2에서 확인한 관찰 기록으로 고정합니다. 한 번에 값 하나를 바꾸고 네 조합을 모두 비교하세요. 아래 그래프의 조절값도 함께 바뀝니다."));
    update(); subscribers.push(update); host.replaceChildren(panel);
  };

  window.WIDGETS["neuron-history"] = function (host) {
    const panel = el("div", "interactive-widget neuron-history"); panel.append(el("h3", "widget-title", "바꾼 이유와 결과를 함께 기록하세요."));
    const label = el("label", "data-choice", "어떤 값을, 왜 바꿨나요?");
    const note = el("input", "sheet-input"); note.type = "text"; note.maxLength = 160; note.id = "neuron-reason-" + (++serial); note.placeholder = "예: [0, 0]에서 꺼짐을 예측하려고 b를 낮췄다."; label.htmlFor = note.id; label.append(note);
    const status = el("p", "quiz-feedback"); status.setAttribute("role", "status");
    const summary = el("p", "lab-progress");
    const grid = table(["시도", "w1 / w2 / b", "예측 00·01·10·11", "일치", "이유"], "내가 직접 탐색한 가중치와 편향의 기록");
    const copy = el("textarea", "sheet-copy-area"); copy.hidden = true; copy.readOnly = true; copy.rows = 6; copy.setAttribute("aria-label", "복사할 탐색 기록");
    const save = button("현재 결과 기록", function () {
      const p = params();
      if (!p) { status.textContent = "먼저 가중치와 편향의 입력을 확인하세요."; return; }
      if (!note.value.trim()) { status.textContent = "시작값이라면 ‘시작값 확인’, 값을 바꿨다면 바꾼 이유를 적으세요."; return; }
      state.history.push({ p: { ...p }, predictions: records.map(function (row) { return evaluate(p, row).prediction; }), count: correctCount(p), note: note.value.trim() });
      note.value = ""; update(); status.textContent = "현재 값과 결과를 기록했습니다. 다음 실험과 비교하세요.";
    }, true);
    const actions = el("div", "lab-actions");
    actions.append(save, button("전체 기록 복사", async function () {
      if (!state.history.length) { status.textContent = "먼저 한 번의 실험을 기록하세요."; return; }
      const text = "시도\tw1\tw2\tb\t예측(00,01,10,11)\t맞힌 수\t이유\n" + state.history.map(function (item, index) { return [index + 1, item.p.w1, item.p.w2, item.p.b, item.predictions.join(","), item.count, item.note.replace(/[\t\r\n]/g, " ")].join("\t"); }).join("\n");
      try { await navigator.clipboard.writeText(text); status.textContent = "전체 탐색 기록을 복사했습니다."; }
      catch (_) { copy.value = text; copy.hidden = false; copy.focus(); copy.select(); status.textContent = "아래 기록을 Ctrl+C 또는 ⌘C로 복사하세요."; }
    }));
    function update() {
      save.disabled = !params(); grid.body.replaceChildren(); status.textContent = ""; copy.hidden = true;
      summary.textContent = state.history.length ? "전체 " + state.history.length + "회 · 최근 4회 표시" : "아직 기록이 없습니다. 시작값의 결과부터 기록하세요.";
      const offset = Math.max(0, state.history.length - 4);
      state.history.slice(offset).forEach(function (item, index) {
        const tr = el("tr");
        [String(offset + index + 1), [item.p.w1, item.p.w2, item.p.b].join(" / "), item.predictions.join(", "), item.count + "/4", item.note].forEach(function (text) { tr.append(el("td", "", text)); });
        grid.body.append(tr);
      });
    }
    panel.append(label, actions, status, summary, grid.wrap, copy, el("p", "widget-note", "값을 바꿔도 이미 기록한 결과는 유지됩니다. 새로고침하면 실험 기록이 초기화되므로 복사해 보관하세요."));
    update(); subscribers.push(update); host.replaceChildren(panel);
  };

  // Clip the displayed input plane by w1*x1 + w2*x2 + b >= 0.
  function geometry(p) {
    const square = [[-0.2, -0.2], [1.2, -0.2], [1.2, 1.2], [-0.2, 1.2]];
    const score = function (point) { return p.w1 * point[0] + p.w2 * point[1] + p.b; };
    const on = [], intersections = [];
    for (let i = 0; i < 4; i += 1) {
      const a = square[i], b = square[(i + 1) % 4], sa = score(a), sb = score(b);
      const aInside = sa >= 0, bInside = sb >= 0;
      if (aInside) on.push(a);
      if (Math.abs(sa) < 1e-10) intersections.push(a);
      if (aInside !== bInside) {
        const t = sa / (sa - sb), crossing = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
        on.push(crossing); intersections.push(crossing);
      }
    }
    const unique = intersections.filter(function (point, index) { return !intersections.slice(0, index).some(function (other) { return Math.hypot(point[0] - other[0], point[1] - other[1]) < 1e-9; }); });
    return { on: on, line: (p.w1 === 0 && p.w2 === 0) || unique.length < 2 ? [] : [unique[0], unique[1]] };
  }
  // Pure helpers are also used by the verification harness.
  window.NeuronModel = { evaluate: evaluate, geometry: geometry };

  window.WIDGETS["neuron-boundary"] = function (host) {
    const panel = el("div", "interactive-widget neuron-boundary"); panel.append(el("h3", "widget-title", "값을 바꾸면 예측 영역이 어떻게 달라질까요?"));
    const workspace = el("div", "plot-workspace"), visual = el("div", "plot-visual"), inspector = el("div", "plot-inspector");
    const legend = el("p", "widget-note", "점 모양 = 관찰 정답 · 사각형 0 / 원 1\n배경 = 모델 예측 · 강조색 1 / 기본색 0\n점선 테두리 = 예측과 정답이 다른 점"); legend.className += " neuron-legend";
    const plane = el("div", "data-plane"), field = el("div", "plot-field neuron-field");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("class", "neuron-region");
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon"); polygon.setAttribute("class", "neuron-region-on");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("class", "neuron-boundary-line"); line.setAttribute("vector-effect", "non-scaling-stroke"); svg.append(polygon, line); field.append(svg);
    [0, 1].forEach(function (value) {
      field.append(el("span", "plot-x-tick plot-tick-" + value, String(value)), el("span", "plot-y-tick plot-tick-" + value, String(value)));
    });
    const points = records.map(function (row, index) {
      const point = button("", function () { state.selected = index; update(); });
      point.className = "plot-point plot-x-" + row[0] + " plot-y-" + row[1] + " plot-class-" + row[2]; point.dataset.neuronPoint = String(index);
      const marker = el("span", "plot-marker"); marker.setAttribute("aria-hidden", "true"); point.append(marker); field.append(point); return point;
    });
    const explanation = el("p", "widget-note"), readout = el("output", "plot-readout"); readout.setAttribute("aria-live", "polite");
    function map(point) { return [(point[0] + 0.2) / 1.4 * 100, (1.2 - point[1]) / 1.4 * 100]; }
    function update() {
      const p = params();
      field.hidden = !p;
      if (!p) { readout.textContent = "가중치와 편향을 올바르게 입력하면 그래프를 표시합니다."; explanation.textContent = ""; return; }
      const region = geometry(p); polygon.setAttribute("points", region.on.map(function (point) { return map(point).join(","); }).join(" "));
      line.setAttribute("visibility", region.line.length ? "visible" : "hidden");
      if (region.line.length) { const a = map(region.line[0]), b = map(region.line[1]); line.setAttribute("x1", a[0]); line.setAttribute("y1", a[1]); line.setAttribute("x2", b[0]); line.setAttribute("y2", b[1]); }
      points.forEach(function (point, index) {
        const result = evaluate(p, records[index]); point.dataset.match = String(result.correct); point.setAttribute("aria-pressed", String(state.selected === index));
        point.setAttribute("aria-label", "입력 " + records[index].slice(0, 2).join(", ") + ", 정답 " + records[index][2] + ", 예측 " + result.prediction + ", " + (result.correct ? "일치" : "다름"));
      });
      const row = records[state.selected], result = evaluate(p, row);
      readout.textContent = "입력 [" + row.slice(0, 2).join(", ") + "] · z = " + display(result.z) + " → 예측 " + result.prediction + " / 정답 " + row[2] + " · " + (result.correct ? "일치" : "다름");
      explanation.textContent = (p.w1 === 0 && p.w2 === 0) ? "두 가중치가 0이면 모든 입력의 z = b입니다. 현재 예측은 모두 " + (p.b >= 0 ? "1" : "0") + "이며 하나의 경계선을 정할 수 없습니다." : region.line.length ? "선 위에서는 z = 0이므로 예측은 1입니다. 점은 네 관찰 기록이며, 배경은 그 사이 입력에 대한 모델의 계산을 보여줍니다." : "현재 화면 범위에는 경계선이 없습니다. 값이나 편향을 바꾸면 선이 나타날 수 있습니다.";
    }
    plane.append(el("p", "plot-y-title", "세로 · 위층 x2"), field, el("p", "plot-x-title", "가로 · 아래층 x1")); visual.append(legend, plane);
    inspector.append(parameterControls(), readout, explanation); workspace.append(visual, inspector); panel.append(workspace);
    update(); subscribers.push(update); host.replaceChildren(panel);
  };

  window.WIDGETS["neuron-calculation"] = function (host) {
    const panel = el("div", "interactive-widget neuron-calculation"); panel.append(el("h3", "widget-title", "뉴런의 계산을 셀 수식으로 작성하세요."));
    const model = window.CellSheet.create(["A2", "B2", "C2", "H2", "H3", "H4", "D2", "E2", "F2"]);
    const choose = el("label", "data-choice", "계산할 관찰 기록");
    const select = el("select", "data-select"); select.id = "neuron-row-" + (++serial); choose.htmlFor = select.id;
    records.forEach(function (row, index) { const option = el("option", "", "입력 [" + row.slice(0, 2).join(", ") + "] / 정답 " + row[2]); option.value = String(index); select.append(option); });
    select.value = "1"; choose.append(select);
    const sources = el("p", "neuron-cell-sources");
    const grid = table(["셀 · 구할 값", "직접 쓸 수식", "내 계산 결과"], "입력별 곱과 편향을 더하는 세 단계 계산");
    const feedback = el("p", "quiz-feedback"); feedback.setAttribute("role", "status");
    const controls = [["D2", "w1 × x1"], ["E2", "w2 × x2"], ["F2", "두 곱의 합 + b"]].map(function (item) {
      const tr = el("tr"), th = el("th", "", item[0] + " · " + item[1]); th.scope = "row";
      const td = el("td"), input = el("input", "sheet-input"), result = el("td"); input.type = "text"; input.maxLength = 200; input.placeholder = "=로 시작"; input.dataset.neuronCell = item[0]; input.setAttribute("aria-label", item[0] + " " + item[1] + " 수식");
      result.id = "neuron-cell-result-" + (++serial); input.setAttribute("aria-describedby", result.id);
      input.addEventListener("input", function () { const change = {}; change[item[0]] = input.value; model.set(change); update(); });
      td.append(input); tr.append(th, td, result); grid.body.append(tr); return { address: item[0], input: input, result: result };
    });
    const prediction = el("output", "plot-readout"); prediction.setAttribute("aria-live", "polite");
    const check = button("내 계산 확인", function () {
      const p = params(); if (!p) { feedback.textContent = "먼저 가중치와 편향을 확인하세요."; return; }
      if (controls.some(function (control) { return !model.raw(control.address).trim().startsWith("="); })) { feedback.textContent = "세 칸에 =로 시작하는 수식을 작성하세요."; return; }
      const expected = evaluate(p, records[Number(select.value)]);
      const values = [expected.first, expected.second, expected.z];
      const wrong = controls.findIndex(function (control, index) { const value = model.read(control.address); return value.status !== "value" || Math.abs(value.value - values[index]) > 1e-9; });
      if (wrong >= 0) { feedback.textContent = controls[wrong].address + " 계산을 다시 확인하세요. 입력×가중치 두 개를 구한 뒤 편향을 더합니다."; return; }
      const probes = [[1, 0, 2, -1, 0.3], [0, 1, -1, 2, -0.2], [1, 1, 0.6, -0.4, 0.5], [0, 0, 1, 1, -0.5]];
      const general = probes.every(function (probe) {
        const trial = window.CellSheet.create(["A2", "B2", "C2", "H2", "H3", "H4", "D2", "E2", "F2"]);
        trial.set({ A2: probe[0], B2: probe[1], C2: Number(probe[0] !== probe[1]), H2: probe[2], H3: probe[3], H4: probe[4], D2: model.raw("D2"), E2: model.raw("E2"), F2: model.raw("F2") });
        const answer = evaluate({ w1: probe[2], w2: probe[3], b: probe[4] }, probe);
        return controls.every(function (control, index) { const value = trial.read(control.address); return value.status === "value" && Math.abs(value.value - [answer.first, answer.second, answer.z][index]) < 1e-9; });
      });
      feedback.textContent = general ? "입력별 곱과 편향을 더하는 계산이 맞습니다. 입력이나 가중치를 바꾸고 다시 계산해보세요." : "현재 값은 맞지만 다른 값에서 결과가 달라집니다. 숫자를 직접 적기보다 입력과 가중치의 셀 주소를 참조하세요.";
    }, true);
    const hint = el("details", "answer-reveal"); hint.append(el("summary", "", "직접 작성한 뒤 수식 예시 확인하기"), el("p", "", "D2: =A2*H2 / E2: =B2*H3 / F2: =D2+E2+H4"));
    function update() {
      feedback.textContent = ""; const p = params(), row = records[Number(select.value)];
      model.set({ A2: row[0], B2: row[1], C2: row[2], H2: p ? p.w1 : "", H3: p ? p.w2 : "", H4: p ? p.b : "" });
      sources.textContent = "A2(x1) = " + row[0] + " · B2(x2) = " + row[1] + " · C2(target) = " + row[2] + "\nH2(w1) = " + (p ? p.w1 : "입력 확인") + " · H3(w2) = " + (p ? p.w2 : "입력 확인") + " · H4(b) = " + (p ? p.b : "입력 확인");
      controls.forEach(function (control) { const value = model.read(control.address); control.result.textContent = value.status === "value" ? display(value.value) : value.message; control.input.setAttribute("aria-invalid", String(value.status === "error")); });
      const value = model.read("F2");
      prediction.textContent = !p ? "가중치와 편향의 입력을 확인하세요." : value.status === "value" ? "내 수식의 z = " + display(value.value) + " → 예측 " + (round(value.value) >= 0 ? "1" : "0") + " / 관찰 정답 " + row[2] : "세 수식을 완성하면 내 계산으로 얻은 예측을 표시합니다.";
    }
    select.addEventListener("change", update);
    panel.append(choose, sources, grid.wrap, prediction, check, feedback, hint, el("p", "widget-note", "위 탐색에서 정한 가중치와 편향을 사용합니다. 이 표의 수식은 연습용이며 위 예측기와 그래프의 계산식을 바꾸지는 않습니다."));
    update(); subscribers.push(update); host.replaceChildren(panel);
  };
  // A deferred script may run after widgets.js already mounted known factories.
  if (typeof window.mountWidgets === "function" && document.readyState !== "loading") window.mountWidgets();
})();
