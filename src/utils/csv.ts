import type { Analytics } from '../types';
import { getBooths } from './localStorage';

export function exportAnalyticsCSV(analytics: Analytics[]): void {
  const booths = getBooths();
  const boothMap = Object.fromEntries(booths.map((b) => [b.id, b.name]));

  const rows: string[][] = [
    ['부스 ID', '부스명', '카테고리', '스캔수', '관심수', '문의수'],
    ...analytics.map((a) => {
      const booth = booths.find((b) => b.id === a.boothId);
      return [
        a.boothId,
        boothMap[a.boothId] ?? '알 수 없음',
        booth?.category ?? '-',
        String(a.scans),
        String(a.favorites),
        String(a.inquiries),
      ];
    }),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `booth-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBoothThreadsCSV(boothId: string, threads: import('../types').Thread[]): void {
  const rows: string[][] = [
    ['스레드 ID', '방문자', '상태', '태그', '마지막 메시지', '업데이트'],
    ...threads
      .filter((t) => t.boothId === boothId)
      .map((t) => {
        const last = t.messages[t.messages.length - 1];
        return [
          t.id,
          t.visitorId === 'user' ? (t.visitorName ?? '로그인 사용자') : '비로그인',
          t.status,
          t.tags.join(' | '),
          last?.text.slice(0, 50) ?? '',
          t.lastUpdated,
        ];
      }),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `threads-${boothId}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLeadsCSV(leads: import('../types').Lead[]): void {
  const booths = getBooths();
  const boothMap = Object.fromEntries(booths.map((b) => [b.id, b.name]));

  const rows: string[][] = [
    ['리드 ID', '이름', '회사', '전화', '이메일', '유형', '상태', '부스', '메모', '수집일'],
    ...leads.map((l) => [
      l.id,
      l.name ?? '-',
      l.company ?? '-',
      l.phone ?? '-',
      l.email ?? '-',
      l.source,
      l.status ?? 'NEW',
      boothMap[l.boothId] ?? l.boothId,
      l.memo,
      l.createdAt,
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSurveysCSV(
  boothId: string,
  surveys: import('../types').SurveyResponse[],
  fields: Array<{ id: string; label: string }>,
): void {
  const fieldIds = fields.map((f) => f.id);
  const extraIds = new Set<string>();
  for (const s of surveys) {
    for (const key of Object.keys(s.answers)) {
      if (!fieldIds.includes(key) && key !== 'wantsContact') extraIds.add(key);
    }
  }
  const allIds = [...fieldIds, ...Array.from(extraIds)];

  const header = ['#', '방문자 ID', ...allIds.map((id) => fields.find((f) => f.id === id)?.label ?? id), '연락 희망', '개인정보 동의', '응답일'];

  const rows: string[][] = [
    header,
    ...surveys.map((s, i) => [
      String(i + 1),
      s.visitorId,
      ...allIds.map((id) => {
        const v = s.answers[id];
        if (v === undefined || v === null) return '-';
        if (typeof v === 'boolean') return v ? '예' : '아니오';
        if (Array.isArray(v)) return v.join(' | ');
        return String(v);
      }),
      s.answers.wantsContact ? '예' : '아니오',
      s.consent ? '동의' : '미동의',
      s.createdAt,
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `survey-${boothId}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
