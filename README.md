# 일일 업무 보고앱

업무를 등록하고 중요도·긴급도에 따라 우선순위를 자동 계산하며, Supabase에 사용자별로 안전하게 저장하는 반응형 웹앱입니다.

## 주요 기능

- 이메일 회원가입·로그인
- 업무 추가·수정·삭제 및 완료 체크
- 중요도 + 긴급도 기반 우선순위 자동 계산
- 오늘 마감 업무 빨간색 강조
- 완료율과 남은 예상시간 자동 계산
- Supabase Database 저장 및 사용자별 RLS 보안
- PC·태블릿·스마트폰 반응형 화면

## 1. Supabase 무료 프로젝트 만들기

1. [Supabase](https://supabase.com)에 로그인하고 **New project**를 누릅니다.
2. 프로젝트 이름과 데이터베이스 비밀번호를 정하고 무료 요금제로 생성합니다.
3. 왼쪽 메뉴 **SQL Editor → New query**를 엽니다.
4. `supabase/migrations/202608240001_create_tasks.sql` 파일 전체를 복사해 붙여넣고 **Run**을 누릅니다.
5. **Authentication → Providers → Email**에서 Email 로그인이 켜져 있는지 확인합니다.
6. 테스트를 간단히 하려면 **Authentication → Sign In / Providers → Email → Confirm email**을 잠시 끌 수 있습니다. 실제 운영에서는 다시 켜는 것을 권장합니다.

## 2. 환경변수 설정

1. Supabase의 **Project Settings → API**에서 Project URL과 Publishable key를 확인합니다.
2. 프로젝트 최상위에서 `.env.example`을 복사해 `.env` 파일을 만듭니다.
3. 아래처럼 실제 값을 입력합니다. Secret key나 `service_role` 키는 절대 넣지 않습니다.

```env
VITE_SUPABASE_URL=https://프로젝트참조값.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_실제키
```

`VITE_` 환경변수는 최종 브라우저 코드에 포함됩니다. 따라서 RLS가 실질적인 데이터 보호장치이며, 이 프로젝트는 로그인 사용자 본인의 행만 접근하도록 설정했습니다.

## 3. 내 컴퓨터에서 실행

Node.js 20 이상을 설치한 뒤 프로젝트 폴더에서 실행합니다.

```bash
npm install
npm run dev
```

화면에 표시된 주소(보통 `http://localhost:5173`)를 브라우저에서 엽니다.

## 4. 정상 작동 확인

1. 새 이메일과 비밀번호로 회원가입 후 로그인합니다.
2. 업무명, 설명, 중요도, 긴급도, 마감일, 예상시간을 입력하고 추가합니다.
3. 우선순위 배지가 자동으로 표시되는지 확인합니다.
4. 오늘 날짜 업무에 **오늘 마감** 표시와 빨간색 선이 나타나는지 확인합니다.
5. 수정, 완료 체크, 삭제를 각각 시험합니다.
6. 브라우저를 새로고침해도 업무가 유지되는지 확인합니다.
7. Supabase **Table Editor → tasks**에서도 데이터가 보이는지 확인합니다.

## 5. GitHub 저장소에 올리기

1. [GitHub](https://github.com/new)에서 새 저장소를 만듭니다. README나 `.gitignore`는 추가하지 않습니다.
2. 이 폴더에서 다음 명령을 실행합니다.

```bash
git init
git add .
git commit -m "일일 업무 보고앱 완성"
git branch -M main
git remote add origin https://github.com/내아이디/저장소이름.git
git push -u origin main
```

`.env`는 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다.

## 6. Vercel Hobby로 배포

1. [Vercel](https://vercel.com)에 GitHub 계정으로 로그인합니다.
2. **Add New → Project → Import Git Repository**에서 방금 만든 저장소를 선택합니다.
3. Framework Preset이 **Vite**, Build Command가 `npm run build`, Output Directory가 `dist`인지 확인합니다.
4. **Environment Variables**에 다음 두 값을 추가합니다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. 각 변수의 적용 대상은 Production, Preview, Development를 모두 체크합니다.
6. **Deploy**를 누르고 배포 완료 후 표시되는 `https://...vercel.app` 주소를 엽니다.
7. 환경변수를 나중에 수정했다면 **Deployments → 최신 배포 → Redeploy**가 필요합니다.

## 보안 점검

- 브라우저에는 Publishable key만 사용합니다.
- Secret key 및 `service_role` 키를 넣지 않습니다.
- `tasks` 테이블은 RLS가 켜져 있고, SELECT/INSERT/UPDATE/DELETE 모두 `auth.uid() = user_id` 조건을 적용합니다.
- `anon` 역할은 테이블 권한이 없고, 로그인한 `authenticated` 역할만 필요한 CRUD 권한을 가집니다.

## 명령어

```bash
npm run test   # 우선순위·완료율·오늘 마감 계산 테스트
npm run build  # Vercel 배포용 운영 빌드
npm run preview
```
