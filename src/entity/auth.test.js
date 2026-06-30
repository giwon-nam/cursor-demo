import test from "node:test";
import assert from "node:assert";
import { hashPassword, verifyPassword } from "./auth.js";

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
