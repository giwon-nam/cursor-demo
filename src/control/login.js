import { randomBytes } from "node:crypto";
import { isValidEmail } from "../entity/email.js";
import { verifyPassword, hashPassword } from "../entity/auth.js";

// 비밀번호 최대 길이 (긴 입력으로 인한 scrypt CPU 고갈 방지)
const MAX_PASSWORD_LENGTH = 128;

// 로그인 속도 제한 설정 (온라인 brute-force 완화)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const loginAttempts = new Map();

// 미존재 사용자도 동일한 scrypt 비용을 치르도록 하는 더미 자격증명 (타이밍 기반 사용자 열거 방지)
const DUMMY_CREDENTIAL = hashPassword(randomBytes(32).toString("hex"));

// 메모리 기반 세션 저장소 (데모용)
const sessions = new Map();

/**
 * 주어진 키(클라이언트 IP 등)가 속도 제한을 초과했는지 확인하고 시도 횟수를 증가시킨다.
 * @param {string} key - 제한 기준 키
 * @returns {boolean} 허용되면 true, 한도를 초과하면 false
 */
function checkRateLimit(key) {
    const now = Date.now();
    const entry = loginAttempts.get(key);
    if (!entry || now > entry.resetAt) {
        loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }
    entry.count += 1;
    return true;
}

/**
 * 로그인 성공 시 해당 키의 시도 횟수 기록을 초기화한다.
 * @param {string} key - 제한 기준 키
 * @returns {void}
 */
function clearRateLimit(key) {
    loginAttempts.delete(key);
}

/**
 * 로그인 유스케이스를 처리한다. HTTP에 의존하지 않고 입력 값만 받아 결정을 반환한다.
 * @param {object} input - 로그인 입력
 * @param {unknown} input.email - 요청 이메일
 * @param {unknown} input.password - 요청 비밀번호
 * @param {string} input.clientKey - 속도 제한 기준 키 (예: 클라이언트 IP)
 * @param {Map<string, string>} input.users - 이메일(소문자) -> "salt:hash" 맵
 * @returns {{status: number, body: object}} HTTP 상태 코드와 응답 본문
 */
function login({ email, password, clientKey, users }) {
    // 속도 제한 (클라이언트 키 기준)
    if (!checkRateLimit(clientKey)) {
        return { status: 429, body: { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." } };
    }

    // 입력 형식 검증 (비밀번호 길이 상한 포함)
    if (
        !isValidEmail(email) ||
        typeof password !== "string" ||
        password.length === 0 ||
        password.length > MAX_PASSWORD_LENGTH
    ) {
        return { status: 400, body: { error: "이메일 또는 비밀번호 형식이 올바르지 않습니다." } };
    }

    // 사용자 조회 및 비밀번호 검증
    // 미존재 사용자도 더미 자격증명으로 verifyPassword를 호출해 동일한 scrypt 비용을 치른다 (타이밍 기반 사용자 열거 방지).
    const stored = users.get(email.toLowerCase());
    const credential = stored ?? DUMMY_CREDENTIAL;
    const passwordMatches = verifyPassword(password, credential);
    const authenticated = passwordMatches && stored !== undefined;
    if (!authenticated) {
        return { status: 401, body: { error: "인증에 실패했습니다." } };
    }

    // 인증 성공 시 속도 제한 기록 초기화
    clearRateLimit(clientKey);

    // 세션 토큰 발급
    const token = randomBytes(32).toString("hex");
    sessions.set(token, { email: email.toLowerCase(), createdAt: Date.now() });
    return { status: 200, body: { token } };
}

export { login, checkRateLimit, clearRateLimit, sessions };
