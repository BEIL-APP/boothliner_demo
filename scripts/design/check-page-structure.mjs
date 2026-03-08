import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const TARGET_EXT = '.tsx';
const TITLE_BASE_TOKENS = ['text-xl', 'sm:text-2xl', 'font-bold', 'tracking-tight'];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && full.endsWith(TARGET_EXT)) out.push(full);
  }
  return out;
}

function toPos(content, idx) {
  const head = content.slice(0, idx);
  const line = head.split('\n').length;
  return line;
}

function hasAllTokens(cls, tokens) {
  return tokens.every((t) => cls.includes(t));
}

function run() {
  const files = walk(PAGES_DIR);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, 'utf8');

    const mb7Matches = [...content.matchAll(/\bmb-7\b/g)];
    for (const m of mb7Matches) {
      violations.push({
        file: rel,
        line: toPos(content, m.index ?? 0),
        rule: 'no-mb-7',
        detail: 'mb-7 대신 mb-8 또는 표준 간격 토큰을 사용하세요.',
      });
    }

    const controlRegex = /<(button|input|select|textarea|a)\b[^>]*className="([^"]*)"[^>]*>/g;
    for (const tagMatch of content.matchAll(controlRegex)) {
      const tag = tagMatch[1] ?? '';
      const cls = tagMatch[2] ?? '';
      const line = toPos(content, tagMatch.index ?? 0);

      const isCompactControl =
        /\b(h-7|h-8)\b/.test(cls) &&
        /(border|bg-|px-|pl-|pr-)/.test(cls) &&
        !/\bw-(7|8)\b/.test(cls);

      if (isCompactControl) {
        violations.push({
          file: rel,
          line,
          rule: 'control-height-token',
          detail: `${tag} 컨트롤 높이는 h-9/h-10/h-11 토큰만 사용하세요.`,
        });
      }

      if (/\brounded-(2xl|3xl)\b/.test(cls)) {
        violations.push({
          file: rel,
          line,
          rule: 'control-radius-token',
          detail: `${tag} 컨트롤은 rounded-xl 이하 토큰을 사용하세요.`,
        });
      }
    }

    const h1Regex = /<h1[^>]*className="([^"]*)"[^>]*>/g;
    for (const match of content.matchAll(h1Regex)) {
      const cls = match[1] ?? '';
      const idx = match.index ?? 0;
      const line = toPos(content, idx);

      if (!hasAllTokens(cls, TITLE_BASE_TOKENS)) continue;

      if (!cls.includes('mb-2')) {
        violations.push({
          file: rel,
          line,
          rule: 'title-mb-2',
          detail: '표준 h1은 mb-2를 포함해야 합니다.',
        });
      }

      const searchStart = idx + match[0].length;
      const near = content.slice(searchStart, searchStart + 350);
      const pMatch = near.match(/<p[^>]*className="([^"]*)"[^>]*>/);
      if (!pMatch) continue;

      const pClass = pMatch[1] ?? '';
      if (pClass.includes('text-sm') && pClass.includes('text-gray-500')) {
        if (!pClass.includes('font-medium')) {
          violations.push({
            file: rel,
            line,
            rule: 'subtitle-font-medium',
            detail: 'h1 바로 아래 설명 문구는 font-medium을 포함해야 합니다.',
          });
        }
        if (pClass.includes('mt-')) {
          violations.push({
            file: rel,
            line,
            rule: 'subtitle-no-mt',
            detail: 'h1 아래 설명 문구는 mt-* 없이 h1의 mb-2로 간격을 맞추세요.',
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    console.log('OK: design structure checks passed.');
    process.exit(0);
  }

  console.log(`Found ${violations.length} design structure issue(s):`);
  for (const v of violations) {
    console.log(`- ${v.file}:${v.line} [${v.rule}] ${v.detail}`);
  }
  process.exit(1);
}

run();
