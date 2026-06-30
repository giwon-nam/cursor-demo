import test from "node:test";
import assert from "node:assert";
import { isValidEmail, extractEmails, getValidEmails, getEmailDomain } from "./email.js";

test("isValidEmail은 올바른 형식의 이메일에 true를 반환한다", () => {
    assert.strictEqual(isValidEmail("alice@example.com"), true);
});

test("isValidEmail은 잘못된 형식의 이메일에 false를 반환한다", () => {
    assert.strictEqual(isValidEmail("bob@invalid"), false);
    assert.strictEqual(isValidEmail("no-at-sign.com"), false);
    assert.strictEqual(isValidEmail(""), false);
    assert.strictEqual(isValidEmail(null), false);
    assert.strictEqual(isValidEmail(123), false);
});

test("extractEmails는 사용자 배열에서 이메일만 추출한다", () => {
    const users = [
        { email: "alice@example.com" },
        { email: "bob@invalid" },
    ];
    assert.deepStrictEqual(extractEmails(users), [
        "alice@example.com",
        "bob@invalid",
    ]);
});

test("extractEmails는 배열이 아닌 입력에 빈 배열을 반환한다", () => {
    assert.deepStrictEqual(extractEmails(null), []);
    assert.deepStrictEqual(extractEmails(undefined), []);
    assert.deepStrictEqual(extractEmails("not-an-array"), []);
});

test("getValidEmails는 유효한 이메일만 추출한다", () => {
    const users = [
        { email: "alice@example.com" },
        { email: "bob@invalid" },
        { email: "carol@example.org" },
    ];
    assert.deepStrictEqual(getValidEmails(users), [
        "alice@example.com",
        "carol@example.org",
    ]);
});

test("getEmailDomain은 유효한 이메일에서 도메인을 소문자로 추출한다", () => {
    assert.strictEqual(getEmailDomain("alice@example.com"), "example.com");
    assert.strictEqual(getEmailDomain("Bob@Example.COM"), "example.com");
});

test("getEmailDomain은 유효하지 않은 이메일에 null을 반환한다", () => {
    assert.strictEqual(getEmailDomain("bob@invalid"), null);
    assert.strictEqual(getEmailDomain("no-at-sign.com"), null);
    assert.strictEqual(getEmailDomain(null), null);
});
