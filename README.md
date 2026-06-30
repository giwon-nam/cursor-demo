# cursor-demo

이메일 추출/검증 유틸리티 데모 프로젝트입니다. RFC 5322 권장 정규식 기반 검증과 ES Modules를 사용합니다.
강의 자료: kznetwork

## 설치 및 실행

```bash
# 데모 실행
node src/index.js

# 테스트 실행
npm test
```

## API

`src/email.js` 모듈에서 다음 함수를 제공합니다.

| 함수 | 설명 | 반환값 |
| --- | --- | --- |
| `isValidEmail(email)` | RFC 5322 권장 정규식 + 길이 제한(전체 254자, local-part 64자)으로 형식 검증 | `boolean` |
| `extractEmails(users)` | 사용자 배열에서 `email` 값만 추출 (배열이 아니면 빈 배열) | `string[]` |
| `getValidEmails(users)` | 유효한 이메일만 필터링해 반환 | `string[]` |
| `getEmailDomain(email)` | 이메일에서 도메인(@ 뒤)을 소문자로 추출 (유효하지 않으면 `null`) | `string \| null` |

### 사용 예시

```javascript
import { getValidEmails, getEmailDomain } from "./src/email.js";

const users = [
  { email: "alice@example.com" },
  { email: "bob@invalid" },
];

getValidEmails(users);            // ["alice@example.com"]
getEmailDomain("alice@example.com"); // "example.com"
```

---

## 릴리스 노트

### v1.0.0

이메일 추출·검증 유틸리티를 도입하고 프로젝트를 ES Modules 기반으로 전환한 첫 기능 릴리스입니다.

#### ✨ 기능
- 이메일 유틸리티 모듈(`src/email.js`) 신규 추가
  - `isValidEmail` — RFC 5322 권장 정규식 + 길이 제한 기반 형식 검증
  - `extractEmails` — 사용자 배열에서 이메일만 추출
  - `getValidEmails` — 유효한 이메일만 필터링해 반환
  - `getEmailDomain` — 이메일에서 도메인을 소문자로 추출

#### 🧹 기타
- CommonJS → ES Modules로 전체 마이그레이션 (`type: module`, `import/export`)
- `node:test` 기반 테스트 추가 (총 7개, 외부 의존성 없음)
- 프로젝트 공통 코딩 규칙(`.cursor/rules/coding-style.mdc`) 추가

#### 🐛 버그 수정
- 해당 없음
