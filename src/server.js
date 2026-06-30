import http from "node:http";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { isValidEmail } from "./email.js";
import { verifyPassword, loadUsers, hashPassword } from "./auth.js";

// 요청 본문 최대 크기 (DoS 완화)
const MAX_BODY_BYTES = 1024;

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
const users = loadUsers();

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
 * 요청 본문을 크기 제한과 함께 읽어 JSON으로 파싱한다.
 * @param {http.IncomingMessage} req - HTTP 요청
 * @param {number} maxBytes - 허용할 최대 바이트 수
 * @returns {Promise<object>} 파싱된 JSON 객체
 */
function readJsonBody(req, maxBytes) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on("data", (chunk) => {
            size += chunk.length;
            if (size > maxBytes) {
                reject(new Error("PAYLOAD_TOO_LARGE"));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => {
            try {
                const text = Buffer.concat(chunks).toString("utf8");
                resolve(text ? JSON.parse(text) : {});
            } catch {
                reject(new Error("INVALID_JSON"));
            }
        });
        req.on("error", reject);
    });
}

/**
 * JSON 응답을 전송한다.
 * @param {http.ServerResponse} res - HTTP 응답
 * @param {number} status - HTTP 상태 코드
 * @param {object} payload - 직렬화할 응답 본문
 * @returns {void}
 */
function sendJson(res, status, payload) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload));
}

/**
 * 로그인 요청을 처리한다. 이메일/비밀번호를 검증하고 세션 토큰을 발급한다.
 * @param {http.IncomingMessage} req - HTTP 요청
 * @param {http.ServerResponse} res - HTTP 응답
 * @returns {Promise<void>}
 */
async function handleLogin(req, res) {
    // 속도 제한 (클라이언트 IP 기준)
    const clientKey = req.socket.remoteAddress ?? "unknown";
    if (!checkRateLimit(clientKey)) {
        sendJson(res, 429, { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." });
        return;
    }

    let body;
    try {
        body = await readJsonBody(req, MAX_BODY_BYTES);
    } catch (err) {
        const status = err.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
        sendJson(res, status, { error: "잘못된 요청입니다." });
        return;
    }

    const email = body?.email;
    const password = body?.password;

    // 입력 형식 검증 (비밀번호 길이 상한 포함)
    if (
        !isValidEmail(email) ||
        typeof password !== "string" ||
        password.length === 0 ||
        password.length > MAX_PASSWORD_LENGTH
    ) {
        sendJson(res, 400, { error: "이메일 또는 비밀번호 형식이 올바르지 않습니다." });
        return;
    }

    // 사용자 조회 및 비밀번호 검증
    // 미존재 사용자도 더미 자격증명으로 verifyPassword를 호출해 동일한 scrypt 비용을 치른다 (타이밍 기반 사용자 열거 방지).
    const stored = users.get(email.toLowerCase());
    const credential = stored ?? DUMMY_CREDENTIAL;
    const passwordMatches = verifyPassword(password, credential);
    const authenticated = passwordMatches && stored !== undefined;
    if (!authenticated) {
        sendJson(res, 401, { error: "인증에 실패했습니다." });
        return;
    }

    // 인증 성공 시 속도 제한 기록 초기화
    clearRateLimit(clientKey);

    // 세션 토큰 발급
    const token = randomBytes(32).toString("hex");
    sessions.set(token, { email: email.toLowerCase(), createdAt: Date.now() });
    sendJson(res, 200, { token });
}

const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/login") {
        handleLogin(req, res);
        return;
    }
    sendJson(res, 404, { error: "찾을 수 없습니다." });
});

// 이 파일을 직접 실행할 때만 서버를 기동한다 (테스트 시 import에서는 기동하지 않음).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const port = Number(process.env.PORT) || 3000;
    server.listen(port, () => {
        console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
    });
}

export { server, handleLogin, sessions };
