# GitHub · Firebase Spark · Vercel Hobby 연결

이 문서는 실제 서비스 연결 절차입니다. 현재 외부 업로드나 배포는 실행하지 않았습니다. 비상업적 개인 프로젝트를 전제로 하며 무료 한도 내에서 운영합니다.

## 1. Firebase 프로젝트

1. Firebase Console에서 Spark 프로젝트를 생성합니다. 결제 계정을 연결하지 않습니다.
2. 프로젝트 설정 → 웹 앱을 등록하고 웹 설정 객체를 확인합니다.
3. Authentication → 로그인 방법 → 익명 인증을 활성화합니다.
4. Realtime Database를 생성합니다. 보안 모드로 시작합니다. 콘솔에서 databaseURL을 복사합니다.
5. `database.rules.json`의 전체 내용을 DB → 규칙에 적용합니다. 테스트 모드 전체 공개 읽기·쓰기로 배포하지 않습니다.
6. `.env.example`을 `.env.local`로 복사하고 다음 항목을 실제 웹 설정으로 채웁니다.

```dotenv
VITE_FIREBASE_API_KEY=웹앱_apiKey
VITE_FIREBASE_AUTH_DOMAIN=프로젝트.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=프로젝트ID
VITE_FIREBASE_DATABASE_URL=콘솔에서_복사한_DB_URL
VITE_FIREBASE_APP_ID=웹앱_appId
```

로컬 dev 서버를 다시 시작하고 ONLINE 표시를 확인합니다. Firebase 웹 apiKey는 클라이언트가 사용하는 공개 프로젝트 식별 설정입니다. 권한 보호는 인증과 Security Rules가 담당합니다. 서비스 계정 JSON, Admin SDK 키, 비공개 토큰을 브라우저 또는 Git에 넣으면 안 됩니다. Vite의 `VITE_*` 변수는 빌드 결과에 포함됩니다.

CLI를 사용할 경우 아래는 **사용자 프로젝트의 규칙을 실제 변경하는 명령**입니다. 에뮬레이터 명령과 구분하여 실제 적용을 요청했을 때만 실행합니다.

```powershell
npx.cmd firebase login
npx.cmd firebase deploy --only database --project 실제프로젝트ID
```

## 2. GitHub

이 디렉터리를 개인 GitHub 저장소의 프로젝트 루트로 업로드합니다. 아직 저장소를 생성하거나 git push하지 않았습니다. 기존에 다른 프로젝트를 포함한 상위 폴더 전체를 올리지 않습니다.

포함: src, tests, scripts, package.json, package-lock.json, index.html, tsconfig/vite 설정, firebase.json, database.rules.json, vercel.json, 문서, .env.example.

제외: `.env.local` 등 실제 환경 파일, node_modules, dist, .tools, .firebase, 로그, test-results, playwright-report, artifacts. .gitignore에 반영되어 있습니다. `artifacts/online-build`는 검증용 placeholder 설정이므로 배포하지 않습니다.

## 3. Vercel

1. Hobby 팀에서 개인 GitHub 저장소를 Import합니다.
2. 이 프로젝트가 저장소의 하위 디렉터리라면 Root Directory를 정확히 지정합니다.
3. Framework: Vite / Install: npm ci / Build: npm run build / Output: dist.
4. Project Settings → Environment Variables에 위 `VITE_FIREBASE_*` 5개 값을 넣습니다. 공개 테스트를 할 Preview/Production 범위에 맞춰 설정합니다.
5. 배포합니다. 환경변수 변경은 이미 만든 번들에 반영되지 않으므로 Redeploy가 필요합니다.
6. Authentication 설정의 승인된 도메인 목록에 배포 도메인을 확인/등록합니다.
7. 실제 페이지에 ONLINE 표시가 있는지 확인하고 로컬 탭 모드와 혼동하지 않습니다.

`vercel.json`을 포함했습니다. 클라이언트는 경로 기반 라우팅 없이 같은 페이지에서 동작하므로 SPA rewrite가 필요하지 않습니다. Vercel Functions나 별도의 WebSocket 서버를 사용하지 않습니다.

## 4. 실제 서비스 확인

- 브라우저/시크릿 창/다른 기기의 독립 세션 두 개로 같은 방에 입장
- 움직임·채팅·말풍선·이모트가 상대에게 보이는지 확인
- 가위바위보 확정 전 상대 선택이 노출되지 않고 결과가 같은지 확인
- 오목 차례·중복 착수·승리·기권·이탈 확인
- 다른 방의 참가자/채팅/게임이 보이지 않는지 확인
- 새로고침·브라우저 종료·회선 끊김/복구 후 참가자 수 확인
- Firebase Console Usage에서 실제 다운로드·연결·저장량 확인

에뮬레이터에서 통과한 검증이 실제 도메인·리전·회선·환경변수 검증을 대신하지 않습니다. 실제 프로젝트가 없으므로 이 확인은 아직 미실행입니다.

## 무료 요금제 조건과 운영

Firebase Spark Realtime Database: 동시 연결 100개, 저장 1GB, 다운로드 월 10GB 한도. Vercel Hobby는 개인·비상업적 용도이며 사용량 한도를 초과하면 서비스 제한이 생길 수 있습니다. 작은 데이터 구조와 이동 전송 제한을 사용해도 실제 접속 시간·방 인원에 따라 무료 한도를 넘을 수 있습니다. DESIGN.md에 트래픽 가정을 적었습니다.

Cloud Functions, Cloud Storage, Firestore, 전화 인증, 유료 외부 API를 사용하지 않습니다. 그래픽 에셋은 코드에 포함되어 이미지 업로드용 저장 서비스가 필요 없습니다. 결제·Blaze 전환·상용 운영은 이 배포 계획에 포함하지 않습니다.

공식 자료(2026-10-08 확인):
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/database/usage/limits
- https://firebase.google.com/docs/database/security/core-syntax
- https://firebase.google.com/docs/emulator-suite/install_and_configure
- https://vercel.com/pricing
