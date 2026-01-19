# Hey, Mark!

AI 기반 개발 워크플로우를 위한 마크다운 중심의 개인 아카이브 시스템

> heymark의 설계 목적과 해결 과제에 대한 자세한 내용은 [ABOUT.md](./ABOUT.md)를 참고하세요.

## Members

<table>
  <tr>
    <th align="center">Developer</th>
    <th align="center">Developer</th>
  </tr>
  <tr>
    <td align="center">이예나</td>
    <td align="center">김예영</td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://github.com/i2na">
        <img src="https://avatars.githubusercontent.com/u/147997324?v=4" alt="yena-lee" width="100" height="100">
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/yezzero">
        <img src="https://avatars.githubusercontent.com/u/156979966?v=4" alt="yeyoung-kim" width="100" height="100">
      </a>
    </td>
  </tr>
</table>

## Setup

### 1. Installation

#### 공통

```bash
# 1. GitHub에서 heymark 저장소 Fork
# https://github.com/i2na/heymark 페이지에서 "Fork" 버튼 클릭

# 2. Fork한 저장소 클론
git clone https://github.com/your/heymark.git
cd heymark

# 3. 의존성 설치
yarn install
```

#### 커스터마이징 설정

Fork한 프로젝트에서 `client/public/custom/` 폴더의 파일들을 커스터마이징한 후에도, heymark의 변경사항을 받아올 때 충돌 없이 Fork한 프로젝트의 커스터마이징이 유지되도록 하기 위해 다음 설정이 필요합니다:

```bash
git config merge.ours.driver true
```

### 2. Private Repository Setup

먼저 마크다운 게시물 파일들을 저장할 private repository를 생성합니다:

```bash
# 1. GitHub에서 Private Repo 생성
예: posts-archive

# 2. Personal Access Token 생성
# GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# Scopes: repo
# 토큰을 복사해서 안전하게 보관 (환경변수 POSTS_GITHUB_TOKEN로 사용)

# 3. 로컬에 Clone
```

### 3. CLI Setup

```bash
# 프로젝트 루트에서 실행

# 초기 설정
yarn setup

# CLI 전역 등록
yarn link

# 설치 확인
# 설정 시 입력한 CLI 명령어 이름으로 실행 (예: heymark call)
<cli-command-name> call
```

설정 파일이 `~/.${packageName}.json` 형식으로 생성됩니다 (예: `~/.heymark-cli.json`):

-   `packageName`은 `yarn setup` 실행 시 `{cliName}-cli` 형식으로 자동 설정됩니다

```json
{
    "cliName": "heymark", // CLI 명령어 이름
    "postsGitRemote": "https://github.com/your/posts-archive.git", // 마크다운 게시물을 저장할 private repository의 Git URL
    "postsRepoPath": "/Users/your/posts-archive" // 해당 repository를 로컬에 clone한 절대 경로
}
```

**CLI 설정 제거**

CLI를 더 이상 사용하지 않을 경우:

```bash
# 1. 프로젝트 디렉토리에서 전역 링크 해제
cd /path/to/project
yarn unlink

# 2. 설정 파일 삭제 (선택사항)
# 설정 파일 경로는 ~/.${packageName}.json 형식입니다
rm ~/.heymark-cli.json  # 예시
```

**🔧 Troubleshooting**

**1. Mac: 권한 오류**

```bash
chmod +x cli/index.js
```

**2. Windows: CLI 명령어 인식 안 됨**

PowerShell에서 실행 후 재시작:

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$(yarn global bin)", "User")
```

**3. Windows: yarn start 실행 시 MODULE_NOT_FOUND 오류 (한국어 경로)**

Ex) `Error: Cannot find module 'C:\Users\源?덉쁺\AppData\Roaming\npm\node_modules\yarn\bin\yarn.js'`

위 예시처럼 에러로그에 알수없는 문자(`源?덉쁺`)가 포함되어 있다면,
사용자 이름이 한국어이거나 경로에 한국어가 포함되는 경우 발생하는 오류입니다.

1. Corepack 저장소 경로 변경

    1-1. C드라이브 바로 아래의 corepack 폴더 생성(경로: `C:\corepack`)

    1-2. 관리자 권한으로 cmd 실행하여 `setx /M COREPACK_HOME "C:\corepack"` 입력

    1-3. 설정 적용을 위해 터미널 완전히 종료

2. Corepack 활성화
   관리자 권한으로 cmd 실행하여 `corepack enable` 입력

3. 프로젝트 경로 확인 및 설정
   프로젝트 폴더가 한글이 없는 경로(예: C:\Blog\heymark)에 있어야 합니다. 프로젝트 폴더로 이동하여 다음을 실행합니다.

```bash
# 프로젝트 루트 폴더에서 실행 (예: C:\Blog\heymark)

# 1. 프로젝트에 맞는 Yarn 버전 고정 및 다운로드 (자동으로 C:\corepack에 저장됨)
corepack use yarn@1.22.22

# 2. 의존성 패키지 설치
yarn install

# 3. 서버 실행
yarn start
```

4. 조치 후에 CLI 명령어 호출 시 오류가 생긴다면, `yarn unlink` 후 다시 `yarn link` 실행

**💡 Usage**

**CLI Commands**

설정 시 입력한 CLI 명령어 이름으로 실행합니다 (예: `heymark`):

```bash
# 문서 작성용 프롬프트를 클립보드에 복사
<cli-command-name> call

# 문서를 heymark에 추가 (filepath는 문서의 절대 경로)
<cli-command-name> add <filepath>              # 원본 파일 유지
<cli-command-name> add <filepath> --delete     # 원본 파일 삭제
<cli-command-name> add <filepath> -d           # 원본 파일 삭제 (단축)

# posts-archive를 Cursor로 열기
<cli-command-name> open
```

**Default Values**

`<cli-command-name> add` CLI로 추가할 때 기본값:

-   `visibility: private`
-   `createdAt: 현재시간`

### 4. Web Development Setup

```bash
# 프로젝트 루트에서 실행

# 1. Vercel 로그인
npx vercel login

# 2. 새 프로젝트 생성 및 연결
npx vercel
# 프롬프트에서:
# - Set up and deploy? → yes
# - Which scope? → 계정 선택
# - Link to existing project? → no (새 프로젝트)
# - What's your project's name? → heymark-dev (또는 원하는 이름)
# - In which directory is your code located? → ./
# - Want to modify these settings? → no

# 또는 이미 Vercel 대시보드에서 프로젝트를 생성한 경우
npx vercel link --project <project_name>

# 3. 개발 서버 실행 (Frontend + Backend 동시 실행)
yarn start
# → Frontend: http://localhost:5174
# → Backend: http://localhost:3000 (Vercel Dev)
```

**About Vercel Dev**

이 프로젝트는 Vercel 플랫폼에 배포되며, `/api` 폴더의 파일들이 자동으로 서버리스 함수로 변환됩니다. 로컬 개발 환경에서도 프로덕션과 동일한 서버리스 아키텍처를 재현하기 위해 Vercel Dev CLI를 사용합니다.

### 5. Google OAuth Setup

[Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 클라이언트 ID를 생성합니다:

1. **Google Auth Platform > Get started** 클릭
2. **App Information** 작성
3. **Audience**: External 선택
4. **Application type**: Web application 선택
5. **승인된 JavaScript 원본**에 추가:
    - `http://localhost:5174` (로컬 개발용)
    - `https://your-heymark-url.com` (배포용)
6. **승인된 리디렉션 URI**에 추가:

    - `http://localhost:5174/api/auth/google` (로컬 개발용)
    - `https://your-heymark-url.com/api/auth/google` (배포용)

### 6. Environment Variables

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수들을 설정합니다:

```bash
# 배포 URL (로컬 개발: http://localhost:5174, 배포: https://your-heymark-url.com)
VITE_BASE_URL=http://localhost:5174

# Google OAuth 설정
VITE_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Private Repository 접근
POSTS_REPO_OWNER=your-github-username
POSTS_REPO_NAME=your-posts-archive-repo-name
POSTS_GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```
