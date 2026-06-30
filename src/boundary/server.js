import http from "node:http";
import { pathToFileURL } from "node:url";
import { login, sessions } from "../control/login.js";
import { loadUsers } from "./users.js";

// 요청 본문 최대 크기 (DoS 완화)
const MAX_BODY_BYTES = 1024;

// 사용자 자격증명 로드 (Boundary에서 외부 환경을 읽어 Control에 주입)
const users = loadUsers();

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
 * 로그인 요청을 처리한다. 본문을 파싱해 Control(login)에 위임하고 결과를 HTTP로 변환한다.
 * @param {http.IncomingMessage} req - HTTP 요청
 * @param {http.ServerResponse} res - HTTP 응답
 * @returns {Promise<void>}
 */
async function handleLogin(req, res) {
    let body;
    try {
        body = await readJsonBody(req, MAX_BODY_BYTES);
    } catch (err) {
        const status = err.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
        sendJson(res, status, { error: "잘못된 요청입니다." });
        return;
    }

    const clientKey = req.socket.remoteAddress ?? "unknown";
    const result = login({ email: body?.email, password: body?.password, clientKey, users });
    sendJson(res, result.status, result.body);
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
