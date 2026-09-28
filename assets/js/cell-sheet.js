/* Small arithmetic worksheet: numbers, cell references, + - * /, (), SUM.
 * Deliberately parses formulas without evaluating JavaScript. No dependencies.
 */
(function () {
  "use strict";
  window.CellSheet = {
    create: function (addresses) {
      const cells = new Map(addresses.map(function (address) { return [address, ""]; }));
      function fail(message) { throw new Error(message); }
      function calculate(address, path) {
        if (!cells.has(address)) fail("없는 셀: " + address);
        if (path.includes(address)) fail("순환 참조: " + address);
        if (path.length > 32) fail("참조 단계가 너무 많습니다.");
        const raw = cells.get(address).trim();
        if (!raw) fail(address + " 입력 필요");
        if (raw.length > 200) fail("수식은 200자 이내로 입력하세요.");
        const nextPath = path.concat(address);
        const numeric = /^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?$/i;
        if (raw[0] !== "=") {
          if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?$/i.test(raw)) fail("숫자 또는 =로 시작하는 수식을 입력하세요.");
          const value = Number(raw);
          if (!Number.isFinite(value)) fail("계산 가능한 수의 범위를 벗어났습니다.");
          return value;
        }
        const source = raw.slice(1).toUpperCase();
        const tokens = [];
        const pattern = /\s*(\d+(?:\.\d*)?(?:E[+-]?\d+)?|\.\d+(?:E[+-]?\d+)?|[A-Z]+[0-9]*|[+*/(),:\-])/y;
        let cursor = 0;
        while (source.slice(cursor).trim()) {
          pattern.lastIndex = cursor;
          const match = pattern.exec(source);
          if (!match) fail("지원하지 않는 기호가 있습니다.");
          tokens.push(match[1]);
          cursor = pattern.lastIndex;
        }
        let index = 0;
        function take(expected) {
          if (tokens[index] !== expected) fail(expected + " 기호를 확인하세요.");
          index += 1;
        }
        function range(start, end) {
          const a = /^([A-Z])(\d+)$/.exec(start), b = /^([A-Z])(\d+)$/.exec(end || "");
          if (!a || !b) fail("셀 범위를 확인하세요.");
          const firstRow = Number(a[2]), lastRow = Number(b[2]);
          const firstCol = a[1].charCodeAt(0), lastCol = b[1].charCodeAt(0);
          if (firstRow > lastRow || firstCol > lastCol || (lastRow - firstRow + 1) * (lastCol - firstCol + 1) > 100) fail("셀 범위를 확인하세요.");
          let total = 0;
          for (let row = firstRow; row <= lastRow; row += 1) {
            for (let col = firstCol; col <= lastCol; col += 1) total += calculate(String.fromCharCode(col) + row, nextPath);
          }
          return total;
        }
        function primary() {
          const token = tokens[index++];
          if (token === "+") return primary();
          if (token === "-") return -primary();
          if (token === "(") { const value = expression(); take(")"); return value; }
          if (token === "SUM") {
            take("(");
            let total = 0;
            while (true) {
              if (/^[A-Z]+\d+$/.test(tokens[index] || "") && tokens[index + 1] === ":") {
                const start = tokens[index];
                index += 2;
                total += range(start, tokens[index++]);
              } else total += expression();
              if (tokens[index] !== ",") break;
              index += 1;
            }
            take(")");
            return total;
          }
          if (numeric.test(token || "")) return Number(token);
          if (/^[A-Z]+\d+$/.test(token || "")) return calculate(token, nextPath);
          fail("수식을 확인하세요. 함수는 SUM을 사용할 수 있습니다.");
        }
        function product() {
          let value = primary();
          while (tokens[index] === "*" || tokens[index] === "/") {
            const operator = tokens[index++], right = primary();
            if (operator === "/" && right === 0) fail("0으로 나눌 수 없습니다.");
            value = operator === "*" ? value * right : value / right;
          }
          return value;
        }
        function expression() {
          let value = product();
          while (tokens[index] === "+" || tokens[index] === "-") {
            const operator = tokens[index++], right = product();
            value = operator === "+" ? value + right : value - right;
          }
          return value;
        }
        const value = expression();
        if (index !== tokens.length) fail("수식의 끝을 확인하세요.");
        if (!Number.isFinite(value)) fail("계산 가능한 수의 범위를 벗어났습니다.");
        return value;
      }
      return {
        raw: function (address) { return cells.get(address); },
        set: function (changes) {
          Object.keys(changes).forEach(function (address) { if (!cells.has(address)) fail("없는 셀: " + address); });
          Object.keys(changes).forEach(function (address) { cells.set(address, String(changes[address])); });
        },
        reset: function () { cells.forEach(function (_, address) { cells.set(address, ""); }); },
        read: function (address) {
          if (cells.has(address) && !cells.get(address).trim()) return { status: "blank", message: "입력 전" };
          try { return { status: "value", value: calculate(address, []) }; }
          catch (error) { return { status: "error", message: error.message }; }
        }
      };
    }
  };
})();
