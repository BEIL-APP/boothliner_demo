# BoothLiner — B2B 이벤트 부스 운영 플랫폼

> Vite 5 + React 18 + TypeScript + Tailwind CSS 기반 B2B 이벤트 부스 운영 SaaS 데모.
> 백엔드 없이 **localStorage**만으로 동작합니다.

---

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과 로컬 확인
```

> 데이터 초기화: 개발자 도구 → Application → Local Storage → `bep_seeded` 삭제 후 새로고침

---

## 페이지 구조

### 공개 페이지

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | LandingPage | B2B SaaS 마케팅 + 관람객 진입점 |
| `/explore` | ExplorePage | 부스 검색·필터·행사별 보기 |
| `/scan/:boothId` | BoothPage | QR 진입 — 부스 상세 (AI 요약, 문의, 설문) |

### 인증

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/auth` | AuthPage | 관람객/운영자 로그인 유형 선택 |
| `/auth/signup` | SignupPage | 이메일 회원가입 (returnUrl 지원) |
| `/auth/oauth` | OAuthPage | 소셜 로그인 UI (mock) |

### 관람객 (Visitor) — 로그인 선택

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/me` | MyPage | 방문 기록·관심 부스·컬렉션·AI 관람 요약 |
| `/messages` | MessagesPage | 문의 스레드 목록 + 운영자 답변 확인 |
| `/notifications` | NotificationsPage | 알림 내역 (reply, system) |
| `/settings` | SettingsPage | 프로필·관심 분야·알림·동의 철회·데이터 관리 |

### 운영자 (Admin) — 로그인 필수

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/admin/login` | AdminLoginPage | 이메일/비밀번호 + OAuth + 데모 로그인 |
| `/admin/inbox` | AdminInboxPage | 문의 인박스 — 답변·템플릿·스팸 차단·리드 전환 |
| `/admin/leads` | AdminLeadsPage | 리드 목록 — 상태 관리·팔로업·CSV 내보내기 |
| `/admin/leads/scan` | AdminLeadsScanPage | 명함 스캔 (mock OCR → 리드 저장) |
| `/admin/dashboard` | AdminDashboardPage | 전체 부스 성과 분석 + 인사이트 카드 |
| `/admin/booths` | AdminBoothsPage | 내 부스 목록 |
| `/admin/booths/new` | AdminBoothNewPage | 부스 생성 (템플릿 선택·AI 자동입력) |
| `/admin/booths/:boothId` | AdminBoothDetailPage | 부스 상세 (QR·통계·정책·설문 폼 관리·편집) |
| `/admin/booths/:boothId/team` | AdminBoothTeamPage | 팀원 초대·권한 관리 (enforcement 안내) |
| `/admin/settings` | AdminSettingsPage | 운영자 프로필·알림·운영 설정 |

### 기타

| 경로 | 설명 |
|------|------|
| `*` | 404 페이지 (Admin/Visitor 경로별 분기) |

---

## 레이아웃 구조

| 영역 | 레이아웃 | 설명 |
|------|---------|------|
| Landing | 자체 Navbar + Footer | 마케팅 페이지 |
| Visitor | VisitorHeader (하단 탭 네비) | 관심·문의·알림·설정 |
| Admin | AdminLayout (사이드바 + 상단 헤더) | 인박스 → 리드 → 대시보드 → 내 부스 순 |
| Auth | 독립 레이아웃 | 로그인/가입 전용 |

### Admin 사이드바 순서 (업무 빈도 우선)

1. 문의 인박스 `/admin/inbox`
2. 리드 목록 `/admin/leads`
3. 대시보드 `/admin/dashboard`
4. 내 부스 `/admin/booths`
5. 설정 `/admin/settings` (하단)

---

## 핵심 기능

### 공통 (A)

| ID | 기능 | 구현 |
|----|------|------|
| A-1 | 개인정보/동의 관리 | consentAt·consentVersion·consentMarketing 기록 + **동의 철회 요청·처리 상태 추적** |
| A-2 | 스팸 방지 | guestId 기준 레이트리밋 (하루 3건) + 스레드 차단 |
| A-3 | 알림 시스템 | PENDING → SENT → FAILED 라이프사이클 + **실패 알림 재시도** (mock 70% 성공) |
| A-4 | 문의 스레드 | 채팅방 형태 다중 메시지 + 이미지 첨부 |
| A-5 | 링크/파일 첨부 | 외부 링크 관리 + 커스텀 링크 + 브로셔 업로드 |
| A-6 | 행사 단위 관리 | **행사별 부스 필터** (ExplorePage 행사 선택기) |

### 운영자 (B)

| ID | 기능 | 구현 |
|----|------|------|
| B-1 | 인증 | **이메일/비밀번호 + Google/Kakao OAuth** (mock) + 데모 로그인 |
| B-2 | 부스 생성 | **4종 템플릿 선택** (미니멀·비주얼·기업형·이벤트) + 소개·FAQ·링크·이벤트 폼 |
| B-3 | QR 생성 | 부스별 고유 QR + PNG 다운로드 |
| B-4 | 문의 인박스 | 답변·템플릿 관리 (CRUD, localStorage 영구 저장) + **리드 전환 액션** |
| B-5 | 리드 관리 | 상태 파이프라인 (NEW → CONTACTED → MEETING → WON/LOST) + **팔로업 섹션** |
| B-6 | 데이터 저장 | 방문/문의/리드 localStorage 축적 |
| B-7 | 대시보드 | KPI·리드소스·시간대 차트 + **인사이트 + 액션 카드** |
| B-8 | CSV Export | 통계·문의 + **리드 CSV 내보내기** (UTF-8 BOM) |
| B-9 | 운영 기간 | startAt/endAt + 종료 후 열람/문의 정책 |
| B-10 | 팀 관리 | 초대·owner/staff 역할 + **권한 enforcement 안내** |
| B-11 | AI 확장 | PDF → 부스 자동 생성 + 명함 OCR + **스타일 템플릿** (mock) |
| B-12 | 설문 관리 | 관심칩·목적·연락희망 집계 + **설문 폼 편집 UI** (항목 추가/삭제/옵션 편집) |

### 관람객 (C)

| ID | 기능 | 구현 |
|----|------|------|
| C-1 | 인증 | 이메일 가입 + OAuth (mock) + returnUrl 복귀 |
| C-2 | QR 스캔 | `/scan/:boothId` → 부스 상세 (로그인 불필요) |
| C-3 | 방문 기록 | 자동 기록 (guestId 기반) |
| C-4 | 관심 저장 | 하트 토글 + 비로그인 시 로그인 유도 |
| C-5 | 문의 | 스레드 생성 + 비로그인 이메일 입력 + **마케팅 동의 분리** |
| C-6 | 내 기록 | 최근 본 부스·관심·**컬렉션** (생성·분류·공유) |
| C-7 | 알림 | 답변 알림 (벨 뱃지 + `/notifications`) |
| C-8 | 공유 | Web Share API / 클립보드 복사 |
| C-9 | 비로그인 정책 | 이메일 + 부정사용 확인 + **IP 추적 동의** 체크박스 |
| C-10 | 이메일 자료 수신 | Lead(email_info) 생성 + 동의 연동 |
| C-11 | AI 기능 | 방문 카테고리 분석·추천 + **AI 부스 요약** + **자동 정리 제안** (mock) |

---

## UX/IA 설계 원칙

### 인증 게이트

- **탐색·부스 상세는 공개** — `/explore`, `/scan/:boothId` 로그인 불필요
- **저장·발송 시점에만 로그인 유도** — 문의 전송, 관심 저장, 설정 변경
- **returnUrl 지원** — 로그인 후 원래 페이지로 자동 복귀

### 404 처리

- Admin 경로 (`/admin/*`): "페이지를 찾을 수 없어요" + `/admin/booths` CTA
- Visitor 경로: "부스를 찾을 수 없어요" + `/explore` CTA

### 전환 최적화

- BoothPage CTA 1개 원칙 ("문의하기")
- 문의 폼 최소 입력 (이메일·본문)
- 상담 동의 vs 마케팅 동의 분리

---

## 데이터 구조

```typescript
// ─── Core ────────────────────────────────────────
Booth           { id, name, category, tagline, description,
                  images[], links, customLinks?, faq[], nextEvents[], createdAt }
Visit           { boothId, visitedAt, visitorId? }
Favorite        { boothId, createdAt }
Analytics       { boothId, scans, favorites, inquiries }

// ─── Communication ───────────────────────────────
Thread          { id, boothId, visitorId, visitorGuestId?,
                  visitorName?, visitorEmail?, consentGiven?, blocked?,
                  messages: ChatMessage[], status, tags[], memo, lastUpdated }
ChatMessage     { from: 'visitor'|'booth', text, images?, at }
AppNotification { id, targetGuestId, type, title, body, read,
                  status: 'PENDING'|'SENT'|'FAILED',
                  retryCount?, sentAt?, boothId?, threadId?, createdAt }

// ─── Lead ────────────────────────────────────────
Lead            { id, boothId, source, status?: LeadStatus,
                  name?, company?, phone?, email?, memo,
                  consent, consentAt?, consentVersion?,
                  consentMarketing?, consentMarketingAt?,
                  nextFollowUp?, createdAt }
LeadStatus      = 'NEW' | 'CONTACTED' | 'MEETING' | 'WON' | 'LOST'

// ─── Policy & Attachments ────────────────────────
BoothPolicy     { boothId, startAt, endAt, allowViewAfterEnd, allowInquiryAfterEnd }
Attachment      { id, boothId, filename, type, size?, createdAt }
SurveyResponse  { id, boothId, visitorId, answers, createdAt }

// ─── Team & Templates ────────────────────────────
StaffMember     { id, boothId, name, email, role, status, invitedAt }
ReplyTemplate   { id, label, text, createdAt }
Collection      { id, name, boothIds[], createdAt }
RateLimit       { key, count, resetAt }

// ─── Consent ─────────────────────────────────────
ConsentWithdrawal { id, type, status, requestedAt, completedAt?, reason? }
```

### localStorage 키 (`bep_` prefix)

| 키 | 타입 | 비고 |
|----|------|------|
| `bep_booths` | Booth[] | 시드 6개 |
| `bep_visits` | Visit[] | |
| `bep_favorites` | Favorite[] | |
| `bep_threads` | Thread[] | |
| `bep_analytics` | Analytics[] | |
| `bep_leads` | Lead[] | 시드 6건 |
| `bep_policies` | BoothPolicy[] | |
| `bep_attachments` | Attachment[] | |
| `bep_surveys` | SurveyResponse[] | |
| `bep_notifications` | AppNotification[] | |
| `bep_staff` | StaffMember[] | |
| `bep_rate_limits` | RateLimit[] | |
| `bep_reply_templates` | ReplyTemplate[] | 기본 3개 자동 생성 |
| `bep_collections` | Collection[] | |
| `bep_consent_withdrawals` | ConsentWithdrawal[] | |
| `bep_isLoggedIn` | '0' \| '1' | |
| `bep_isAdmin` | '0' \| '1' | |
| `bep_userEmail` | string | |
| `bep_guestId` | string | 익명 방문자 영구 ID |
| `bep_seeded` | '1' | |
| `bep_survey_fields_{boothId}` | SurveyField[] | 부스별 설문 폼 설정 |
| `visitor_profile` | VisitorProfile | 관람객 프로필 |
| `visitor_notification_settings` | NotificationSettings | 알림 토글 |
| `visitor_interests` | string[] | 관심 분야 |

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

- 시드 리드: 6건 (명함 3·문의 1·이메일 1·설문 1)
- 시드 정책: booth-001~004 (booth-003은 종료 상태)
- 시드 첨부파일: 4건 (TeaCo 2·DataFlow 1·GreenSpace 1)
- 시드 설문: 5건
- 시드 팀원: 5명 (booth-001 3명, booth-004 2명)

---

## 데모 시나리오

### 1. 관람객 — QR 스캔 → 문의

1. `/scan/booth-001` 접속 → **AI 부스 요약** 펼치기 → 키워드·요약 확인
2. 이미지 캐러셀, 소개·FAQ·첨부파일 확인
3. **"문의하기"** → 이메일 + 본문 + 부정사용 체크 + (선택) IP 추적 동의 + (선택) 마케팅 동의 → 전송
4. **"이메일로 자료 받기"** → 이메일 + 동의 → 발송
5. **"1분 설문"** → 관심 분야 + 목적 + 연락 희망 → 제출
6. 하루 3회 초과 문의 시 레이트리밋 안내

### 2. 관람객 — 탐색·저장·컬렉션

1. `/explore` → **행사별 필터** 선택 → 카테고리·정렬·검색
2. 부스 카드 하트 → 관심 저장 (비로그인 시 유도 배너)
3. `/me` → **AI 관람 요약** (카테고리 분포 + 추천) → **자동 정리 제안** 버튼
4. **컬렉션** 탭 → 새 컬렉션 생성 → 관심 부스 추가 → 공유

### 3. 관람객 — 설정·동의 철회

1. `/settings` → 프로필·관심 분야·알림 토글 설정
2. **동의 철회** 섹션 → 마케팅 수신 철회 또는 데이터 삭제 요청 → 처리 상태 확인
3. 실패 알림이 있으면 **"실패 N건 재시도"** 버튼 표시

### 4. 운영자 — 부스 생성

1. `/admin/login` → 이메일/비밀번호 또는 OAuth 또는 데모 로그인
2. **"+ 새 부스"** → **페이지 템플릿** 선택 (미니멀/비주얼/기업형/이벤트)
3. AI 자동 생성 (PDF 업로드 → 2초 후 자동입력) 또는 수동 입력
4. 부스 생성 완료 → QR 코드 발급

### 5. 운영자 — 부스 관리

1. 부스 상세 → QR 다운로드·통계 확인
2. **운영 기간 설정** → 종료 후 열람/문의 정책
3. **설문 폼 관리** → 항목 추가/삭제, 타입·옵션 편집 → 저장
4. **링크 관리** → Instagram·스토어·홈페이지 + 커스텀 링크
5. **팀 관리** → 팀원 초대 (owner/staff) → **권한 제어 안내** 확인

### 6. 운영자 — 인박스·리드

1. **문의 인박스** → 스레드 답변 (템플릿 사용) → **리드로 전환** 버튼
2. **리드 목록** → 상태 파이프라인 관리 → **팔로업 필요** 섹션 확인
3. **CSV 내보내기** → 필터된 리드를 CSV 다운로드
4. **명함 스캔** → 이미지 업로드 → OCR 추출 → 리드 저장
5. **명함 추첨** → 랜덤 당첨자 선정

### 7. 운영자 — 대시보드

1. **대시보드** → 인사이트 카드 (미답변 문의·신규 리드·관심 분야·피크 시간)
2. KPI 카드 → 총 스캔·고유 방문자·관심·문의
3. 리드 소스별 분포 → 시간대별 방문 차트
4. 부스별 통계 테이블 → **전체 CSV Export**

---

## 프로젝트 구조

```
src/
├── components/         # 공통 컴포넌트
│   ├── AdminLayout.tsx      # 사이드바 + 상단 헤더
│   ├── VisitorHeader.tsx    # 관람객 하단 탭 네비
│   ├── Modal.tsx            # 범용 모달
│   ├── NotFoundPage.tsx     # 404 처리
│   └── ui/                  # Button, Card, Input, Badge, EmptyState
├── contexts/           # React Context
│   ├── AuthContext.tsx       # 로그인/관리자 상태
│   └── ToastContext.tsx      # 토스트 알림
├── hooks/              # Custom Hooks
│   ├── useBooths.ts
│   ├── useAnalytics.ts
│   ├── useFavorites.ts
│   ├── useVisits.ts
│   └── useThreads.ts
├── pages/
│   ├── auth/           # AuthPage, SignupPage, OAuthPage
│   ├── admin/          # 운영자 9개 페이지
│   ├── visitor/        # 관람객 6개 페이지
│   └── LandingPage.tsx
├── data/
│   └── seed.ts         # 시드 데이터
├── types/
│   └── index.ts        # 전체 타입 정의
├── utils/
│   ├── localStorage.ts # 데이터 CRUD + 시드 초기화
│   └── csv.ts          # CSV Export (통계·문의·리드)
└── App.tsx             # 라우터 설정
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 빌드 | Vite 5 + TypeScript 5 |
| UI | React 18 + Tailwind CSS 3 |
| 라우팅 | React Router v6 |
| 아이콘 | lucide-react |
| QR | qrcode.react |
| 스토리지 | localStorage (no backend) |

### 디자인 시스템

- **컬러**: Brand (Indigo 계열) + Gray scale + 상태색 (Emerald/Amber/Red)
- **간격**: 8pt 그리드
- **타이포**: 시스템 폰트 (Pretendard 호환)
- **애니메이션**: fade-in, slide-up, scale-in, slide-in-left
- **반응형**: Mobile-first (`sm` 640px / `md` 768px / `lg` 1024px)
