# 부스라이너 (BoothLiner) — B2B 팝업 이벤트 플랫폼 데모

Vite + React 18 + TypeScript + Tailwind CSS로 구현한 B2B 이벤트 부스 관리 데모입니다.
백엔드 없이 localStorage 기반으로 동작합니다.

---

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

빌드:
```bash
npm run build
```

---

## 전체 라우트

| 경로 | 설명 | 대상 |
|------|------|------|
| `/auth` | 로그인 유형 선택 (개인/기업) | 공개 |
| `/auth/signup` | 이메일 가입 폼 | 공개 |
| `/auth/oauth` | 소셜 로그인 UI (mock) | 공개 |
| `/scan/:boothId` | 관람객 — 부스 상세 페이지 | 공개 |
| `/me` | 관람객 — 방문 기록 & 관심 목록 | 공개 |
| `/messages` | 관람객 — 문의 스레드 목록 | 공개 |
| `/notifications` | 관람객 — 알림 내역 | 공개 |
| `/admin/login` | 운영자 데모 로그인 | 공개 |
| `/admin/booths` | 운영자 — 부스 목록 | 운영자 |
| `/admin/booths/new` | 운영자 — 부스 생성 (AI 자동입력) | 운영자 |
| `/admin/booths/:id` | 운영자 — 부스 상세 (QR·정책·설문·팀) | 운영자 |
| `/admin/booths/:id/team` | 운영자 — 팀원 초대 & 권한 관리 | 운영자 |
| `/admin/inbox` | 운영자 — 문의 인박스 (스팸 차단) | 운영자 |
| `/admin/leads` | 운영자 — 리드 목록 | 운영자 |
| `/admin/leads/scan` | 운영자 — 명함 스캔 | 운영자 |
| `/organizer/preview` | 주최자 — 이벤트 통합 대시보드 | 운영자 |

---

## 데모 시나리오 7단계

### 시나리오 1: 관람객 — QR 스캔에서 문의까지

**역할:** 박람회 참관객 (비로그인)

1. `/scan/booth-001` 접속 → TeaCo 부스 페이지 열기
2. 이미지 캐러셀 스크롤, 소개·FAQ·첨부파일 확인
3. **"이메일로 자료 받기"** 클릭 → 이메일 입력 + 동의 체크 → "자료 받기" (mock 발송 완료 토스트)
4. **"1분 설문"** 클릭 → 관심 분야 칩 선택 + 방문 목적 + 연락 희망 토글 → "제출하기"
5. **"문의하기"** 클릭 → 이메일 입력 + 부정사용 방지 체크 + (선택) **마케팅 동의** 체크 → "문의 보내기"
6. 상단 **공유 버튼** 클릭 → 부스 URL 공유 (Web Share API / 클립보드 복사)
7. 같은 부스에 하루 3회 초과 문의 시도 → 레이트리밋 안내 메시지 표시

**확인 포인트:** 비로그인 문의 시 이메일·체크 항목 필수 | 마케팅 동의 체크 시 리드에 저장 | 하루 3회 문의 제한

---

### 시나리오 2: 관람객 — 로그인 후 관심 저장·컬렉션·알림·데이터 삭제

**역할:** 박람회 참관객 (로그인 또는 비로그인)

1. `/auth` → **"개인 (관람객)"** → 이메일/비밀번호 입력 후 **"관람객으로 가입하기"**
2. 자동으로 `/scan/booth-001` 이동
3. **"저장하기"** 버튼 클릭 → 하트 아이콘 채워짐 + 로그인 유도 배너 (비로그인 시)
4. `/me` → **"최근 본 부스"** 탭 상단 **"AI 관람 요약"** 카드 클릭 → 방문 카테고리 분포 + 관심 기반 추천 부스 확인
5. **"관심"** 탭 → 저장된 부스 확인 + **공유 버튼** 클릭
6. **"컬렉션"** 탭 → **"새 컬렉션 만들기"** → 이름 입력 (예: "파트너십 후보") → 생성
7. 컬렉션 열기 → **"관심 부스에서 추가"** → 부스 선택 추가 | 컬렉션 **공유 버튼** 클릭
8. `/messages` 이동 → 문의 스레드 목록 및 답변 확인
9. 운영자가 답변을 달면 헤더 **벨 아이콘**에 빨간 뱃지 표시 → 클릭 시 `/notifications`
10. `/me` 하단 **"내 데이터 삭제 요청"** → 확인 → 방문 기록·관심·문의 전체 삭제

**확인 포인트:** AI 요약은 방문 카테고리 비율 + 저장 기반 추천 | 컬렉션에 관심 부스 분류 가능 | 컬렉션 공유는 부스 목록 텍스트 공유 | GDPR 스타일 데이터 삭제

---

### 시나리오 3: 운영자 — 명함 스캔으로 리드 수집

**역할:** 부스 운영자

1. `/admin/login` → **"데모 로그인"** → 어드민 대시보드
2. 좌측 사이드바 **"리드 목록"** 클릭 → 기존 시드 리드 6건 확인 (유형별 칩 표시)
3. 우측 상단 **"명함 스캔"** 클릭 → `/admin/leads/scan`
4. 이미지 파일 업로드 → 2초 후 mock OCR 추출 결과 표시
5. 이름·회사·연락처 수정 → 메모 입력 → 연결 부스 선택 → **"리드로 저장"**
6. `/admin/leads` 돌아와 새로 추가된 리드 확인
7. **"명함 추첨"** 버튼 클릭 → 랜덤 당첨자 팝업 (티저 기능)

**확인 포인트:** source: 'bizcard' 리드 생성 | 메모 필수 | 추첨은 현재 필터 기준으로 동작

---

### 시나리오 4: 운영자 — 부스 운영 정책·링크·첨부파일·팀 관리

**역할:** 부스 운영자

1. 사이드바 **"내 부스"** → `booth-003 GreenSpace` 클릭
2. **"운영 기간 설정"** 섹션 → 종료 날짜를 과거로 변경 (예: 2026-02-28) → "정책 저장"
3. 별도 탭에서 `/scan/booth-003` 접속 → 상단에 **"운영 종료"** 배지 확인 + "문의 마감" 버튼 비활성화
4. 다시 어드민에서 **"문의 허용"** 토글 ON → 정책 저장 → 관람객 페이지 새로고침 → 문의 버튼 활성화
5. **"외부 링크 관리"** 섹션 → Instagram·스토어·홈페이지 URL 입력 → "추가 링크" 이름+URL 행 추가 → **"링크 저장"**
6. `/scan/booth-003` 새로고침 → 관람객 페이지 하단 링크 버튼 업데이트 확인
7. **"브로셔 & 첨부 파일"** 섹션 → 파일 업로드 (PDF 등) → 파일명·용량 표시
8. **"팀 관리"** 버튼 클릭 → `/admin/booths/booth-003/team` 이동
9. **"팀원 초대"** → 이름·이메일·역할 입력 → "초대 보내기 (데모)" → 초대 대기 목록 확인
10. 초대 항목의 **"수락"** 버튼 → 활성 팀원으로 이동 | 역할 select로 owner ↔ staff 전환

**확인 포인트:** 정책별 배지·버튼 상태 변화 | 외부 링크는 저장 즉시 관람객 페이지 반영 | 커스텀 링크 무제한 추가 | 파일 메타데이터만 저장 | 팀원 권한(owner/staff) 구분

---

### 시나리오 5: 운영자 — AI 자동 부스 생성

**역할:** 부스 운영자 (신규 부스 등록)

1. 사이드바 **"내 부스"** → 우측 상단 **"+ 새 부스"** 클릭
2. 상단 보라색 카드 **"AI 부스 자동 생성"** 영역에서 파일 선택 버튼 클릭
3. 회사 소개서·브로셔 PDF (또는 임의 파일) 업로드
4. 2초 대기 → AI 추출 완료 토스트 → 부스명·한 줄 소개·카테고리·설명 자동 입력
5. 자동 입력된 내용 확인 후 이미지·정책·FAQ 추가 → **"부스 생성"** 완료

**확인 포인트:** 파일명 표시 | 3가지 mock 프로필 중 랜덤 추출 | 수동 수정 후 저장 가능

---

### 시나리오 6: 운영자 — 문의 인박스·템플릿 관리·스팸 차단

**역할:** 부스 운영자

1. 사이드바 **"문의 인박스"** → 스레드 목록 확인
2. 스레드 클릭 → 하단 **"템플릿 답변"** 영역에서 기본 제공 3가지 템플릿 확인
3. 우측 **"관리"** 버튼 클릭 → 템플릿 관리 모달 오픈
4. **"+ 템플릿 추가"** → 이름·내용 입력 → "추가" → 템플릿 목록에 반영 (localStorage 영구 저장)
5. 기존 템플릿 연필 아이콘 → 내용 수정 → "저장" | 휴지통 아이콘 → 삭제
6. 모달 닫기 → 인박스에서 새 템플릿 버튼 클릭 → 답변 입력창에 자동 삽입 → **"답변 전송"**
7. 답변 전송 시 알림 생성 (PENDING → SENT 상태 전환) → 관람객 `/notifications` 에 반영
8. 상단 **방패 아이콘** 클릭 → 스레드 차단 토글 → 목록에 "차단됨" 뱃지 표시

**확인 포인트:** 템플릿은 localStorage에 영구 저장 (새로고침 후에도 유지) | 알림에 PENDING→SENT 상태 라이프사이클 | 차단 상태 토글 가능

---

### 시나리오 7: 주최자 — 통합 대시보드 데이터 분석

**역할:** 이벤트 주최자 / 마케터

1. 사이드바 **"주최자 프리뷰"** 클릭
2. 상단 KPI 카드 확인: 총 스캔·고유 방문자·관심 저장·총 문의
3. 리드 소스 카드: 명함·문의·이메일·설문별 수집 현황
4. **"시간대별 방문"** 바 차트 (mock) 확인
5. **"설문 집계"** 섹션 → 전체 부스의 관심 분야 바 차트 + 방문 목적 분포 확인
6. **"최근 리드"** 섹션 → "전체 보기" → `/admin/leads` 이동
7. 상단 **"전체 CSV Export"** 클릭 → 통계 파일 다운로드
8. 부스 통계 테이블에서 스캔·관심·문의·리드·전환율 비교

**확인 포인트:** 고유 방문자 = guestId 기준 unique 집계 | 리드 수 = boothId별 집계 | 설문 집계는 전체 부스 합산

---

## 데이터 구조

```typescript
Booth       { id, name, category, tagline, description, images[],
              links: { instagram?, store?, site? },
              customLinks?: [{ label, url }],  // 커스텀 추가 링크 (A-5)
              faq[], nextEvents[], createdAt }

Lead        { id, boothId, source: 'bizcard'|'inquiry'|'email_info'|'survey',
              name?, company?, phone?, email?, memo,
              consent, consentAt?,        // 동의 시각 (A-1)
              consentVersion?,            // 동의 정책 버전 (A-1)
              consentMarketing?,          // 마케팅 수신 동의
              consentMarketingAt?,        // 마케팅 동의 시각 (A-1)
              createdAt }

BoothPolicy { boothId, startAt, endAt, allowViewAfterEnd, allowInquiryAfterEnd }
Attachment  { id, boothId, filename, type, size?, createdAt }
SurveyResponse { id, boothId, visitorId,
                 answers: { interests?, purpose?, wantsContact? }, createdAt }
Thread      { ..., visitorGuestId?,  // 알림 발송 대상 식별
                    blocked? }       // 스팸 차단 여부

AppNotification { id, targetGuestId, type: 'reply'|'system',
                  title, body, read,
                  status: 'PENDING'|'SENT'|'FAILED',  // 전송 상태 (A-3)
                  retryCount?,                         // 재시도 횟수 (A-3)
                  sentAt?,                             // 전송 완료 시각 (A-3)
                  boothId?, threadId?, createdAt }

StaffMember     { id, boothId, name, email,
                  role: 'owner'|'staff', status: 'active'|'pending', invitedAt }
RateLimit       { key, count, resetAt }

// Session 3 신규 타입
ReplyTemplate   { id, label, text, createdAt }  // 템플릿 답변 (B-4)
Collection      { id, name, boothIds[], createdAt }  // 저장 부스 컬렉션 (C-6)
```

### localStorage 키 (prefix: `bep_`)

| 키 | 타입 | 비고 |
|----|------|------|
| `bep_booths` | Booth[] | |
| `bep_visits` | Visit[] | |
| `bep_favorites` | Favorite[] | |
| `bep_threads` | Thread[] | |
| `bep_analytics` | Analytics[] | |
| `bep_leads` | Lead[] | |
| `bep_policies` | BoothPolicy[] | |
| `bep_attachments` | Attachment[] | |
| `bep_surveys` | SurveyResponse[] | |
| `bep_notifications` | AppNotification[] | |
| `bep_staff` | StaffMember[] | |
| `bep_rate_limits` | RateLimit[] | |
| `bep_reply_templates` | ReplyTemplate[] | 기본 3개 자동 생성 |
| `bep_collections` | Collection[] | |
| `bep_isLoggedIn` | '0' \| '1' | |
| `bep_isAdmin` | '0' \| '1' | |
| `bep_userEmail` | string | |
| `bep_guestId` | string | 익명 방문자 영구 ID |
| `bep_seeded` | '1' | |

> 데이터 초기화: 브라우저 개발자 도구 → Application → Local Storage → `bep_seeded` 삭제 후 새로고침

---

## 시드 데이터

| 부스 | 카테고리 | 스캔 | 관심 | 문의 |
|------|---------|------|------|------|
| TeaCo | 음료 & 식품 | 124 | 42 | 18 |
| BrandKit Studio | 인쇄 & 굿즈 | 87 | 31 | 12 |
| GreenSpace | 친환경 오피스 | 203 | 78 | 29 |
| DataFlow | IT & SaaS | 156 | 54 | 22 |
| CraftLeather | 핸드크래프트 | 63 | 19 | 8 |
| NutritionLab | 웰니스 & 복지 | 98 | 37 | 15 |

- 시드 리드: 6건 (명함 3 · 문의 1 · 이메일 1 · 설문 1)
- 시드 정책: booth-001~004 (booth-003은 종료 상태)
- 시드 첨부파일: 4건 (TeaCo 2 · DataFlow 1 · GreenSpace 1)
- 시드 설문: 5건
- 시드 팀원: 5명 (booth-001 3명, booth-004 2명) — owner/staff, active/pending 혼합

---

## 구현 기능 현황

### 공통 (A)

| 기능 | 항목 | 상태 |
|------|------|------|
| A-1 | 개인정보/동의 관리 — consentAt·consentVersion·consentMarketingAt 기록 | ✅ |
| A-2 | 스팸 방지 — 레이트리밋(guestId 기준) + 스레드 차단 | ✅ |
| A-3 | 알림 기반 구조 — PENDING/SENT/FAILED 상태 + sentAt + 재시도 카운트 | ✅ |
| A-4 | 문의 스레드 구조 — 채팅방 형태 다중 메시지 | ✅ |
| A-5 | 링크/파일 첨부 — 외부 링크 관리 UI + 커스텀 링크 + 파일 업로드 | ✅ |
| A-6 | AI 공통 확장 — 부스 생성 시 AI 자동입력 (mock) | ✅ (mock) |

### 운영자 (B)

| 기능 | 항목 | 상태 |
|------|------|------|
| B-1 | 인증/계정 — 이메일 가입 + OAuth mock | ✅ |
| B-2 | 부스 페이지 생성 — 템플릿 폼 (소개·FAQ·링크·이벤트) | ✅ |
| B-3 | QR 생성/다운로드 — 부스별 고유 QR + PNG 다운로드 | ✅ |
| B-4 | 문의 인박스 — 스레드 목록·답변·템플릿 관리 (localStorage 영구 저장) | ✅ |
| B-5 | 리드 관리 — 이메일·명함·설문·이메일CTA 수집 + 목록 조회 | ✅ |
| B-6 | 데이터 저장 — 방문/문의/리드 localStorage 축적 | ✅ |
| B-7 | 통계 대시보드 — 총방문·고유방문·문의·관심·리드 소스·시간대 차트 | ✅ |
| B-8 | CSV Export — 통계·문의 CSV 다운로드 (UTF-8 BOM) | ✅ |
| B-9 | 운영 기간 설정 — startAt/endAt + 종료 후 정책 (열람/문의) | ✅ |
| B-10 | 팀 권한 관리 — 초대·owner/staff 역할·active/pending 상태 | ✅ |
| B-11 | AI 확장 — PDF 업로드 → 부스 초안 자동 생성 (mock) + 명함 OCR (mock) + 추첨 | ✅ (mock) |
| B-12 | 방문자 설문 — 관심칩·목적·연락희망 → 집계 차트 | ✅ |

### 관람객 (C)

| 기능 | 항목 | 상태 |
|------|------|------|
| C-1 | 인증/계정 — 이메일 가입 + OAuth mock | ✅ |
| C-2 | QR 스캔 → 부스 페이지 | ✅ |
| C-3 | 방문 자동 기록 | ✅ |
| C-4 | 저장(관심) — 하트 토글 + 로그인 유도 | ✅ |
| C-5 | 문의/메시지 — 스레드 생성 + 비로그인 이메일 입력 | ✅ |
| C-6 | 내 기록 — 최근 본 부스·관심 부스·**컬렉션** (생성·분류·공유) | ✅ |
| C-7 | 답변 확인 — 알림 연동 (벨 뱃지 + /notifications) | ✅ |
| C-8 | 공유 — 부스 URL 공유 + 컬렉션 목록 공유 | ✅ |
| C-9 | 비로그인 정책 — 이메일 + IP 추적 동의 체크 필수 | ✅ |
| C-10 | 이메일로 정보 받기 — Lead(email_info) 생성 + 동의 연동 | ✅ |
| C-11 | 관람객 AI — 방문 카테고리 분석 + 관심 기반 추천 (mock) | ✅ (mock) |

---

## 기술 스택

- **빌드**: Vite 5 + TypeScript 5
- **UI**: React 18 + Tailwind CSS 3 (포인트 컬러: indigo-600 / brand-600)
- **라우팅**: React Router v6
- **아이콘**: lucide-react
- **QR**: qrcode.react (실제 QR 생성 + PNG 다운로드)
- **스토리지**: localStorage only (no backend, no API)
