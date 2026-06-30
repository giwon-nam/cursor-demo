import test from "node:test";
import assert from "node:assert";
import { login } from "./login.js";
import { hashPassword } from "../entity/auth.js";

/**
 * 테스트용 사용자 맵을 만든다.
 * @param {string} email - 이메일
 * @param {string} password - 평문 비밀번호
 * @returns {Map<string, string>} 이메일(소문자) -> "salt:hash"
 */
function makeUsers(email, password) {
    return new Map([[email.toLowerCase(), hashPassword(password)]]);
}

test("login은 올바른 자격증명에 200과 토큰을 반환한다", () => {
    const users = makeUsers("user@example.com", "pw");
    const result = login({ email: "user@example.com", password: "pw", clientKey: "k1", users });
    assert.strictEqual(result.status, 200);
    assert.strictEqual(typeof result.body.token, "string");
});

test("login은 틀린 비밀번호에 401을 반환한다", () => {
    const users = makeUsers("user@example.com", "pw");
    const result = login({ email: "user@example.com", password: "wrong", clientKey: "k2", users });
    assert.strictEqual(result.status, 401);
});

test("login은 잘못된 이메일 형식에 400을 반환한다", () => {
    const users = makeUsers("user@example.com", "pw");
    const result = login({ email: "not-an-email", password: "pw", clientKey: "k3", users });
    assert.strictEqual(result.status, 400);
});

test("login은 속도 제한 초과 시 429를 반환한다", () => {
    const users = makeUsers("user@example.com", "pw");
    const clientKey = "k4";
    // 한도(5회)까지는 401, 6회째에 429
    for (let i = 0; i < 5; i += 1) {
        login({ email: "user@example.com", password: "wrong", clientKey, users });
    }
    const result = login({ email: "user@example.com", password: "wrong", clientKey, users });
    assert.strictEqual(result.status, 429);
});
