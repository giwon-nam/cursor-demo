import test from "node:test";
import assert from "node:assert";
import { hashPassword, verifyPassword, loadUsers } from "./auth.js";

test("hashPassword와 verifyPassword는 동일 비밀번호를 검증한다", () => {
    const stored = hashPassword("s3cret-pass");
    assert.strictEqual(verifyPassword("s3cret-pass", stored), true);
});

test("verifyPassword는 틀린 비밀번호에 false를 반환한다", () => {
    const stored = hashPassword("s3cret-pass");
    assert.strictEqual(verifyPassword("wrong-pass", stored), false);
});

test("hashPassword는 같은 비밀번호라도 매번 다른 해시를 만든다 (솔트)", () => {
    assert.notStrictEqual(hashPassword("same"), hashPassword("same"));
});

test("verifyPassword는 형식이 잘못된 입력에 false를 반환한다", () => {
    assert.strictEqual(verifyPassword("pw", "no-separator"), false);
    assert.strictEqual(verifyPassword(null, "salt:hash"), false);
    assert.strictEqual(verifyPassword("pw", ""), false);
});

test("loadUsers는 DEMO_USERS 환경변수를 파싱한다", () => {
    const original = process.env.DEMO_USERS;
    const credential = hashPassword("pw");
    process.env.DEMO_USERS = `Admin@Example.com:${credential}`;
    try {
        const users = loadUsers();
        assert.strictEqual(users.has("admin@example.com"), true);
        assert.strictEqual(verifyPassword("pw", users.get("admin@example.com")), true);
    } finally {
        if (original === undefined) {
            delete process.env.DEMO_USERS;
        } else {
            process.env.DEMO_USERS = original;
        }
    }
});
