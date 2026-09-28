/* 강의별 위젯 등록 파일. 공통 shared.js는 수정하지 않습니다.
 * 등록: window.WIDGETS["이름"] = function (host, site) { ... };
 * HTML: <div data-widget="이름"><p>로드 실패 시에도 읽을 수 있는 정적 설명</p></div>
 * 아래 value-slider는 label + range + output을 연결한 범용 예시입니다.
 * 네이티브 range의 방향키/Home/End를 사용하며 발표 단축키와 충돌하지 않습니다.
 * 스타일은 lecture.css의 토큰 기반 클래스에 둡니다. 색상을 JS에 작성하지 않습니다.
 * factory는 동기 함수입니다. UI를 완성한 뒤 host.replaceChildren(...)으로 교체합니다.
 * 초기화 중 예외가 발생하면 원래 정적 설명을 복원합니다. 미등록 위젯도 설명을 유지합니다.
 * 새 요소는 window.mountWidgets(container)로 마운트합니다. 성공한 요소는 한 번만 초기화합니다.
 * site.levels로 강의 메타를 읽습니다. 단일 강의는 site.levels[0]입니다.
 */
window.WIDGETS = window.WIDGETS || {};

(function () {
  "use strict";
  let serial = 0;
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  window.WIDGETS["value-slider"] = function (host) {
    const panel = node("div", "interactive-widget value-slider");
    const heading = node("h3", "widget-title", "값 조절 예시");
    const label = node("label", "widget-slider", "값 (0–100)");
    const input = node("input");
    input.type = "range";
    input.id = "value-slider-" + (++serial);
    input.min = "0";
    input.max = "100";
    input.step = "1";
    input.value = "50";
    label.htmlFor = input.id;
    const output = node("output", "widget-result");
    output.htmlFor = input.id;
    output.setAttribute("aria-live", "polite");
    const meter = node("div", "widget-meter");
    meter.setAttribute("aria-hidden", "true");
    meter.append(node("span", "widget-meter-fill"));
    const note = node("p", "widget-note", "슬라이더를 움직이거나 방향키로 값을 조절하세요. Home은 0, End는 100입니다.");
    note.id = input.id + "-help";
    input.setAttribute("aria-describedby", note.id);
    function update() {
      const value = Number(input.value);
      output.textContent = "현재 값 " + value + " / 100";
      input.setAttribute("aria-valuetext", value + " / 100");
      panel.style.setProperty("--demo-value", String(value / 100));
    }
    input.addEventListener("input", update);
    input.addEventListener("change", update);
    panel.addEventListener("keydown", function (event) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) event.stopPropagation();
    });
    panel.append(heading, label, input, output, meter, note);
    update();
    host.replaceChildren(panel);
  };

  // 1-1: the simulator models the observed device; it is not a trained network.
  const lessonState = { lower: false, upper: false, records: new Map(), message: "아직 기록하지 않았습니다." };
  const lessonSubscribers = [];
  function positionLabel(value) { return value ? "위" : "아래"; }
  function notifyLesson() { lessonSubscribers.forEach(function (update) { update(); }); }

  window.WIDGETS["staircase-lab"] = function (host) {
    const panel = node("div", "interactive-widget staircase-lab");
    const heading = node("h3", "widget-title", "직접 움직여보는 두 스위치");
    const diagram = node("div", "staircase-scene");
    diagram.setAttribute("aria-hidden", "true");
    diagram.innerHTML = '<svg viewBox="0 0 680 170" fill="none"><path class="stairs-floor" d="M24 149H142V122H230V95H318V68H406V41H494V20H656"/><path class="lamp-wire" d="M340 0V24"/><circle class="lamp-bulb" cx="340" cy="51" r="26"/><path class="lamp-rays" d="M300 51h-12m92 0h12M312 22l-9-9m65 9 9-9M312 80l-9 9m65-9 9 9"/><path class="lamp-base" d="M329 77h22m-19 7h16"/></svg>';
    const result = node("output", "lamp-result");
    result.setAttribute("aria-live", "polite");
    const controls = node("div", "switch-grid");
    function makeSwitch(key, label) {
      const button = node("button", "stair-switch");
      button.type = "button";
      button.dataset.switch = key;
      const rocker = node("span", "switch-rocker");
      rocker.setAttribute("aria-hidden", "true");
      rocker.append(node("span", "switch-rocker-thumb"));
      const words = node("span", "switch-words");
      words.append(node("strong", "", label));
      const value = node("span", "switch-position");
      words.append(value);
      button.append(rocker, words);
      button.addEventListener("click", function () {
        lessonState[key] = !lessonState[key];
        lessonState.message = label + "를 움직였습니다. 예상과 결과를 비교해보세요.";
        notifyLesson();
      });
      controls.append(button);
      return { button: button, value: value, label: label, key: key };
    }
    const switches = [makeSwitch("lower", "아래층 스위치"), makeSwitch("upper", "위층 스위치")];
    const actions = node("div", "lab-actions");
    const record = node("button", "button button-primary", "현재 조합 기록");
    record.type = "button";
    record.addEventListener("click", function () {
      const key = Number(lessonState.lower) * 2 + Number(lessonState.upper);
      const alreadyRecorded = lessonState.records.has(key);
      lessonState.records.set(key, lessonState.lower !== lessonState.upper);
      lessonState.message = alreadyRecorded ? "이미 기록한 조합입니다. 다른 조합도 살펴보세요." : "새 조합을 기록했습니다. 아래 관찰 표에서 확인하세요.";
      notifyLesson();
    });
    const reset = node("button", "button", "실험 처음으로");
    reset.type = "button";
    reset.addEventListener("click", function () {
      lessonState.lower = false;
      lessonState.upper = false;
      lessonState.records.clear();
      lessonState.message = "두 스위치와 관찰 기록을 초기화했습니다.";
      notifyLesson();
    });
    actions.append(record, reset);
    const progress = node("p", "lab-progress");
    const status = node("p", "widget-note lab-status");
    status.setAttribute("role", "status");
    const hint = node("p", "widget-note", "스위치 버튼은 클릭하거나 Tab으로 이동해 Enter·Space로 조작할 수 있습니다.");
    function update() {
      const on = lessonState.lower !== lessonState.upper;
      panel.dataset.lamp = on ? "on" : "off";
      result.textContent = "전등 · " + (on ? "켜짐" : "꺼짐");
      switches.forEach(function (item) {
        const value = lessonState[item.key];
        item.value.textContent = positionLabel(value) + "쪽 · 누르면 반대쪽으로";
        item.button.setAttribute("aria-pressed", String(value));
        item.button.setAttribute("aria-label", item.label + ": " + positionLabel(value) + "쪽, 누르면 " + positionLabel(!value) + "쪽으로 이동");
      });
      progress.textContent = "관찰한 조합 " + lessonState.records.size + " / 4";
      status.textContent = lessonState.message;
    }
    panel.append(heading, diagram, result, controls, actions, progress, status, hint);
    update();
    host.replaceChildren(panel);
    lessonSubscribers.push(update);
  };

  window.WIDGETS["observation-notebook"] = function (host) {
    const panel = node("div", "interactive-widget observation-notebook");
    panel.append(node("h3", "widget-title", "내가 모은 관찰 기록"));
    const wrapper = node("div", "lesson-table-wrap");
    const table = node("table", "observation-table");
    const caption = node("caption", "sr-only", "현재 조합 기록 버튼으로 모은 네 가지 스위치 조합");
    const head = node("thead");
    const headRow = node("tr");
    ["아래층 위치", "위층 위치", "전등 상태"].forEach(function (text) {
      const cell = node("th", "", text);
      cell.scope = "col";
      headRow.append(cell);
    });
    head.append(headRow);
    const body = node("tbody");
    const cells = [];
    for (let key = 0; key < 4; key += 1) {
      const row = node("tr");
      row.append(node("td", "", positionLabel(key >= 2)), node("td", "", positionLabel(key % 2 === 1)));
      const result = node("td", "observation-result", "아직 관찰 전");
      row.append(result);
      body.append(row);
      cells.push(result);
    }
    table.append(caption, head, body);
    wrapper.append(table);
    const progress = node("p", "lab-progress");
    progress.setAttribute("aria-live", "polite");
    const note = node("p", "widget-note", "위 실험에서 ‘현재 조합 기록’을 눌러 표를 채우세요. 새로고침하면 기록이 초기화되므로, 완성한 표는 메모나 파이썬 코드로 옮겨두세요.");
    function update() {
      cells.forEach(function (cell, key) {
        cell.textContent = lessonState.records.has(key) ? (lessonState.records.get(key) ? "켜짐" : "꺼짐") : "아직 관찰 전";
        cell.dataset.recorded = String(lessonState.records.has(key));
      });
      progress.textContent = lessonState.records.size === 4 ? "네 조합을 모두 관찰했습니다. 이제 공통점을 설명해보세요." : "현재 " + lessonState.records.size + "개 기록 · 남은 조합 " + (4 - lessonState.records.size) + "개";
    }
    panel.append(wrapper, progress, note);
    update();
    host.replaceChildren(panel);
    lessonSubscribers.push(update);
  };

  window.WIDGETS["lesson-check"] = function (host) {
    const panel = node("div", "interactive-widget lesson-check");
    panel.append(node("h3", "widget-title", "움직이기 전, 결과를 예상해보세요."));
    panel.append(node("p", "", "아래층 스위치는 위쪽, 위층 스위치는 아래쪽이고 전등은 켜져 있습니다. 위층 스위치만 위쪽으로 움직이면 어떻게 될까요?"));
    const group = node("fieldset", "quiz-options");
    group.append(node("legend", "", "예상하는 전등 상태"));
    const options = [["on", "계속 켜져 있다"], ["off", "꺼진다"]];
    const groupName = "lesson-check-" + (++serial);
    options.forEach(function (item) {
      const label = node("label", "quiz-choice");
      const radio = node("input");
      radio.type = "radio";
      radio.name = groupName;
      radio.value = item[0];
      label.append(radio, node("span", "", item[1]));
      group.append(label);
    });
    const feedback = node("p", "quiz-feedback");
    feedback.setAttribute("role", "status");
    const check = node("button", "button button-primary", "예상 확인하기");
    check.type = "button";
    check.addEventListener("click", function () {
      const selected = group.querySelector("input:checked");
      feedback.textContent = !selected ? "먼저 예상하는 상태를 선택하세요." : selected.value === "off" ? "맞았습니다. 두 스위치가 모두 위쪽이 되어 전등이 꺼집니다. 스위치 하나를 움직여 켜짐에서 꺼짐으로 바뀌었습니다." : "두 스위치가 모두 위쪽인 조합을 다시 살펴보세요. 위층 스위치 하나를 움직이면 전등 상태가 반대로 바뀝니다.";
    });
    group.addEventListener("change", function () { feedback.textContent = ""; });
    group.addEventListener("keydown", function (event) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) event.stopPropagation();
    });
    panel.append(group, check, feedback);
    host.replaceChildren(panel);
  };

  // 1-2: labels are the observed answers, not predictions from a model.
  const encodedObservations = [
    { lower: "아래", upper: "아래", lamp: "꺼짐", values: [0, 0, 0] },
    { lower: "아래", upper: "위", lamp: "켜짐", values: [0, 1, 1] },
    { lower: "위", upper: "아래", lamp: "켜짐", values: [1, 0, 1] },
    { lower: "위", upper: "위", lamp: "꺼짐", values: [1, 1, 0] }
  ];

  function lessonSelect(labelText, choices) {
    const label = node("label", "data-choice");
    const caption = node("span", "", labelText);
    const select = node("select", "data-select");
    select.id = "data-choice-" + (++serial);
    label.htmlFor = select.id;
    choices.forEach(function (choice) {
      const option = node("option", "", choice[1]);
      option.value = choice[0];
      select.append(option);
    });
    label.append(caption, select);
    return { label: label, select: select };
  }

  window.WIDGETS["binary-encoding"] = function (host) {
    const panel = node("div", "interactive-widget binary-encoding");
    panel.append(node("h3", "widget-title", "관찰 한 줄을 세 숫자로 옮겨보세요."));
    const chooser = node("div", "encoding-cases");
    chooser.setAttribute("role", "group");
    chooser.setAttribute("aria-label", "숫자로 바꿀 관찰 조합");
    const observation = node("p", "encoding-observation");
    const inputs = node("div", "encoding-inputs");
    const controls = ["아래층 x1", "위층 x2", "전등 target"].map(function (label) {
      const control = lessonSelect(label, [["", "숫자 선택"], ["0", "0"], ["1", "1"]]);
      inputs.append(control.label);
      return control.select;
    });
    const state = { current: 0, answers: encodedObservations.map(function () { return ["", "", ""]; }), completed: new Set() };
    const feedback = node("p", "quiz-feedback");
    feedback.setAttribute("role", "status");
    const progress = node("p", "lab-progress");
    const buttons = encodedObservations.map(function (row, index) {
      const button = node("button", "button", row.lower + " · " + row.upper);
      button.type = "button";
      button.setAttribute("aria-label", "아래층 " + row.lower + ", 위층 " + row.upper + " 조합 선택");
      button.addEventListener("click", function () { state.current = index; feedback.textContent = ""; update(); });
      chooser.append(button);
      return button;
    });
    const actions = node("div", "lab-actions");
    const check = node("button", "button button-primary", "숫자 변환 확인");
    check.type = "button";
    check.addEventListener("click", function () {
      const values = controls.map(function (control) { return control.value; });
      const expected = encodedObservations[state.current].values;
      if (values.some(function (value) { return value === ""; })) {
        feedback.textContent = "세 항목을 모두 선택하세요. 비어 있는 칸과 숫자 0은 다릅니다.";
        return;
      }
      if (values.every(function (value, index) { return value === String(expected[index]); })) {
        state.completed.add(state.current);
        feedback.textContent = "맞았습니다. 입력은 [" + values[0] + ", " + values[1] + "], 정답은 " + values[2] + "입니다. 다른 조합도 바꿔보세요.";
      } else {
        state.completed.delete(state.current);
        feedback.textContent = "숫자 약속을 다시 확인하세요. 위치는 아래 0·위 1, 전등은 꺼짐 0·켜짐 1입니다.";
      }
      updateProgress();
    });
    const reset = node("button", "button", "네 조합 다시 풀기");
    reset.type = "button";
    reset.addEventListener("click", function () {
      state.current = 0;
      state.answers = encodedObservations.map(function () { return ["", "", ""]; });
      state.completed.clear();
      feedback.textContent = "숫자 선택과 확인 기록을 초기화했습니다.";
      update();
    });
    controls.forEach(function (control, index) {
      control.addEventListener("change", function () {
        state.answers[state.current][index] = control.value;
        state.completed.delete(state.current);
        feedback.textContent = "";
        updateProgress();
      });
    });
    function updateProgress() {
      progress.textContent = state.completed.size === 4 ? "네 조합의 숫자 변환을 모두 확인했습니다." : "숫자 변환 확인 " + state.completed.size + " / 4";
    }
    function update() {
      const row = encodedObservations[state.current];
      observation.textContent = "관찰: 아래층 " + row.lower + "쪽 / 위층 " + row.upper + "쪽 / 전등 " + row.lamp;
      buttons.forEach(function (button, index) { button.setAttribute("aria-pressed", String(index === state.current)); });
      controls.forEach(function (control, index) { control.value = state.answers[state.current][index]; });
      updateProgress();
    }
    actions.append(check, reset);
    panel.append(chooser, observation, inputs, actions, progress, feedback);
    update();
    host.replaceChildren(panel);
  };

  const dataAddresses = [2, 3, 4, 5].flatMap(function (row) { return ["A", "B", "C"].map(function (col) { return col + row; }); });
  const dataSheet = window.CellSheet.create(dataAddresses);
  const sheetSubscribers = [];
  function notifySheet() { sheetSubscribers.forEach(function (update) { update(); }); }
  function sheetRows() {
    return [2, 3, 4, 5].map(function (row) {
      const cells = ["A", "B", "C"].map(function (col) { return dataSheet.read(col + row); });
      return cells.every(function (cell) { return cell.status === "value" && (cell.value === 0 || cell.value === 1); }) ? cells.map(function (cell) { return cell.value; }) : null;
    });
  }
  function sheetDataProblem() {
    const rows = sheetRows();
    if (rows.some(function (row) { return !row; })) return "A2:C5를 모두 0 또는 1로 채우세요. 빈칸과 숫자 0은 다릅니다.";
    if (new Set(rows.map(function (row) { return row[0] + "," + row[1]; })).size !== 4) return "같은 입력 조합이 중복되어 있습니다. 네 조합을 한 번씩 기록하세요.";
    if (rows.some(function (row) { return row[2] !== Number(row[0] !== row[1]); })) return "전등 상태가 관찰과 다른 행이 있습니다. 두 스위치의 위치를 다시 확인하세요.";
    return "";
  }
  function sheetInput(address, caption) {
    const input = node("input", "sheet-input");
    input.type = "text";
    input.id = "sheet-" + address + "-" + (++serial);
    input.dataset.cell = address;
    input.maxLength = 200;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", address + " · " + caption);
    input.addEventListener("input", function () {
      const change = {};
      change[address] = input.value;
      dataSheet.set(change);
      notifySheet();
    });
    return input;
  }

  window.WIDGETS["data-worksheet"] = function (host) {
    const panel = node("div", "interactive-widget data-worksheet");
    panel.append(node("h3", "widget-title", "관찰 기록을 셀에 직접 입력하세요."));
    const wrap = node("div", "lesson-table-wrap");
    const table = node("table", "sheet-table");
    const head = node("thead"), headRow = node("tr");
    ["행", "A · x1", "B · x2", "C · target"].forEach(function (title) {
      const th = node("th", "", title); th.scope = "col"; headRow.append(th);
    });
    head.append(headRow);
    const body = node("tbody"), inputs = [];
    [2, 3, 4, 5].forEach(function (row) {
      const tr = node("tr"), rowHead = node("th", "", String(row));
      rowHead.scope = "row";
      tr.append(rowHead);
      ["A", "B", "C"].forEach(function (col, colIndex) {
        const address = col + row, td = node("td");
        const input = sheetInput(address, ["아래층 위치", "위층 위치", "전등 상태"][colIndex]);
        input.placeholder = "0 / 1";
        input.inputMode = "numeric";
        const result = node("span", "sheet-cell-result");
        result.id = input.id + "-result";
        input.setAttribute("aria-describedby", result.id);
        input.addEventListener("paste", function (event) {
          const text = event.clipboardData && event.clipboardData.getData("text/plain");
          if (!text || !/[\t\r\n]/.test(text)) return;
          event.preventDefault();
          const pastedLines = text.replace(/\r\n?/g, "\n").split("\n");
          while (pastedLines.length && pastedLines[pastedLines.length - 1] === "") pastedLines.pop();
          const lines = pastedLines.map(function (line) { return line.split("\t"); });
          if (!lines.length) return;
          if (lines[0].join("\t").toLowerCase() === "x1\tx2\ttarget") lines.shift();
          if (!lines.length || row + lines.length > 6 || lines.some(function (line) { return !line.length || colIndex + line.length > 3; })) {
            feedback.textContent = "붙여넣을 자료가 A2:C5를 벗어납니다. 네 행 자료는 A2에 붙여넣으세요.";
            return;
          }
          const changes = {};
          lines.forEach(function (line, offset) {
            line.forEach(function (value, column) { changes[["A", "B", "C"][colIndex + column] + (row + offset)] = value.trim(); });
          });
          dataSheet.set(changes);
          notifySheet();
          feedback.textContent = "자료를 붙여넣었습니다. 관찰 기록과 대조하세요.";
        });
        td.append(input, result); tr.append(td);
        inputs.push({ address: address, input: input, result: result });
      });
      body.append(tr);
    });
    table.append(node("caption", "sr-only", "A열 x1, B열 x2, C열 target. 2행부터 5행까지 직접 입력하는 관찰 기록."), head, body);
    wrap.append(table);
    const feedback = node("p", "quiz-feedback"); feedback.setAttribute("role", "status");
    const actions = node("div", "lab-actions");
    function action(text, handler) {
      const button = node("button", "button", text); button.type = "button";
      button.addEventListener("click", handler); actions.append(button);
    }
    action("관찰 기록 확인", function () { feedback.textContent = sheetDataProblem() || "네 조합과 전등 상태가 모두 관찰 기록과 일치합니다."; });
    action("예시 데이터 채우기", function () {
      const changes = {};
      dataAddresses.forEach(function (address, index) { changes[address] = encodedObservations[Math.floor(index / 3)].values[index % 3]; });
      dataSheet.set(changes); notifySheet();
      feedback.textContent = "관찰 예시를 채웠습니다. 아래에서 축과 점의 구분을 선택해 차트를 만들어보세요.";
    });
    const copyArea = node("textarea", "sheet-copy-area");
    copyArea.readOnly = true; copyArea.hidden = true; copyArea.rows = 5;
    copyArea.setAttribute("aria-label", "복사할 현재 데이터 표");
    action("내 데이터 복사", async function () {
      const rows = sheetRows();
      if (rows.some(function (row) { return !row; })) { feedback.textContent = "먼저 데이터 표를 모두 0 또는 1로 채우세요."; return; }
      const text = "x1\tx2\ttarget\n" + rows.map(function (row) { return row.join("\t"); }).join("\n");
      try {
        if (!navigator.clipboard) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(text);
        feedback.textContent = "누른 시점의 데이터 네 행을 복사했습니다. 메모장 등에 붙여넣어 보관하세요.";
      } catch (_) {
        copyArea.value = text; copyArea.hidden = false; copyArea.focus(); copyArea.select();
        feedback.textContent = "아래 자료를 선택했습니다. Ctrl+C 또는 ⌘C로 복사하세요.";
      }
    });
    action("데이터 표 초기화", function () {
      dataSheet.reset(); notifySheet(); feedback.textContent = "관찰 데이터를 모두 비웠습니다.";
    });
    function update() {
      inputs.forEach(function (item) {
        const cell = dataSheet.read(item.address);
        item.input.value = dataSheet.raw(item.address);
        const invalid = cell.status === "error" || (cell.status === "value" && cell.value !== 0 && cell.value !== 1);
        item.input.setAttribute("aria-invalid", String(invalid));
        item.result.textContent = cell.status === "error" ? cell.message : invalid ? "0 또는 1을 입력하세요." : dataSheet.raw(item.address).trim().startsWith("=") && cell.status === "value" ? "= " + cell.value : "";
      });
      feedback.textContent = ""; copyArea.hidden = true;
    }
    panel.append(wrap, actions, feedback, copyArea, node("p", "widget-note", "Tab으로 다음 셀로 이동합니다. 네 행 자료는 A2에 붙여넣을 수 있습니다. 새로고침하면 데이터와 차트 설정이 초기화됩니다. 완료한 화면과 데이터를 따로 보관하세요."));
    update(); host.replaceChildren(panel); sheetSubscribers.push(update);
  };

  // Use the student's chosen columns, including choices that need discussion.
  const chartColumns = [
    { key: "x1", column: "A", label: "아래층 x1", values: ["아래쪽", "위쪽"] },
    { key: "x2", column: "B", label: "위층 x2", values: ["아래쪽", "위쪽"] },
    { key: "target", column: "C", label: "전등 target", values: ["꺼짐", "켜짐"] }
  ];
  const chartState = { settings: null, revealed: 0, selected: -1 };
  const chartSubscribers = [];
  function notifyChart() { chartSubscribers.forEach(function (update) { update(); }); }
  function chartColumn(key) { return chartColumns.find(function (column) { return column.key === key; }); }
  function chartValue(row, key) { return row[chartColumns.findIndex(function (column) { return column.key === key; })]; }

  window.WIDGETS["chart-builder"] = function (host) {
    const panel = node("div", "interactive-widget chart-builder");
    panel.append(node("h3", "widget-title", "어떤 열로 분산형 차트를 만들까요?"));
    const choices = [["", "열을 선택하세요"]].concat(chartColumns.map(function (column) { return [column.key, column.column + "열 · " + column.label]; }));
    const x = lessonSelect("가로축 X", choices);
    const y = lessonSelect("세로축 Y", choices);
    const group = lessonSelect("점의 색·모양 구분", choices.concat([["none", "구분하지 않기"]]));
    x.select.dataset.chartControl = "x";
    y.select.dataset.chartControl = "y";
    group.select.dataset.chartControl = "group";
    const controls = node("div", "chart-controls");
    controls.append(x.label, y.label, group.label);
    const feedback = node("p", "quiz-feedback"); feedback.setAttribute("role", "status");
    const applied = node("p", "widget-note");
    const actions = node("div", "lab-actions");
    const build = node("button", "button button-primary", "분산형 차트 만들기"); build.type = "button";
    build.addEventListener("click", function () {
      if (!x.select.value || !y.select.value || !group.select.value) {
        feedback.textContent = "가로축, 세로축, 점을 구분할 기준을 모두 선택하세요."; return;
      }
      if (x.select.value === y.select.value) {
        feedback.textContent = "두 입력을 함께 살펴볼 수 있도록 가로축과 세로축에 서로 다른 열을 선택하세요."; return;
      }
      const firstValid = sheetRows().findIndex(function (row) { return row; });
      if (firstValid < 0) {
        feedback.textContent = "먼저 위 데이터 표에서 한 행 이상을 0과 1로 채우세요."; return;
      }
      chartState.settings = { x: x.select.value, y: y.select.value, group: group.select.value };
      chartState.revealed = firstValid + 1; chartState.selected = firstValid;
      notifyChart();
      feedback.textContent = "아래에 첫 점을 표시했습니다. ‘다음 행 표시’로 네 행이 어디에 놓이는지 살펴보세요.";
    });
    const reset = node("button", "button", "차트 설정 초기화"); reset.type = "button";
    reset.addEventListener("click", function () {
      [x.select, y.select, group.select].forEach(function (select) { select.value = ""; });
      chartState.settings = null; chartState.revealed = 0; chartState.selected = -1;
      feedback.textContent = "차트 설정을 비웠습니다. 관찰 데이터는 그대로입니다."; notifyChart();
    });
    [x.select, y.select, group.select].forEach(function (select) {
      select.addEventListener("change", function () {
        feedback.textContent = chartState.settings ? "설정을 바꿨습니다. ‘분산형 차트 만들기’를 눌러 새 설정을 적용하세요." : "";
      });
    });
    function update() {
      const settings = chartState.settings;
      applied.textContent = settings ? "현재 차트: X = " + settings.x + " / Y = " + settings.y + " / 구분 = " + (settings.group === "none" ? "없음" : settings.group) : "아직 만든 차트가 없습니다. 데이터 범위는 A2:C5입니다.";
    }
    actions.append(build, reset);
    panel.append(controls, actions, feedback, applied, node("p", "widget-note", "목표는 두 스위치의 위치를 점의 위치로, 전등 상태를 점의 종류로 나타내는 것입니다."));
    update(); host.replaceChildren(panel); chartSubscribers.push(update);
  };

  window.WIDGETS["dataset-plot"] = function (host) {
    const panel = node("div", "interactive-widget dataset-plot");
    panel.append(node("h3", "widget-title", "한 행씩, 점이 놓이는 위치를 살펴보세요."));
    const legend = node("div", "plot-legend"), plane = node("div", "data-plane"), field = node("div", "plot-field");
    const yTitle = node("p", "plot-y-title", "세로축 · 선택 전"), xTitle = node("p", "plot-x-title", "가로축 · 선택 전");
    [0, 1].forEach(function (value) {
      const xTick = node("span", "plot-x-tick plot-tick-" + value, String(value));
      const yTick = node("span", "plot-y-tick plot-tick-" + value, String(value));
      const vertical = node("span", "plot-grid-line plot-grid-x plot-x-" + value);
      const horizontal = node("span", "plot-grid-line plot-grid-y plot-y-" + value);
      [xTick, yTick, vertical, horizontal].forEach(function (element) { element.setAttribute("aria-hidden", "true"); });
      field.append(vertical, horizontal, xTick, yTick);
    });
    const readout = node("output", "plot-readout"); readout.setAttribute("aria-live", "polite");
    const progress = node("p", "widget-note");
    const feedback = node("p", "quiz-feedback"); feedback.setAttribute("role", "status");
    const rowPicker = node("div", "plot-row-picker");
    rowPicker.setAttribute("role", "group"); rowPicker.setAttribute("aria-label", "표시한 데이터 행 선택");
    const rowButtons = [];
    const buttons = [0, 1, 2, 3].map(function (index) {
      const button = node("button", "plot-point"); button.type = "button"; button.dataset.observation = String(index);
      const marker = node("span", "plot-marker"); marker.setAttribute("aria-hidden", "true"); button.append(marker);
      const rowButton = node("button", "button", (index + 2) + "행"); rowButton.type = "button"; rowButton.dataset.plotRow = String(index);
      function selectRow() { chartState.selected = index; update(); }
      button.addEventListener("click", selectRow); rowButton.addEventListener("click", selectRow);
      rowButtons.push(rowButton); rowPicker.append(rowButton); field.append(button);
      return button;
    });
    const actions = node("div", "lab-actions");
    const next = node("button", "button button-primary", "다음 행 표시"); next.type = "button";
    next.addEventListener("click", function () {
      if (!chartState.settings || chartState.revealed >= 4) return;
      chartState.selected = chartState.revealed; chartState.revealed += 1; update();
    });
    const showAll = node("button", "button", "네 행 모두 표시"); showAll.type = "button";
    showAll.addEventListener("click", function () { if (chartState.settings) { chartState.revealed = 4; update(); } });
    const check = node("button", "button", "차트 구성 확인"); check.type = "button";
    check.addEventListener("click", function () {
      const settings = chartState.settings;
      if (!settings) { feedback.textContent = "먼저 위에서 차트를 만드세요."; return; }
      if (settings.x === "target" || settings.y === "target") feedback.textContent = "현재는 전등 상태가 좌표축에 들어갔습니다. 두 축에는 두 스위치 위치를, 점의 구분에는 전등 상태를 놓아보세요.";
      else if (settings.group !== "target") feedback.textContent = "두 입력으로 위치를 잘 정했습니다. 켜짐과 꺼짐을 구별하려면 점의 색·모양 기준을 target으로 바꿔보세요.";
      else if (chartState.revealed < 4) feedback.textContent = "축과 점의 구분을 잘 선택했습니다. 남은 행도 모두 표시해보세요.";
      else {
        const problem = sheetDataProblem();
        feedback.textContent = problem || (settings.x === "x1" ? "네 점을 완성했습니다. 가로는 x1, 세로는 x2, 점의 종류는 target입니다." : "두 입력과 정답을 잘 구분했습니다. 두 축을 바꿔도 올바른 산점도입니다. 수업의 기준 배치는 가로 x1·세로 x2입니다.");
      }
    });
    actions.append(next, showAll, check);
    function update() {
      const rows = sheetRows(), settings = chartState.settings;
      feedback.textContent = "";
      if (chartState.selected >= 0 && (!rows[chartState.selected] || chartState.selected >= chartState.revealed)) chartState.selected = -1;
      plane.hidden = !settings; legend.hidden = !settings; rowPicker.hidden = !settings;
      next.disabled = !settings || chartState.revealed >= 4; showAll.disabled = !settings || chartState.revealed >= 4;
      buttons.forEach(function (button, index) {
        const row = rows[index], visible = !!settings && index < chartState.revealed && !!row;
        button.hidden = !visible; rowButtons[index].hidden = !settings || index >= chartState.revealed; rowButtons[index].disabled = !row;
        button.setAttribute("aria-pressed", String(chartState.selected === index)); rowButtons[index].setAttribute("aria-pressed", String(chartState.selected === index));
        rowButtons[index].textContent = (index + 2) + "행" + (!row ? " · 입력 확인" : "");
        rowButtons[index].setAttribute("aria-label", rowButtons[index].textContent);
        if (!visible) return;
        const x = chartValue(row, settings.x), y = chartValue(row, settings.y);
        const category = settings.group === "none" ? 0 : chartValue(row, settings.group);
        button.className = "plot-point plot-x-" + x + " plot-y-" + y + " plot-class-" + category;
        const label = (index + 2) + "행: " + settings.x + " " + x + ", " + settings.y + " " + y + (settings.group === "none" ? ", 구분 없음" : ", " + settings.group + " " + category);
        button.setAttribute("aria-label", label); rowButtons[index].setAttribute("aria-label", label);
      });
      if (!settings) {
        legend.replaceChildren(); progress.textContent = "";
        readout.textContent = "위에서 축과 점의 구분을 선택하고 ‘분산형 차트 만들기’를 누르세요."; return;
      }
      xTitle.textContent = "가로 · " + chartColumn(settings.x).label; yTitle.textContent = "세로 · " + chartColumn(settings.y).label;
      legend.replaceChildren();
      const group = chartColumn(settings.group);
      (group ? [0, 1] : [0]).forEach(function (value) {
        const item = node("span", "plot-legend-item plot-class-" + value);
        const marker = node("span", "plot-marker"); marker.setAttribute("aria-hidden", "true");
        item.append(marker, node("span", "", group ? group.key + " = " + value + " · " + group.values[value] : "모든 행 · 구분 없음")); legend.append(item);
      });
      const visibleRows = rows.slice(0, chartState.revealed).filter(Boolean);
      const duplicate = new Set(visibleRows.map(function (row) { return chartValue(row, settings.x) + "," + chartValue(row, settings.y); })).size !== visibleRows.length;
      progress.textContent = "살펴본 행 " + chartState.revealed + " / 4 · 표시한 기록 " + visibleRows.length + "개" + (duplicate ? " · 같은 좌표의 점이 겹칩니다. 행 버튼으로 각각 확인하세요." : "");
      if (chartState.selected < 0) readout.textContent = visibleRows.length ? "점이나 행 버튼을 선택하면 표의 값과 좌표를 확인할 수 있습니다." : "표에 빈칸이나 0·1 이외의 값이 있습니다. 데이터 표를 확인하세요.";
      else {
        const row = rows[chartState.selected], x = chartValue(row, settings.x), y = chartValue(row, settings.y);
        readout.textContent = (chartState.selected + 2) + "행 [" + row.join(", ") + "] → 좌표 (" + x + ", " + y + ")" + (group ? " · " + group.key + " = " + chartValue(row, settings.group) + " · " + group.values[chartValue(row, settings.group)] : " · 점의 구분 없음");
      }
    }
    plane.append(yTitle, field, xTitle);
    const workspace = node("div", "plot-workspace"), visual = node("div", "plot-visual"), inspector = node("div", "plot-inspector");
    visual.append(legend, plane);
    inspector.append(actions, rowPicker, progress, readout, feedback, node("p", "widget-note", "그래프는 내가 고른 열과 입력한 값을 그대로 표시합니다. 표를 수정하면 그래프도 바뀝니다. 겹친 점은 행 버튼으로 선택할 수 있습니다."));
    workspace.append(visual, inspector); panel.append(workspace);
    update(); host.replaceChildren(panel); sheetSubscribers.push(update); chartSubscribers.push(update);
  };

  window.WIDGETS["dataset-check"] = function (host) {
    const panel = node("div", "interactive-widget dataset-check");
    panel.append(node("h3", "widget-title", "입력과 정답을 구분할 수 있나요?"));
    const count = lessonSelect("한 기록에서 모델에 넣는 입력은 몇 개인가요?", [["", "선택하세요"], ["2", "2개: x1과 x2"], ["3", "3개: x1, x2, target"]]);
    const axis = lessonSelect("이 수업의 기준 배치에서 세로축에 놓는 값은 무엇인가요?", [["", "선택하세요"], ["target", "전등 정답 target"], ["x2", "위층 위치 x2"]]);
    const feedback = node("p", "quiz-feedback");
    feedback.setAttribute("role", "status");
    const check = node("button", "button button-primary", "입력과 정답 확인");
    check.type = "button";
    check.addEventListener("click", function () {
      if (!count.select.value || !axis.select.value) feedback.textContent = "두 질문에 모두 답해보세요.";
      else if (count.select.value === "2" && axis.select.value === "x2") feedback.textContent = "맞았습니다. 입력은 x1·x2 두 개이고, 세로축은 x2입니다. target은 관찰한 정답으로 점의 종류를 구분합니다.";
      else feedback.textContent = "입력은 두 스위치의 위치입니다. 전등 상태는 맞혀야 할 정답입니다. 산점도의 두 축에는 두 입력을 놓는다는 점을 다시 확인하세요.";
    });
    [count.select, axis.select].forEach(function (select) { select.addEventListener("change", function () { feedback.textContent = ""; }); });
    panel.append(count.label, axis.label, check, feedback);
    host.replaceChildren(panel);
  };

  const mounted = new WeakSet();
  function mountWidgets(root = document) {
    const elements = Array.from(root.querySelectorAll("[data-widget]"));
    if (root instanceof Element && root.matches("[data-widget]")) elements.unshift(root);
    elements.forEach(function (host) {
      if (mounted.has(host) || host.closest("[hidden]")) return;
      const name = host.dataset.widget;
      const factory = Object.prototype.hasOwnProperty.call(window.WIDGETS, name) ? window.WIDGETS[name] : undefined;
      if (typeof factory !== "function") return;
      const fallback = Array.from(host.childNodes);
      try {
        factory(host, window.SITE || {});
        mounted.add(host);
        host.dataset.widgetReady = "true";
      } catch (_) {
        host.replaceChildren.apply(host, fallback);
        host.dataset.widgetReady = "false";
      }
    });
  }
  window.mountWidgets = mountWidgets;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { mountWidgets(); }, { once: true });
  else mountWidgets();
})();
