import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// scrypt 파라미터
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * 비밀번호를 임의 솔트와 함께 scrypt로 해싱한다.
 * @param {string} password - 평문 비밀번호
 * @returns {string} "salt:hash" 형식의 저장용 문자열 (둘 다 hex)
 */
function hashPassword(password) {
    if (typeof password !== "string" || password.length === 0) {
        throw new TypeError("비밀번호는 비어 있지 않은 문자열이어야 합니다.");
    }
    const salt = randomBytes(SALT_BYTES).toString("hex");
    const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
    return `${salt}:${hash}`;
}

/**
 * 평문 비밀번호가 저장된 해시와 일치하는지 타이밍 공격에 안전하게 검증한다.
 * @param {string} password - 검증할 평문 비밀번호
 * @param {string} stored - hashPassword가 만든 "salt:hash" 문자열
 * @returns {boolean} 일치하면 true
 */
function verifyPassword(password, stored) {
    if (typeof password !== "string" || typeof stored !== "string") {
        return false;
    }
    const separatorIndex = stored.indexOf(":");
    if (separatorIndex === -1) {
        return false;
    }
    const salt = stored.slice(0, separatorIndex);
    const hashHex = stored.slice(separatorIndex + 1);
    if (!salt || !hashHex) {
        return false;
    }
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    // 길이가 다르면 timingSafeEqual이 예외를 던지므로 먼저 비교한다.
    if (expected.length !== actual.length) {
        return false;
    }
    return timingSafeEqual(expected, actual);
}

export { hashPassword, verifyPassword };
