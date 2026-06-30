import test from "node:test";
import assert from "node:assert";
import { loadUsers } from "./users.js";
import { hashPassword, verifyPassword } from "../entity/auth.js";

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
