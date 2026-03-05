import type { Booth, Thread, Analytics, Lead, BoothPolicy, Attachment, SurveyResponse, StaffMember, BoothEvent, BoothEventParticipation } from '../types';

export const SEED_BOOTHS: Booth[] = [
  {
    id: 'booth-001',
    name: 'TeaCo',
    category: '음료 & 식품',
    tagline: '한 잔에 담긴 일상의 여유',
    description:
      '국내 최고의 산지에서 직접 수확한 유기농 차를 선보입니다. 하동 녹차부터 보성 홍차까지, 기업 복지 선물 세트와 사무실 웰니스 구독 패키지를 제공합니다. 연간 계약 시 커스텀 패키징과 브랜드 라벨링이 가능합니다.',
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
      'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80',
    ],
    links: {
      instagram: 'https://instagram.com',
      store: 'https://example.com',
      site: 'https://example.com',
    },
    faq: [
      {
        question: '최소 주문 수량이 있나요?',
        answer:
          '기업 납품의 경우 50세트 이상부터 가능합니다. 소량은 스토어에서 개인 구매로 진행해 주세요.',
      },
      {
        question: 'OEM 패키지 제작도 가능한가요?',
        answer:
          '네, 브랜드 로고와 디자인을 적용한 커스텀 패키지 제작이 가능합니다. 제작 기간은 약 3주 소요됩니다.',
      },
      {
        question: '샘플을 먼저 받아볼 수 있나요?',
        answer:
          '문의 남겨주시면 5종 샘플 키트를 무료로 보내드립니다. (배송비 별도)',
      },
    ],
    nextEvents: [
      { title: '봄 바이어 미팅', date: '2026-04-15', location: 'COEX Hall A' },
    ],
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'booth-002',
    name: 'BrandKit Studio',
    category: '인쇄 & 굿즈',
    tagline: '브랜드의 첫인상을 완성하는 곳',
    description:
      '명함, 브로셔, 패키지 디자인부터 대량 인쇄까지. 스타트업부터 중견기업까지 600개 이상의 기업과 함께했습니다. 24시간 온라인 주문 시스템과 당일 시안 제공으로 빠른 의사결정을 지원합니다.',
    images: [
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80',
      'https://images.unsplash.com/photo-1586717799252-bd134ad00e26?w=800&q=80',
    ],
    links: {
      instagram: 'https://instagram.com',
      site: 'https://example.com',
    },
    faq: [
      {
        question: '시안 확인까지 얼마나 걸리나요?',
        answer: '주문 접수 후 영업일 기준 1일 이내 1차 시안을 제공합니다.',
      },
      {
        question: '소량(100장 이하) 명함도 가능한가요?',
        answer: '50장부터 주문 가능합니다. 수량이 적을수록 장당 단가가 올라갑니다.',
      },
      {
        question: '디자인 파일이 없어도 제작할 수 있나요?',
        answer:
          '네, 브랜드 가이드라인이나 참고 자료만 주셔도 디자인팀이 제작해드립니다.',
      },
    ],
    nextEvents: [
      {
        title: '인쇄 & 굿즈 워크숍',
        date: '2026-03-22',
        location: 'DDP 디자인홀',
      },
    ],
    createdAt: '2026-01-12T10:30:00Z',
  },
  {
    id: 'booth-003',
    name: 'GreenSpace',
    category: '친환경 오피스',
    tagline: '지구도 좋고, 사무실도 좋고',
    description:
      'FSC 인증 목재와 재활용 소재로 만든 사무용 가구와 친환경 소모품을 공급합니다. ESG 경영을 실천하는 기업들의 오피스 환경을 새롭게 디자인하고, 탄소 발자국 리포트를 함께 제공합니다.',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    ],
    links: {
      instagram: 'https://instagram.com',
      store: 'https://example.com',
      site: 'https://example.com',
    },
    faq: [
      {
        question: 'ESG 인증서 발급이 가능한가요?',
        answer:
          '네, 구매 제품에 대한 탄소 절감량 리포트와 ESG 기여 증명서를 발급합니다.',
      },
      {
        question: '기존 사무실 가구와 어울릴까요?',
        answer:
          '모듈형 디자인으로 기존 가구와 믹스매치가 가능합니다. 무료 인테리어 컨설팅도 제공합니다.',
      },
      {
        question: '배송 및 설치 서비스가 포함되나요?',
        answer:
          '수도권은 자체 배송 및 설치 서비스를 제공합니다. 지방은 협력사를 통해 진행됩니다.',
      },
    ],
    nextEvents: [
      { title: 'ESG 오피스 세미나', date: '2026-04-05', location: 'GreenSpace 쇼룸' },
    ],
    createdAt: '2026-01-14T11:00:00Z',
  },
  {
    id: 'booth-004',
    name: 'DataFlow',
    category: 'IT & SaaS',
    tagline: '데이터가 의사결정이 되는 순간',
    description:
      'B2B 영업팀을 위한 AI 기반 파이프라인 관리 & 예측 분석 플랫폼입니다. 평균 도입 후 3개월 내 영업 효율 40% 향상. 현재 120개 기업 고객이 사용 중이며, 무료 30일 트라이얼을 제공합니다.',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    ],
    links: {
      site: 'https://example.com',
    },
    faq: [
      {
        question: '기존 CRM과 연동이 가능한가요?',
        answer:
          'Salesforce, HubSpot, Pipedrive 등 주요 CRM과 API 연동을 지원합니다.',
      },
      {
        question: '데이터 보안은 어떻게 되나요?',
        answer:
          'ISO 27001 인증을 보유하고 있으며 데이터는 국내 IDC에 암호화 저장됩니다.',
      },
      {
        question: '도입 교육은 제공되나요?',
        answer:
          '전담 CS 매니저를 배정하고 온보딩 세션(4시간)을 무료로 제공합니다.',
      },
    ],
    nextEvents: [
      {
        title: '영업팀 생산성 웨비나',
        date: '2026-03-28',
        location: '온라인 (Zoom)',
      },
    ],
    createdAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'booth-005',
    name: 'CraftLeather',
    category: '핸드크래프트',
    tagline: '오래 쓸수록 더 멋있어지는',
    description:
      '이탈리아산 풀그레인 가죽을 사용한 수공예 기업 선물 전문 브랜드입니다. 명함지갑, 노트북 파우치, 사무용 액세서리에 기업 로고 각인 서비스를 제공합니다. 제작 기간: 2~3주.',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80',
    ],
    links: {
      instagram: 'https://instagram.com',
      store: 'https://example.com',
    },
    faq: [
      {
        question: '로고 각인 최소 수량은?',
        answer:
          '각인 주문은 30개부터 가능합니다. 20개 이하는 개별 협의로 진행합니다.',
      },
      {
        question: '가죽 색상 선택이 가능한가요?',
        answer: '탄 브라운, 다크 브라운, 블랙 3가지 색상 중 선택 가능합니다.',
      },
      {
        question: '견본품 확인 후 진행할 수 있나요?',
        answer:
          '샘플 1개를 원가에 제작해드립니다. 이후 대량 주문 시 샘플 비용은 차감됩니다.',
      },
    ],
    nextEvents: [
      { title: '봄 선물세트 주문 마감', date: '2026-04-01', location: '온라인 접수' },
    ],
    createdAt: '2026-01-16T14:00:00Z',
  },
  {
    id: 'booth-006',
    name: 'NutritionLab',
    category: '웰니스 & 복지',
    tagline: '건강한 팀이 만드는 좋은 성과',
    description:
      '기업 구성원의 건강을 위한 맞춤형 영양 솔루션입니다. 월 구독형 건강 간식 박스, 임직원 영양 상담, 단체 건강검진 패키지를 제공합니다. 현재 50개 기업과 파트너십을 맺고 있습니다.',
    images: [
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80',
      'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=80',
    ],
    links: {
      instagram: 'https://instagram.com',
      site: 'https://example.com',
    },
    faq: [
      {
        question: '구독 최소 인원이 있나요?',
        answer: '10인 이상 팀부터 기업 구독 플랜 적용이 가능합니다.',
      },
      {
        question: '직원 알레르기 정보를 반영할 수 있나요?',
        answer:
          '네, 구독 신청 시 개인별 식이 제한 정보를 수집해 맞춤 구성합니다.',
      },
      {
        question: '한 달 구독 후 해지가 가능한가요?',
        answer: '최소 약정 기간은 3개월이며, 이후 매달 해지 신청이 가능합니다.',
      },
    ],
    nextEvents: [
      { title: '기업 웰니스 트렌드 세미나', date: '2026-04-10', location: '여의도 IFC' },
    ],
    createdAt: '2026-01-17T10:00:00Z',
  },
];

export const SEED_ANALYTICS: Analytics[] = [
  // Total per booth (no eventId)
  ...SEED_BOOTHS.map((b, i) => ({
    boothId: b.id,
    scans: [124, 87, 203, 156, 63, 98][i],
    favorites: [42, 31, 78, 54, 19, 37][i],
    inquiries: [18, 12, 29, 22, 8, 15][i],
  })),
  // Event-level breakdown
  { boothId: 'booth-001', eventId: 'event-001', scans: 80, favorites: 28, inquiries: 12 },
  { boothId: 'booth-001', eventId: 'event-002', scans: 44, favorites: 14, inquiries: 6 },
  { boothId: 'booth-002', eventId: 'event-001', scans: 87, favorites: 31, inquiries: 12 },
  { boothId: 'booth-003', eventId: 'event-001', scans: 120, favorites: 45, inquiries: 16 },
  { boothId: 'booth-003', eventId: 'event-003', scans: 83, favorites: 33, inquiries: 13 },
  { boothId: 'booth-004', eventId: 'event-001', scans: 95, favorites: 32, inquiries: 14 },
  { boothId: 'booth-004', eventId: 'event-002', scans: 61, favorites: 22, inquiries: 8 },
  { boothId: 'booth-005', eventId: 'event-003', scans: 63, favorites: 19, inquiries: 8 },
  { boothId: 'booth-006', eventId: 'event-001', scans: 55, favorites: 20, inquiries: 8 },
  { boothId: 'booth-006', eventId: 'event-003', scans: 43, favorites: 17, inquiries: 7 },
];

export const SEED_THREADS: Thread[] = [
  {
    id: 'thread-001',
    boothId: 'booth-001',
    visitorId: 'user',
    visitorGuestId: 'guest-seed-demo',
    visitorName: '김지수',
    visitorEmail: 'jisu.kim@company.co.kr',
    consentGiven: true,
    messages: [
      {
        from: 'visitor',
        text: '안녕하세요! 50인 이상 기업 복지 선물 세트 견적을 받고 싶습니다. 명절 시즌 전에 납품이 가능한지 문의드립니다.',
        at: '2026-02-10T14:22:00Z',
      },
      {
        from: 'booth',
        text: '안녕하세요 김지수님, 관심 가져주셔서 감사합니다! 50세트 이상은 기업가 할인이 적용됩니다. 원하시는 예산 범위와 납품 일정을 알려주시면 맞춤 견적을 드릴게요.',
        at: '2026-02-10T15:05:00Z',
      },
    ],
    status: '처리',
    tags: ['견적문의', 'B2B'],
    memo: '명절 납품 수요. 50세트 이상 예상.',
    lastUpdated: '2026-02-10T15:05:00Z',
  },
  {
    id: 'thread-002',
    boothId: 'booth-004',
    visitorId: 'guest',
    visitorGuestId: 'guest-seed-demo2',
    visitorEmail: 'tech@startup.io',
    consentGiven: false,
    messages: [
      {
        from: 'visitor',
        text: 'CRM 연동 시 커스텀 필드도 매핑이 되나요? Salesforce 사용 중입니다.',
        at: '2026-02-11T09:40:00Z',
      },
    ],
    status: '미처리',
    tags: ['기술문의'],
    memo: '',
    lastUpdated: '2026-02-11T09:40:00Z',
  },
  {
    id: 'thread-003',
    boothId: 'booth-002',
    visitorId: 'user',
    visitorGuestId: 'guest-seed-demo3',
    visitorName: '이민준',
    visitorEmail: 'minjun@brand.kr',
    consentGiven: true,
    messages: [
      {
        from: 'visitor',
        text: '명함 500장 + 브로셔 200부 합산 견적 부탁드립니다. 파일은 PDF로 있습니다.',
        at: '2026-02-12T11:00:00Z',
      },
      {
        from: 'booth',
        text: '이민준님 안녕하세요! 파일 전달해 주시면 1영업일 내 견적서 발송해 드리겠습니다. 이메일은 quote@brandkit.kr 입니다.',
        at: '2026-02-12T11:45:00Z',
      },
    ],
    status: '보류',
    tags: ['견적문의', '대량주문'],
    memo: '파일 수령 대기 중',
    lastUpdated: '2026-02-12T11:45:00Z',
  },
];

// ─── Seed Leads ───────────────────────────────────────────────────────────────

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead-001',
    boothId: 'booth-001',
    source: 'inquiry',
    name: '김지수',
    company: '(주)테크웨이브',
    email: 'jisu.kim@company.co.kr',
    memo: '문의 스레드 연결: thread-001',
    consent: true,
    consentMarketing: false,
    createdAt: '2026-02-10T14:22:00Z',
  },
  {
    id: 'lead-002',
    boothId: 'booth-001',
    source: 'bizcard',
    name: '박서준',
    company: '웰니스코리아',
    phone: '010-5678-1234',
    email: 'seojun.park@wellness.kr',
    memo: '복지몰 구축 담당자. 분기별 정기 구매 가능성 높음.',
    consent: true,
    consentMarketing: true,
    createdAt: '2026-02-11T10:30:00Z',
  },
  {
    id: 'lead-003',
    boothId: 'booth-003',
    source: 'email_info',
    email: 'esg@greencorp.co.kr',
    memo: '이메일 정보 수신 신청',
    consent: true,
    consentMarketing: true,
    createdAt: '2026-02-11T14:00:00Z',
  },
  {
    id: 'lead-004',
    boothId: 'booth-004',
    source: 'bizcard',
    name: '최유진',
    company: 'SalesForce Korea',
    phone: '02-1234-5678',
    email: 'yujin.choi@salesforce.com',
    memo: 'CRM 파트너십 논의 가능. 다음 주 콜 예정.',
    consent: true,
    consentMarketing: false,
    createdAt: '2026-02-12T09:15:00Z',
  },
  {
    id: 'lead-005',
    boothId: 'booth-002',
    source: 'survey',
    email: 'minjun@brand.kr',
    name: '이민준',
    memo: '설문 응답: 대량 인쇄 관심, 연락 희망',
    consent: true,
    consentMarketing: true,
    createdAt: '2026-02-12T11:05:00Z',
  },
  {
    id: 'lead-006',
    boothId: 'booth-006',
    source: 'bizcard',
    name: '정하은',
    company: '(주)블루칩 HR',
    phone: '010-9876-5432',
    email: 'haeun@bluechip-hr.com',
    memo: '임직원 50명 복지 구독 검토 중. 3월 예산 확정 후 연락.',
    consent: true,
    consentMarketing: false,
    createdAt: '2026-02-13T16:45:00Z',
  },
];

// ─── Seed Policies ────────────────────────────────────────────────────────────

export const SEED_POLICIES: BoothPolicy[] = [
  {
    boothId: 'booth-001',
    startAt: '2026-03-01T09:00:00Z',
    endAt: '2026-03-15T18:00:00Z',
    allowViewAfterEnd: true,
    allowInquiryAfterEnd: false,
  },
  {
    boothId: 'booth-002',
    startAt: '2026-03-01T09:00:00Z',
    endAt: '2026-03-31T18:00:00Z',
    allowViewAfterEnd: true,
    allowInquiryAfterEnd: true,
  },
  {
    boothId: 'booth-003',
    startAt: '2026-02-15T09:00:00Z',
    endAt: '2026-02-28T18:00:00Z',
    allowViewAfterEnd: true,
    allowInquiryAfterEnd: false,
  },
  {
    boothId: 'booth-004',
    startAt: '2026-03-01T09:00:00Z',
    endAt: '2026-04-30T18:00:00Z',
    allowViewAfterEnd: true,
    allowInquiryAfterEnd: true,
  },
];

// ─── Seed Attachments ─────────────────────────────────────────────────────────

export const SEED_ATTACHMENTS: Attachment[] = [
  {
    id: 'att-001',
    boothId: 'booth-001',
    filename: 'TeaCo_카탈로그_2026.pdf',
    type: 'application/pdf',
    size: '2.4 MB',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'att-002',
    boothId: 'booth-001',
    filename: 'TeaCo_기업선물패키지_가격표.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: '380 KB',
    createdAt: '2026-01-20T10:05:00Z',
  },
  {
    id: 'att-003',
    boothId: 'booth-004',
    filename: 'DataFlow_제품소개서.pdf',
    type: 'application/pdf',
    size: '5.1 MB',
    createdAt: '2026-01-22T14:30:00Z',
  },
  {
    id: 'att-004',
    boothId: 'booth-003',
    filename: 'GreenSpace_ESG리포트_2025.pdf',
    type: 'application/pdf',
    size: '3.7 MB',
    createdAt: '2026-01-25T09:00:00Z',
  },
];

// ─── Seed Survey Responses ────────────────────────────────────────────────────

export const SEED_SURVEYS: SurveyResponse[] = [
  {
    id: 'survey-001',
    boothId: 'booth-001',
    visitorId: 'guest-seed-1',
    answers: { interests: ['기업선물', '복지'], purpose: '구매검토', wantsContact: true },
    createdAt: '2026-02-10T15:00:00Z',
  },
  {
    id: 'survey-002',
    boothId: 'booth-001',
    visitorId: 'guest-seed-2',
    answers: { interests: ['복지', '건강'], purpose: '정보수집', wantsContact: false },
    createdAt: '2026-02-11T10:00:00Z',
  },
  {
    id: 'survey-003',
    boothId: 'booth-004',
    visitorId: 'guest-seed-3',
    answers: { interests: ['SaaS', '영업자동화'], purpose: '파트너십', wantsContact: true },
    createdAt: '2026-02-11T11:30:00Z',
  },
  {
    id: 'survey-004',
    boothId: 'booth-003',
    visitorId: 'guest-seed-4',
    answers: { interests: ['ESG', '오피스'], purpose: '구매검토', wantsContact: true },
    createdAt: '2026-02-12T13:00:00Z',
  },
  {
    id: 'survey-005',
    boothId: 'booth-002',
    visitorId: 'guest-seed-5',
    answers: { interests: ['인쇄', '명함'], purpose: '견적', wantsContact: true },
    createdAt: '2026-02-12T14:00:00Z',
  },
];

// ─── Seed Staff Members ───────────────────────────────────────────────────────

export const SEED_STAFF: StaffMember[] = [
  {
    id: 'staff-001',
    boothId: 'booth-001',
    name: '이수진',
    email: 'sujin@teaco.kr',
    role: 'owner',
    status: 'active',
    invitedAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'staff-002',
    boothId: 'booth-001',
    name: '박민호',
    email: 'minho@teaco.kr',
    role: 'staff',
    status: 'active',
    invitedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'staff-003',
    boothId: 'booth-001',
    name: '김지영',
    email: 'jiyoung@agency.com',
    role: 'staff',
    status: 'pending',
    invitedAt: '2026-02-01T14:00:00Z',
  },
  {
    id: 'staff-004',
    boothId: 'booth-004',
    name: '최준혁',
    email: 'junhyuk@dataflow.io',
    role: 'owner',
    status: 'active',
    invitedAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'staff-005',
    boothId: 'booth-004',
    name: '한소영',
    email: 'soyoung@dataflow.io',
    role: 'staff',
    status: 'active',
    invitedAt: '2026-01-18T11:00:00Z',
  },
];

// ─── Seed Events ─────────────────────────────────────────────────────────────

export const SEED_EVENTS: BoothEvent[] = [
  {
    id: 'event-001',
    name: '2026 서울 B2B 박람회',
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    location: '코엑스 A홀',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'event-002',
    name: '스타트업 네트워킹 데이',
    startDate: '2026-03-15',
    endDate: '2026-03-15',
    location: '성수 S-Factory',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'event-003',
    name: '그린 비즈니스 엑스포',
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    location: '킨텍스 제2전시장',
    createdAt: '2026-02-10T08:00:00Z',
  },
];

export const SEED_PARTICIPATIONS: BoothEventParticipation[] = [
  { id: 'bp-001', boothId: 'booth-001', eventId: 'event-001', boothLocation: 'A-12', startAt: '2026-03-10', endAt: '2026-03-12' },
  { id: 'bp-002', boothId: 'booth-001', eventId: 'event-002', boothLocation: '2F-03', startAt: '2026-03-15', endAt: '2026-03-15' },
  { id: 'bp-003', boothId: 'booth-002', eventId: 'event-001', boothLocation: 'A-15', startAt: '2026-03-10', endAt: '2026-03-12' },
  { id: 'bp-004', boothId: 'booth-003', eventId: 'event-001', boothLocation: 'B-01', startAt: '2026-03-10', endAt: '2026-03-12' },
  { id: 'bp-005', boothId: 'booth-003', eventId: 'event-003', boothLocation: 'C-08', startAt: '2026-03-20', endAt: '2026-03-22' },
  { id: 'bp-006', boothId: 'booth-004', eventId: 'event-001', boothLocation: 'B-05', startAt: '2026-03-10', endAt: '2026-03-12' },
  { id: 'bp-007', boothId: 'booth-004', eventId: 'event-002', boothLocation: '1F-07', startAt: '2026-03-15', endAt: '2026-03-15' },
  { id: 'bp-008', boothId: 'booth-005', eventId: 'event-003', boothLocation: 'D-02', startAt: '2026-03-20', endAt: '2026-03-22' },
  { id: 'bp-009', boothId: 'booth-006', eventId: 'event-001', boothLocation: 'A-20', startAt: '2026-03-10', endAt: '2026-03-12' },
  { id: 'bp-010', boothId: 'booth-006', eventId: 'event-003', boothLocation: 'C-15', startAt: '2026-03-20', endAt: '2026-03-22' },
];
