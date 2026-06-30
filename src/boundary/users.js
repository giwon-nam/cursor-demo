/**
 * 환경변수 DEMO_USERS에서 사용자 자격증명 맵을 로드한다.
 * 비밀번호 해시는 코드에 하드코딩하지 않고 외부 환경에서 주입받는다.
 * 형식: "email:salt:hash,email2:salt:hash2"
 * @returns {Map<string, string>} 이메일(소문자) -> "salt:hash"
 */
function loadUsers() {
    const raw = process.env.DEMO_USERS ?? "";
    const users = new Map();
    for (const entry of raw.split(",").map(item => item.trim()).filter(Boolean)) {
        const separatorIndex = entry.indexOf(":");
        if (separatorIndex === -1) {
            continue;
        }
        const email = entry.slice(0, separatorIndex).toLowerCase();
        const credential = entry.slice(separatorIndex + 1);
        if (email && credential.includes(":")) {
            users.set(email, credential);
        }
    }
    return users;
}

export { loadUsers };
