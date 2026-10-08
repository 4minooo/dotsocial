# DOT SOCIAL v1.0

복셀 캐릭터로 5개의 3D 공간을 걷고, 채팅·이모트·가위바위보·오목을 즐기는 PC 우선 웹 앱. React 19 / TypeScript / Vite / React Three Fiber 9 / Three.js / Firebase Authentication + Realtime Database.

공개 앱: https://dotsocial.vercel.app/ · GitHub: https://github.com/4minooo/dotsocial

2026-10-08 Firebase Spark 프로젝트 `dotsocial-4minooo`와 Vercel Hobby를 연결했습니다. 공개 주소에서 두 독립 익명 세션의 채팅, 가위바위보 결과, 오목 승리, 정상 퇴장을 확인했습니다. 다른 기기와 장시간 접속에 대한 검증은 별도입니다.

## 구현된 기능

- 닉네임, 헤어 4종(긴머리 포함), 머리·상의·하의 색 5종, 모자·안경, 3D 미리보기, 설정 저장
- 실제 3D 공원·옥상·사무실·카페·해변, 고정 사선 카메라, 맵별 충돌
- 방향키 이동, 대각선 속도 보정, 걷기 동작, 포커스·채팅·모달 입력 차단
- 더 큰 손 흔들기(스윙 폭 1.7rad), 놀라기, 기쁨 점프, 머리 위 큰 이모트 표시
- 방당 8명, 참가자 목록, 방 변경, 위치 보간, 초당 최대 약 5회 이동 동기화, 정지 후 마지막 위치 전송
- 공간 채팅, 200자 제한, 한글 IME 조합 Enter 보호, 말풍선, 음소거, 도배 제한
- 가위바위보 초대/수락/거절/취소, SHA-256 커밋·공개, 결과 검증, 시간 제한, 재대결
- 15×15 오목, 렌주 금수(흑 삼삼·사사·장목), 흑 정확히 5목·백 5목 이상 승리, 자유 오프닝, 착수마다 10초, 시간 초과 패배
- PC 클릭·모바일 터치 방향 패드: 누르고 이동, 멀티터치 대각선, 놓기·취소·창 전환·모달에서 이동 정지
- 채팅은 최근 10분의 접속 중 참가자 메시지만 표시, 정상 퇴장 시 삭제, 만료·비정상 이탈 기록은 참가 중인 클라이언트가 정리
- Firebase 익명 인증, 연결 상태, onDisconnect, 재연결, 새로고침·중복 접속 처리
- 제한된 데이터 경로와 Security Rules, 실제 Firebase 에뮬레이터 검증
- 저사양 그래픽과 반응형 화면, WebGL 오류 안내

가짜 참가자나 봇은 없습니다. 게임은 실제 참가자가 두 명 있어야 할 수 있습니다. 모바일에서도 화면 방향 버튼으로 이동할 수 있습니다. 채팅 정리에 유료 예약 서버를 사용하지 않으므로 모두 접속을 끊은 공간의 잔여 기록은 다음 참가 시 정리됩니다. 화면에서는 10분이 지난 기록을 표시하지 않습니다.

## 실행

Node.js 22.12 이상 권장. PowerShell:

```powershell
cd "C:\Users\W11H\Documents\모바일 앱 개발\도트 소셜"
npm.cmd ci
npm.cmd run dev
```

개발 주소: http://127.0.0.1:5190/ (고정 포트). 제목은 `DOT SOCIAL · 작은 세상, 새로운 만남`입니다. 프로덕션 미리보기는 `npm.cmd run preview`, http://127.0.0.1:4190/ 입니다.

## 연결 모드

1. **로컬 탭 연결**: Firebase 설정 없이 기본 실행됩니다. 같은 브라우저·같은 origin의 탭이나 창끼리 IndexedDB + BroadcastChannel로 실제 데이터를 공유합니다. 다른 브라우저, 시크릿 창, 다른 기기는 연결되지 않습니다. 로컬 정원과 게임 변경은 IndexedDB 쓰기 트랜잭션으로 직렬화합니다. 정상 퇴장 시 즉시, 비정상 종료 시 약 12초 이후 참가 상태를 정리합니다. 로컬 DB의 조작 방지는 보장하지 않습니다.
2. **Firebase 테스트**: `npm.cmd run emulators` 실행 후 홈에서 Firebase 테스트를 선택하거나 http://127.0.0.1:5190/?mode=emulator 에 접속합니다. Auth 9099 / Realtime Database 9000 / demo-dot-social 프로젝트. 서로 독립된 브라우저 세션으로 테스트할 수 있습니다. 실제 공개 서버가 아닙니다. 이 버튼과 URL 모드는 개발 빌드에서만 활성화됩니다.
3. **온라인 연결**: `.env.local` 또는 Vercel 환경변수에 실제 Firebase 웹 설정을 넣고 재시작/재빌드하면 기본 모드가 실제 Firebase로 전환됩니다. 로컬 모드는 `?mode=local`로 선택할 수 있습니다. 공개 앱의 Production/Preview 환경변수에 실제 Firebase 설정을 등록했습니다. 새로 복제한 저장소에는 실제 환경 파일이 포함되지 않으므로 로컬 실행은 기본적으로 로컬 탭 모드입니다.

익명 인증은 탭별 session persistence를 사용하여 독립 탭에 별도 UID를 부여하고 새로고침 시 같은 UID를 유지합니다. 복제된 탭이 같은 UID로 접속하면 기존 참가 상태가 정리될 때까지 중복 입장을 거부합니다. 캐릭터 설정은 이 브라우저의 localStorage에 저장됩니다. 저장 정보 삭제 시 초기화됩니다.

## 조작

- 방향키: 화면 기준 이동
- 화면 방향 버튼: 마우스 또는 손가락으로 누르고 이동
- Enter: 채팅 포커스 / 메시지 전송 (Shift+Enter 줄바꿈)
- 숫자 1 / 2 / 3: 손 흔들기 / 놀라기 / 기뻐하기
- 참가자 옆 ✊ / ●: 가위바위보 / 오목 초대
- 참가자 옆 스피커: 해당 사용자 음소거·해제
- 맵 선택 메뉴: 방 변경
- 홈으로: 정상 퇴장
- Esc: 도움말 닫기 / 채팅 포커스 해제

## 검증

```powershell
npm.cmd run check
npx.cmd playwright install chromium
npm.cmd run emulators
# 별도 터미널에서:
npm.cmd run test:rules
npm.cmd run test:browser
npm.cmd audit
```

에뮬레이터에는 Java 21 이상이 필요합니다. 이 작업 PC에서는 프로젝트 `.tools/java21`에 내려받은 Java를 실행 스크립트가 사용합니다. `.tools`는 Git에서 제외되므로 다른 PC/CI에서는 Java를 별도로 준비해야 합니다.

`npm.cmd run emulators:test`는 에뮬레이터 시작 → 규칙 테스트 → 종료를 한 번에 실행합니다. 이미 에뮬레이터가 켜져 있으면 별도 `test:rules`를 사용합니다. 테스트는 demo 프로젝트의 로컬 DB를 초기화하므로 사용자 프로젝트에는 연결하지 않습니다.

- 핵심 로직: 이동·충돌·닉네임, 가위바위보 9조합, 오목 4방향·장목·행 경계, 커밋, 이모트 진폭
- 보안: 미인증·다른 방·다른 사용자 쓰기 거부, 정원·중복 UID, 세션 정리, 저장 상한, 도배 제한, 오목 상태 변경, 선택 선공개·변경 거부
- 브라우저: 설정 저장, 이동 차단, 5개 맵과 모바일 넘침, 두 탭 로컬 채팅, IME 이벤트, 두 독립 Firebase 세션의 채팅·음소거·이모트·RPS·오목, 방 분리, 연결 끊김·재연결·새로고침·종료

브라우저 캡처는 `artifacts/`에 저장됩니다. `node scripts/online-build.mjs`는 실제 자격 증명을 사용하지 않는 빌드용 placeholder로 온라인 코드가 포함된 번들을 `artifacts/online-build`에 생성합니다. 이 출력은 빌드 검증용으로 실제 배포하지 않습니다. 배포 출력은 `dist/`입니다.

## 주요 파일

| 파일                                                     | 역할                                        |
| -------------------------------------------------------- | ------------------------------------------- |
| `src/App.tsx`, `src/Lobby.tsx`                           | 홈·공간·채팅·참가자 UI                      |
| `src/Avatar.tsx`, `src/emotes.ts`                        | 복셀 캐릭터·확대 이모트 동작                |
| `src/World.tsx`, `src/Scenery.tsx`, `src/WorldLabel.tsx` | 3D·5개 맵·충돌·보간·말풍선                  |
| `src/social/firebase.ts`                                 | Firebase 인증·입장·presence·실시간·트랜잭션 |
| `src/social/local.ts`                                    | 같은 브라우저의 실제 탭 연결                |
| `src/GamePanel.tsx`, `src/social/games.ts`               | 두 미니게임과 순수 게임 로직                |
| `database.rules.json`, `scripts/generate-rules.mjs`      | 배포 규칙과 생성 원본                       |
| `firebase.json`, `scripts/emulators.ps1`                 | 에뮬레이터 설정                             |
| `DESIGN.md`, `DEPLOY.md`                                 | 데이터 설계·제약·무료 사용량·배포 절차      |
| `REQUIREMENTS.txt`                                       | 사용자 원본 요구사항                        |

## 무료 배포와 현재 상태

기능 소스·로컬 및 에뮬레이터 테스트·배포 설정을 준비했습니다. GitHub 업로드, 실제 Firebase 생성/규칙 적용, Vercel 배포는 수행하지 않았습니다. 공개 운영 전에는 [DEPLOY.md](DEPLOY.md)의 사용자 프로젝트 연결과 실제 환경 확인이 필요합니다.

Firebase Spark / Vercel Hobby, Cloud Functions·Cloud Storage·Firestore·별도 WebSocket 서버·유료 API 없이 구성합니다. Vercel Hobby는 개인·비상업적 사용 조건입니다. Firebase 무료 연결·저장·다운로드 한도 내에서만 운영 가능하며 무제한 무료 서비스가 아닙니다. 보상·랭킹이 없는 캐주얼 게임이고 서버 권위 판정과 운영자 신고/차단 시스템은 제공하지 않습니다. 보안 규칙의 실제 보호 범위와 제약은 DESIGN.md에 명시합니다.
