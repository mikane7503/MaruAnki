# MaruAnki

개인용 초경량 메모/암기 웹앱. Google Keep처럼 빠르게 동기화되지만, "문장 외우기" 볼트와 카드형 복습(만료기간 관리) 기능이 있다.

빌드 도구 없는 순수 HTML/CSS/JS. 데이터/인증은 Firebase(Auth + Firestore)를 사용하고, GitHub Actions가 GitHub Pages에 자동 배포한다.

## 기능

- 이메일/비밀번호 회원가입, 로그인
- 로그인 후 "볼트"(데이터베이스 단위) 생성. 현재 지원 형식: **문장 외우기**
- 볼트 안에 카드 생성/수정/삭제. 카드는 앞면/뒷면 구조
  - 기본은 앞면(전체 텍스트 + 만료기간)만 노출, 만료 임박도에 따라 초록→노랑→빨강으로 색이 바뀜
  - 앞면 클릭 시 뒷면(답) 확인
  - 뒷면 상태에서 **"이이네"**: 만료기간 연장(기본 5일, 누를 때마다 2배씩 증가, 최대 60일) + 초록색 고정 등급으로 리셋
  - 뒷면 상태에서 **"아이마이"**: 노랑으로 고정, 사용자가 다시 조작하기 전까지 시간에 따라 변하지 않음

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
2. 저장소 Settings > Secrets and variables > Actions에 `FIREBASE_CONFIG_JSON` 시크릿 추가. 값은 Firebase 설정 객체를 JSON으로:
   ```json
   {
     "apiKey": "...",
     "authDomain": "...",
     "projectId": "...",
     "storageBucket": "...",
     "messagingSenderId": "...",
     "appId": "..."
   }
   ```
3. `main` 브랜치에 푸시하면 [.github/workflows/deploy.yml](.github/workflows/deploy.yml) 워크플로우가 `js/firebase-config.js`를 시크릿으로부터 생성하고 GitHub Pages에 배포한다.

> Firebase 설정 값(apiKey 등)은 비밀키가 아니라 공개되어도 되는 클라이언트 식별자지만, Firestore 보안 규칙(`firestore.rules`)이 실제 접근 제어를 담당하므로 반드시 규칙을 배포해야 한다.

## 데이터 구조 (Firestore)

```
users/{uid}/vaults/{vaultId}
  - name: string
  - type: "sentence"
  - createdAt: timestamp

users/{uid}/vaults/{vaultId}/cards/{cardId}
  - front: string
  - back: string
  - status: "graded" | "held"
  - intervalDays: number
  - expiresAt: timestamp
  - createdAt, updatedAt: timestamp
```
