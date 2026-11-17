# opic studio UI foundations

사용자가 다음 행동을 찾기 쉬운 학습 도구를 만든다. 흰색 본문, 중립색 사이드바, 일관된 간격, 읽을 수 있는 글자 크기를 사용한다. 홍보용 히어로, 영어 슬로건, 장식용 파형과 임의의 예시 성적은 사용하지 않는다.

## 공식 컴포넌트

`npx shadcn@latest add --all --yes --overwrite`로 현재 레지스트리 전체를 내려받았다. `src/components/ui/`에 61개 TSX 파일과 `src/hooks/use-mobile.ts`가 있다. 필요한 컴포넌트만 화면에서 import한다. 다운로드한 모든 컴포넌트를 한 화면에 표시하지 않는다.

`components.json`은 new-york / neutral / CSS variables / Lucide 구성을 유지한다. 공식 소스의 CVA, Radix 접근성, 포털과 포커스 처리를 그대로 사용한다. 앱의 여백을 맞추려고 Button·Card·Sidebar 기본 구현을 다시 만들지 않는다.

| 역할 | 사용하는 컴포넌트 |
| --- | --- |
| 앱 프레임 | SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarRail |
| 모바일 메뉴 | Sidebar가 제공하는 Sheet, 명시적 닫기 버튼 |
| 경로·계정 | Breadcrumb, Avatar, DropdownMenu |
| 콘텐츠 패널 | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| 입력 | Input, Select, NativeSelect, Label, Checkbox, RadioGroup, Toggle, Textarea |
| 정보·목록 | Table, Badge, Empty, Accordion, Pagination, Separator |
| 확인·알림 | Dialog, DialogTitle, DialogDescription, Alert |

## 소유권과 구조

- `src/app/globals.css`: 전역 진입점. `foundations.css`를 import한다.
- `src/app/foundations.css`: 색상·간격·타입·그리드 토큰과 시험/복습의 의미 있는 스타일.
- `src/components/layout/app-shell.tsx`: 내비게이션과 상단 바. 본문의 기능에 관여하지 않는다.
- `src/components/layout/stack.tsx`: HStack, VStack, 12컬럼 Grid와 GridItem.
- `src/components/layout/page.tsx`: 공통 페이지 제목과 섹션 제목.
- `src/components/workspace/`: 홈, 문제 목록, 기록, 가이드, 설정. 각 화면을 별도 파일에서 관리한다.
- `src/components/studio.tsx`: 세션과 화면 전환, 시험 시작/조회/삭제를 조정한다.

외부 간격은 Page/Stack/Grid가, 내부 간격은 Card 슬롯이 책임진다. CardContent 안에 불필요한 p-6을 추가해 48px 패딩을 만들지 않는다. 레거시 시험 패널은 Card에 명시적인 utility class를 전달해 기본 gap/padding을 병합한다. 보조 글자 클래스는 Tailwind의 `text-secondary`와 충돌하지 않는 `text-subtle`을 사용한다.

## 레이아웃과 간격

| 항목 | 기준 |
| --- | --- |
| 간격 단위 | 4px: 0 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 |
| 사이드바 | 펼침 256px, 아이콘 48px, 모바일 Sheet 288px |
| 상단 바 | 56px, 본문과 같은 좌우 거터 |
| 본문 최대 너비 | 패딩 포함 1280px, 가운데 정렬 |
| 페이지 거터 | 데스크톱 32px, 768px 미만 16px |
| 페이지 상단 | 데스크톱 32px, 모바일 24px |
| 섹션 사이 | 32px |
| 패널 내부 | 24px |
| 그룹·폼 필드 | 16px, 라벨과 입력 8px |
| 그리드 거터 | 데스크톱 24px, 모바일 16px |
| 기본 버튼·입력 높이 | 36px, 작은 버튼 32px, 큰 버튼 40px |
| 작은 모서리 / 기본 패널 | 4·6px / 12px |

Grid는 모든 화면에서 `repeat(12, minmax(0, 1fr))`이다. 본문 컨테이너 너비가 56rem 이상이면 8+4, 6+6, 3+3+3+3 등 지정한 span을 적용한다. 42–56rem에서는 6과 3 span을 절반으로 표시하고 나머지는 전체 너비로 쌓는다. 더 작은 화면에서는 전체 너비로 쌓으며 결과 지표만 모바일에서 6+6을 유지한다. 사이드바를 접으면 확보된 본문 너비에 따라 다시 배치된다.

HStack/VStack의 gap은 지정된 spacing 토큰만 받는다. 본문 패널을 Grid의 지정 컬럼 밖으로 밀어내는 음수 마진, 장식용 절대 위치, 임의의 작은 폰트를 추가하지 않는다.

## 타이포그래피

외부 폰트 다운로드 없이 설치된 한글 시스템 폰트를 사용한다. 숫자와 시간에는 tabular-nums를 적용한다.

| 역할 | 크기 | 굵기 |
| --- | --- | --- |
| 페이지 제목 | 24px | 600 |
| 주요 카드·영어 질문 | 18px | 500–600 |
| 섹션 제목 | 16px | 600 |
| 카드 제목·내비게이션·본문 | 14px | 400–600 |
| 보조 설명·메타 | 12px | 400–500 |
| 통계 숫자 | 24px, 모바일 20px | 600 |

본문 행간은 1.6, 긴 설명은 1.75, 전사문은 1.9다. 12px 미만의 메타 텍스트를 사용하지 않는다. shadcn 입력은 모바일에서 기본 16px을 사용할 수 있다.

## 색상과 상태

| 토큰 | 값 |
| --- | --- |
| 배경 / 패널 / 팝오버 | #ffffff |
| 본문 / 주요 버튼 | #18181b |
| 보조 글자 | #71717a |
| 보조 표면 | #f4f4f5 |
| 사이드바 | #fafafa |
| 사이드바 선택 | #ededf0 |
| 경계선 | #e4e4e7 |
| 입력 경계 / 포커스 | #d4d4d8 / #a1a1aa |
| 오류 | #dc2626 |

녹음 중 빨강, 문법 수정 결과의 초록 등 의미 있는 상태에만 별도 색을 사용한다. 선택은 체크·라벨·aria 상태로도 표현한다. 포커스, Escape, 모달 포커스 제한은 공식 컴포넌트의 동작을 유지하고 reduced-motion을 존중한다.

## 화면별 적용

홈은 세 개의 실제 학습 지표, 모의시험 시작/이어가기, 최근 기록, 연습 설정과 한 문항 연습으로 구성한다. 문제 라이브러리는 검색·주제·유형 필터와 12문항 페이지 단위를 사용한다. 기록은 실제 HTML Table로 표시한다. 준비 화면의 체크박스·난이도·주제 선택은 각각 Checkbox·RadioGroup·Toggle을 사용한다. 시험은 학습 사이드바를 숨기고 Ava·질문·녹음·전체 남은 시간에 집중한다.

## 검증

`scripts/check-ui.js`는 합성 마이크 입력을 사용하는 독립 브라우저 컨텍스트에서 실제 MediaRecorder → 저장 → 재생을 검증한다. 유료 AI 호출은 이 UI 검사에 포함하지 않는다. 데스크톱 1440px / 모바일 390px에서 12컬럼, 실제 계산된 글자 크기와 패딩, 사이드바 폭·접기·단축키·모바일 Sheet, 설문·녹음·난이도 조정·복습·삭제·검색을 확인한다.

화면 증거는 `output/playwright/`에 보관한다. `before-foundations-desktop.png`는 변경 전 화면이고 `dashboard-desktop.png`, `dashboard-mobile.png`, `survey.png`, `exam-room.png`, `review.png`는 현재 화면이다.
