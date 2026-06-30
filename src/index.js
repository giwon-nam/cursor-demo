import { extractEmails, getValidEmails, getEmailDomain } from "./email.js";

console.log('hello cursor');

// 데모용 사용자 데이터
const users = [
    { email: "alice@example.com" },
    { email: "bob@invalid" },
    { email: "carol@example.org" },
];

console.log("추출된 이메일:", extractEmails(users));
console.log("유효한 이메일:", getValidEmails(users));
console.log("첫 사용자 도메인:", getEmailDomain(users[0].email));
