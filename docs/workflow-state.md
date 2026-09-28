# 강의 제작 상태

## 사용자 승인 범위

- 2026-09-28 대화: 기본 15차시 + 선택 심화 5개, 대단원 5개, 계단 조명의 XOR 문제를 중심으로 하는 과정 확정.
- 이번 실행 지시: “이제 1-1부터 시작해보자. 코드는 복사가능하도록. 한 개의 소단원이 끝나면 내가 직접 확인할꺼야. 그 후 다음단계로 진행”.
- 실행 단위: 소단원 1-1 한 개. 사용자 확인과 다음 진행 지시 전에는 1-2를 작성하지 않는다.
- WORKFLOW.md의 자료 변환 단계가 아니라 대화에서 설계한 새 강의의 첫 소단원을 제작한다. 사용자 지시에 따라 해당 소단원의 본문·실습·복사 코드·검증을 함께 수행했다.

## 현재 상태

- 작성: `index.html#lesson-1-1`
- 위젯: `staircase-lab`, `observation-notebook`, `lesson-check`
- 코드 정본: `files/lesson-1-1-observation.py`
- 검증: 소스/정본 비교 및 실제 위젯 함수를 호출하는 Node DOM 하네스 14개 검사 통과. UI 렌더링 검사는 별도 미실행.
- 다음: 사용자 확인 대기. 다음 실행 후보는 1-2지만 자동 진행하지 않는다.
- 제한: 연결된 브라우저 없음, Python 런타임 없음. 상세 범위는 `lesson-1-1-verification.md` 참고.
- 커밋·푸시·배포: 수행하지 않음.

## 보호 파일 최초 SHA-256

| 파일 | SHA-256 |
| --- | --- |
| DESIGN.md | C473FCA5C871CAB360DAE65320E6A38189D7E987857CC53700C69E9606A40100 |
| assets/css/base.css | 2B1D4CFCF12DC00C9A65A288D106BB1F6E9C75AB14D900CA24095738B35B25CB |
| assets/css/tokens.css | 6C3EEDE764AE1875570731BA175D569DA58030C7FDA96669FCED3FE36DEB8590 |
| assets/js/shared.js | E74FACE44F5B81E6A96CFA500CA616A089975EB85EF5EF985CE05DB182D75569 |

`data/site.js`의 instructor 값과 기존 다른 강의 링크를 유지한다.
