// RFC 5322 공식 표준 정규식 (RFC 1035의 "preferred" 도메인 문법 반영)
// 출처: https://www.regular-expressions.info/email.html
const RFC5322_EMAIL =
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

/**
 * 이메일 형식이 RFC 5322 권장안에 맞는지 검증한다.
 * @param {unknown} email - 검증할 값
 * @returns {boolean} 유효한 이메일이면 true
 */
function isValidEmail(email) {
    // RFC 5322 권장 정규식 + 길이 제한(전체 254자, local-part 64자)
    if (typeof email !== "string" || email.length > 254) {
        return false;
    }
    const localPart = email.slice(0, email.lastIndexOf("@"));
    if (localPart.length > 64) {
        return false;
    }
    return RFC5322_EMAIL.test(email);
}

/**
 * 사용자 배열에서 email 값만 추출한다.
 * @param {Array<{email?: string}>} users - 사용자 객체 배열
 * @returns {string[]} 추출된 이메일 배열 (배열이 아니면 빈 배열)
 */
function extractEmails(users) {
    if (!Array.isArray(users)) {
        return [];
    }
    return users.map(user => user.email);
}

/**
 * 사용자 배열에서 유효한 이메일만 추출한다.
 * @param {Array<{email?: string}>} users - 사용자 객체 배열
 * @returns {string[]} 유효한 이메일만 담은 배열
 */
function getValidEmails(users) {
    return extractEmails(users).filter(isValidEmail);
}

/**
 * 이메일 주소에서 도메인 부분(@ 뒤)을 추출한다.
 * @param {unknown} email - 도메인을 추출할 이메일
 * @returns {string|null} 소문자 도메인 문자열, 유효하지 않으면 null
 */
function getEmailDomain(email) {
    if (!isValidEmail(email)) {
        return null;
    }
    // 유효한 이메일은 마지막 @ 뒤가 도메인이다.
    return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

export { isValidEmail, extractEmails, getValidEmails, getEmailDomain };
