# MaruAnki

개인용 초경량 메모/암기 웹앱. Google Keep처럼 빠르게 동기화되지만, "문장 외우기" 볼트와 카드형 복습(만료기간 관리) 기능이 있다.

빌드 도구 없는 순수 HTML/CSS/JS. 데이터/인증은 Firebase(Auth + Firestore)를 사용하고, GitHub Actions가 GitHub Pages에 자동 배포한다.

## 기능

- 이메일/비밀번호 회원가입, 로그인
- 로그인 후 "볼트"(데이터베이스 단위) 생성. 생성 시 형식을 하나 고르며, **생성 후에는 형식을 바꿀 수 없음** (레이아웃 자체가 달라지기 때문)
  - **카드 스타일**: 일반적인 Anki 방식. 여러 열 그리드에 짧은 문답 카드를 촘촘히 배치, 텍스트 최대 300자
  - **문장 스타일**: 긴 문장 통째로 외우기 최적화. 1열 전체 너비, 더 큰 글자/줄간격, 텍스트 최대 4000자
- 볼트 안에 카드 생성/수정/삭제. 카드는 앞면/뒷면 구조
  - 기본은 앞면(전체 텍스트 + 만료기간)만 노출, 만료 임박도에 따라 초록→노랑→빨강으로 색이 바뀜
  - 앞면 클릭 시 뒷면(답) 확인
  - 뒷면 상태에서 Anki 스타일 복습 버튼 제공
    - **again**: 노랑으로 고정(무한 대기), 사용자가 다시 누르기 전까지 시간에 따라 변하지 않음. 고정 상태에서 같은 버튼을 다시 누르면("다시 체크") 원상태(등급 모드)로 복귀
    - **bad / good / ok**: 각각 배율(기본 1.2x / 2x / 3x)만큼 만료 간격을 늘리고 초록색 등급 모드로 전환
  - 볼트 상세 화면의 **설정** 버튼에서 기본 간격, bad/good/ok 배율, 최소·최대 간격을 조정 가능
  - 카드는 CSS 3D 트랜스폼으로 실제로 뒤집히며, 앞/뒤 중 더 긴 문장 기준으로 카드 높이가 자동 조절됨(긴 문장 암기용)
  - 키보드 단축키: 카드를 클릭해 선택한 뒤 `Space`로 뒤집기, `1`/`2`/`3`/`4`로 각각 again/bad/good/ok
  - 색 외에도 상태별 아이콘+텍스트(● 안정 / ▲ 주의 / ■ 긴급 / ⏸ 보류)를 함께 표시해 색맹 사용자도 상태 구분 가능
- 볼트 목록에서 각 볼트 타일에 "복습 필요 N개" 배지 표시 (만료 임박/초과 카드 수)
- 다크 모드: OS `prefers-color-scheme` 설정을 따라 자동 전환
- 모바일 우선 터치 타겟 (버튼 최소 44px, 좁은 화면에서 1열 그리드)

## 처음 설정하기

### 1. Firebase 프로젝트 만들기

1. https://console.firebase.google.com 에서 새 프로젝트 생성
2. **Authentication** > 로그인 방법 에서 "이메일/비밀번호" 활성화
3. **Firestore Database** 생성 (프로덕션 모드 권장)
4. Firestore 규칙을 이 저장소의 [firestore.rules](firestore.rules) 내용으로 교체 (Firebase 콘솔 > Firestore > 규칙 탭에 붙여넣기, 게시)
5. 프로젝트 설정 > 일반 > 내 앱 > 웹 앱 추가 후 나오는 설정 객체(apiKey 등)를 복사

### 2. 로컬에서 실행하기

```bash
cp js/firebase-config.example.js js/firebase-config.js
# firebase-config.js를 열어 방금 복사한 값으로 채우기
```

정적 파일이므로 아무 정적 서버로 열면 된다 (module script라 file:// 직접 열기는 브라우저 CORS 제약으로 안 될 수 있음):

```bash
npx serve .
# 또는
python -m http.server 8000
```

### 3. GitHub Pages 자동 배포 설정

1. 저장소 Settings > Pages > Source를 **GitHub Actions**로 설정
2. 저장소 Settings > Secrets and variables > Actions에 `FIREBASE_CONFIG_JSON` 시크릿 추가. Firebase 콘솔의 "내 앱" 설정 화면에 나오는 `const firebaseConfig = { ... };` 블록을 그대로 복사해 붙여넣어도 되고, JSON으로 바꿔서 넣어도 된다 ([.github/scripts/write-firebase-config.js](.github/scripts/write-firebase-config.js)가 두 형식 모두 처리):
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   };
   ```
3. `main` 브랜치에 푸시하면 [.github/workflows/deploy.yml](.github/workflows/deploy.yml) 워크플로우가 `js/firebase-config.js`를 시크릿으로부터 생성하고 GitHub Pages에 배포한다.

> Firebase 설정 값(apiKey 등)은 비밀키가 아니라 공개되어도 되는 클라이언트 식별자지만, Firestore 보안 규칙(`firestore.rules`)이 실제 접근 제어를 담당하므로 반드시 규칙을 배포해야 한다.

## 데이터 구조 (Firestore)

```
users/{uid}/vaults/{vaultId}
  - name: string
  - type: "card" | "sentence" (생성 후 불변)
  - createdAt: timestamp
  - settings: { baseIntervalDays, minIntervalDays, maxIntervalDays, badMultiplier, goodMultiplier, easyMultiplier }

users/{uid}/vaults/{vaultId}/cards/{cardId}
  - front: string
  - back: string
  - status: "graded" | "held"
  - intervalDays: number
  - expiresAt: timestamp
  - createdAt, updatedAt: timestamp
```
