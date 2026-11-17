# 시험 조사와 근거

확인일: 2026-11-17. 한국 OPIc 시행 규칙은 현재 한국 공식 안내를 우선하고 ACTFL/LTI의 국제 안내는 평가 개념을 보완하는 데 사용했다.

| 자료 | 확인한 내용 | 반영 |
| --- | --- | --- |
| [한국 OPIc 공식 소개](https://www.opic.co.kr/opics/jsp/senior/receipt/aboutOpicMobile.jsp) | 준비 20분, 본시험 40분, 12/15문항, 문항당 2회 청취, 7문항 전후 재선택, 네 평가 영역 | 전체 상태 전이와 서버 타이머 |
| [ACTFL Familiarization Guide](https://www.actfl.org/uploads/files/general/OPIc_Familiarization_Guide.pdf) | 설문과 자기평가, 장비 점검 및 샘플, 자기소개 준비운동, 공인 평가자의 종합 평가 | 온보딩, 자기소개 제외, 비공식 평가 표시 |
| [LTI OPIc 안내](https://www.languagetesting.com/oral-proficiency-interview-by-computer-opic) | 개인화된 주제와 난이도, 공식 데모, 평가 과정 | 공식 자료 바로가기와 평가 설명 |
| [ACTFL 수험생 준비 안내](https://www.actfl.org/assessments/postsecondary-assessments/opi/tips-for-opi-and-opic-test-takers) | 시험 형식 이해와 자발적인 발화 연습 | 암기 답안보다 실제 경험을 말하는 연습 |
| 사용자가 제공한 `opic_guide.pdf` 80쪽 | 실제 PDF 페이지 10의 전체 프로세스, 14–15의 생활 배경 및 관심사 설문, 60의 문제 해결 롤플레이, 66–68의 주제 묶음과 모의시험, 69의 FAQ를 직접 렌더링해 확인. 텍스트 추출의 한글 폰트 맵이 깨져 핵심 페이지는 이미지로 검토 | 12개 관심사, SNS·사람·취업 준비 주제, 롤플레이 대안 제시, 설문 밖 주제 대응 |

제공 가이드의 행정 수치나 예시 배열은 과거 버전일 수 있다. 그 배열을 실제 시험의 고정 규칙으로 일반화하지 않았다. 공개 웹의 수험 대비 문제집도 검색했지만 실제 기출 여부·저작권·정확성을 확인할 수 없어 문항 원문과 모범 답안을 가져오지 않았다. 자체 라이브러리는 공개된 평가 기능을 참고한 창작 연습 문항이며 기출 DB가 아니다.

실제 OPIc은 AI 정답 채점 방식이 아니다. 공인 평가자가 전체 발화를 보고 숙련도를 판정한다. 이 앱의 AI 연습 평가와 반드시 구분한다.

## 인증과 모델

- [구독 연동 Cookbook](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt), [등록·연결](https://developers.openai.com/siwc/token-sharing-open-source/sign-in): 로컬 오픈소스·개인 앱의 동적 등록을 지원한다. 원격 호스팅 서비스는 별도 접근 승인이 필요하다. 신원 확인과 구독 사용 권한은 구분한다.
- [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna): 확인된 모델 ID와 medium reasoning을 기본값으로 설정했다. 음성 입력이 지원되지 않으므로 전사가 선행한다.
- [구독 연동의 지원 제한](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations): 음성 입력과 전사 API는 지원하지 않는다. 앱은 브라우저 전사를 사용하고 음성 업로드는 계정별 복습을 위해 24MiB까지 허용한다.
- [모델과 추론](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference), [연결·갱신](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions), [오류 처리](https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery): 방문자 토큰으로 모델 목록을 조회하고 Responses를 스트리밍하며 완료 이벤트 후 저장한다. 갱신 토큰 회전을 직렬화하고 사용 한도 오류를 별도로 처리한다.
- [MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition): 브라우저 호환성 제한과 원격 인식 서비스로의 전송 가능성을 확인했다. 사용자 고지와 직접 전사 입력 경로를 둔다.
- [OpenAI 파일 전사](https://developers.openai.com/api/docs/guides/speech-to-text): 별도 API 키를 쓰는 선택 기능으로 gpt-transcribe를 연결했다. multipart 입력과 languages[] 힌트, 25MB 제한을 확인했다. 앱 상한은 24MiB다. 실제 키 없이 유료 전사를 실행하지 않았다.
- [Next.js](https://nextjs.org/docs), 설치된 `node_modules/next/dist/docs`: App Router, Route Handlers, 비동기 cookies, Node.js 서버 배포를 확인했다.
- [shadcn/ui](https://ui.shadcn.com/docs/installation/manual), [openid-client](https://github.com/panva/openid-client): 수동 설치 방식의 공개 소스 UI와 표준 OIDC/PKCE 클라이언트를 사용한다.
