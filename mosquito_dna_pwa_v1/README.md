# Mosquito DNA PWA v1

기준 UI: 기존 모바일 웹앱 v4.4

이 패키지는 `refshub.net`처럼 Chrome에서 **설치 가능한 PWA**로 동작하도록 구성한 버전입니다.

## 구조

```text
mosquito_dna_pwa_v1/
├─ public/
│  ├─ index.html
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  ├─ _headers
│  └─ icons/
├─ functions/
│  └─ api.js
├─ apps-script/
│  └─ PwaApi.gs
└─ README.md
```

## 동작 구조

```text
설치형 PWA
   ↓ same-origin
/api (Cloudflare Pages Function)
   ↓ server-to-server
Apps Script Web App
   ↓
Google Sheet
```

외부 PWA에서는 `google.script.run`을 직접 사용할 수 없기 때문에,
`index.html` 안에 호환 레이어를 넣어 기존 v4.4 코드를 거의 그대로 유지했습니다.

---

# 1. Apps Script 설정

기존 Apps Script 프로젝트에서:

- `Code.gs` 그대로 유지
- `mobileApp.gs` 그대로 유지
- 새 파일 `PwaApi.gs` 추가
- 이 패키지의 `apps-script/PwaApi.gs` 전체 복사

그 다음 `createPwaApiSecretOnce()` 함수를 **한 번 실행**하세요.

Apps Script 실행 로그에:

```text
PWA_API_SECRET = xxxxxxxxxxxxxxxxx
```

형태로 값이 나옵니다.

이 값을 잠시 보관하세요.

## Apps Script Web App 재배포

`배포 → 배포 관리 → 수정 → 새 버전`

실행 사용자:
- 나

액세스 권한:
- Anyone / 모든 사용자

배포 후 `/exec`로 끝나는 Web App URL을 복사합니다.

주의:
Apps Script URL 자체를 PWA에 직접 넣지 않습니다.
Cloudflare의 서버 환경 변수에만 넣습니다.

---

# 2. Cloudflare Pages 배포

Pages Functions가 필요하기 때문에 단순 Drag & Drop보다는
**GitHub 연동 또는 Wrangler 배포**를 사용해야 합니다.

## 방법 A — GitHub 연결

1. 이 폴더 전체를 GitHub 저장소에 올립니다.
2. Cloudflare → Workers & Pages → Create → Pages
3. GitHub 저장소 연결
4. Framework preset: None
5. Build command: 비워둠
6. Build output directory: `public`
7. 배포

`functions/api.js`는 자동으로 `/api`가 됩니다.

## 방법 B — Wrangler

프로젝트 루트(`public`, `functions`가 함께 보이는 위치)에서:

```bash
npx wrangler pages deploy public
```

처음 실행 시 Cloudflare 로그인과 프로젝트 이름 설정을 진행합니다.

---

# 3. Cloudflare 환경 변수

Cloudflare Pages 프로젝트에서:

`Settings → Variables and Secrets`

다음 3개를 설정합니다.

### GAS_API_URL
Apps Script Web App의 `/exec` URL

예:
```text
https://script.google.com/macros/s/XXXXXX/exec
```

### API_SECRET
Apps Script에서 `createPwaApiSecretOnce()` 실행 후 얻은
`PWA_API_SECRET` 값

### APP_ACCESS_CODE
휴대폰에서 처음 앱을 열 때 입력할 접속 코드

예:
```text
lab2026mosquito
```

원하는 값으로 정하면 됩니다.

`APP_ACCESS_CODE`는 반드시 Secret으로 저장하는 것을 권장합니다.

환경 변수 설정 후 재배포하세요.

---

# 4. 설치

Cloudflare Pages 주소 예:

```text
https://mosquito-dna.pages.dev
```

Android Chrome에서 접속 후:

`⋮ → 설치`

또는 Chrome이 설치 배너/메뉴를 표시하면 `설치`를 선택합니다.

설치 후 홈 화면의 **Mosquito DNA** 아이콘으로 실행하면
주소창 없는 standalone 앱으로 열립니다.

첫 실행 때 `APP_ACCESS_CODE`를 한 번 입력합니다.
코드는 해당 기기의 localStorage에 저장되므로 정상 사용 중에는 다시 묻지 않습니다.

접속 코드가 변경되었다면 사이트 데이터/localStorage를 삭제하거나,
잘못된 코드 입력 시 앱이 기존 값을 자동 삭제한 뒤 새로고침 시 다시 묻습니다.

---

# 5. 오프라인 동작

Service Worker는 앱 화면과 아이콘을 캐시합니다.

기존 v4.4의:
- localStorage 데이터 캐시
- pending 변경사항 저장
- 온라인 복귀 후 batch sync

동작을 그대로 유지합니다.

`/api` 응답은 Service Worker가 캐시하지 않습니다.

---

# 6. PWA 설치 파일

Manifest 설정:

- name: Mosquito DNA
- display: standalone
- start_url: /
- scope: /
- lang: ko
- orientation: any
- 64 / 192 / 512 아이콘
- maskable 512 아이콘

---

# 보안 구조

두 단계로 막습니다.

1. `APP_ACCESS_CODE`
   - PWA 사용자 → Cloudflare API 접근 통제
   - 브라우저 소스 코드에는 들어 있지 않음

2. `API_SECRET`
   - Cloudflare → Apps Script 사이 인증
   - 브라우저에는 절대로 노출되지 않음

따라서 Apps Script Web App을 `Anyone`으로 배포하더라도,
정상 API 호출에는 별도 secret이 필요합니다.
