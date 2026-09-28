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
