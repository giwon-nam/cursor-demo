import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const payload = await new Response(process.stdin).text();
const logFile = '.cursor/hooks/audit.log';
const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

mkdirSync(dirname(logFile), { recursive: true });
appendFileSync(logFile, `[${timestamp}] block-rm: ${payload}\n`);

const match = payload.match(/"command"\s*:\s*"([^"]*)"/);
const cmd = match?.[1] ?? '';

if (/rm\s+-rf/.test(cmd)) {
  console.log(JSON.stringify({
    permission: 'deny',
    user_message: "위험: 'rm -rf' 명령이 훅에 의해 차단되었습니다.",
    agent_message: '파괴적 삭제 명령은 정책상 차단됩니다. 안전한 대안을 제안하세요.',
  }));
} else {
  console.log(JSON.stringify({ permission: 'allow' }));
}
