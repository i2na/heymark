# Blog API 리팩토링 계획

## 🎯 목표
기존 Serverless Function 기반의 분산된 로직을 유지보수가 용이한 **Layered Architecture(3-Tier)**로 전환합니다.

**네이밍 규칙**: [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)를 따릅니다.

## 📊 1. 현재 구조 분석 (AS-IS)

현재 `heymark/api/` 폴더는 파일 시스템 기반 라우팅(File-system based routing)을 따르고 있어, 비즈니스 로직, HTTP 처리, 데이터 접근이 한 파일(`handler`)에 혼재되어 있습니다.

```
heymark/api/
├── auth/
│   └── google.ts         # Controller + Service (OAuth)
├── posts/
│   ├── delete.ts         # Controller + Service + Repository (삭제)
│   └── shared-with.ts    # Controller + Service (공유 설정)
├── utils/
│   ├── auth.ts           # Helper
│   ├── github.ts         # External API Wrapper
│   └── markdown.ts       # Helper
├── email-config.ts       # Controller + Service
└── posts.ts              # Controller + Service + Repository (목록 조회)
```

### ❌ 현재 구조의 문제점
- **관심사 분리 부족**: 하나의 파일에 HTTP 처리, 비즈니스 로직, 데이터 접근이 혼재
- **코드 중복**: `getAdminEmails()` 같은 함수가 여러 파일에 반복
- **테스트 어려움**: HTTP 객체와 비즈니스 로직이 결합
- **유지보수성 저하**: 변경 시 여러 파일을 동시에 수정해야 함

## 🏗️ 2. 목표 구조 (TO-BE)

**관심사의 분리(Separation of Concerns)** 원칙에 따라 아래와 같이 역할을 분리합니다.

```
api/src/
├── app.ts                  # App 설정 (Express/Hono 등)
├── controllers/            # [Presentation] HTTP 요청 파싱, 검증, 응답
├── services/               # [Business] 실제 로직, 트랜잭션 관리
├── repositories/           # [Persistence] DB/외부 저장소 데이터 접근
├── models/                 # [Domain] 데이터 타입 및 인터페이스 (DTO)
├── middlewares/            # [Cross-Cutting] 인증, 에러 핸들링, 로깅
└── utils/                  # [Shared] 공통 유틸리티
```

## 📋 3. 레이어별 정의

### 🎭 Controllers (`*.controller.ts`)
- **역할**: HTTP 요청(`req`)을 받고 응답(`res`)을 반환
- **규칙**: 비즈니스 로직을 포함하지 않음. `Service`를 호출하는 역할만 수행
- **예시**: 요청 파싱, 입력 검증, HTTP 응답 포맷팅

### 🧠 Services (`*.service.ts`)
- **역할**: 핵심 비즈니스 로직 수행 (권한 체크, 데이터 가공, 트랜잭션 관리)
- **규칙**: HTTP 객체(`req`, `res`)를 몰라야 함
- **예시**: 사용자 권한 검증, 데이터 변환, 비즈니스 규칙 적용

### 💾 Repositories (`*.repository.ts`)
- **역할**: 데이터베이스나 외부 저장소(GitHub 등)와 직접 통신
- **규칙**: SQL 쿼리나 API 호출은 여기에만 존재
- **예시**: GitHub API 호출, 데이터 CRUD 작업

### 📝 Models (`*.model.ts`)
- **역할**: 데이터 구조(Interface, Type, DTO) 정의
- **예시**: `Post`, `User`, `AuthToken` 타입 정의

## 🔄 4. 리팩토링 상세 매핑 가이드

AI는 기존 파일을 아래 규칙에 따라 분해하여 이동시킵니다.

### 🔐 A. Auth 관련 (`api/auth/google.ts`)
- **Controller**: `controllers/auth.controller.ts`
  - 로그인 요청 처리, 리다이렉트 처리
- **Service**: `services/auth.service.ts`
  - Google OAuth 토큰 발급 로직, 사용자 정보 조회 로직
- **Utils**: `utils/auth.ts` 유지 또는 `middlewares/auth.middleware.ts`로 변환

### 📄 B. Post 관련 (`api/posts.ts`, `api/posts/delete.ts`, `api/posts/shared-with.ts`)
- **Controller**: `controllers/post.controller.ts` (통합)
  - `getPosts` (기존 `posts.ts`)
  - `deletePost` (기존 `posts/delete.ts`)
  - `updateShareSettings` (기존 `posts/shared-with.ts`)
- **Service**: `services/post.service.ts`
  - 게시물 목록 필터링, 삭제 권한 확인, 공유 설정 로직
- **Repository**: `repositories/post.repository.ts`
  - 실제 DB/GitHub에서 데이터를 가져오거나 삭제하는 로직

### 🔗 C. GitHub 및 유틸리티 (`api/utils/github.ts`, `api/utils/markdown.ts`)
- **Service/Repository**: `services/github.service.ts`
  - 기존 `utils/github.ts`의 로직은 단순 유틸리티보다 **외부 서비스 연동**에 가까우므로 Service 레이어로 격상
- **Utils**: `utils/markdown.ts`
  - 순수 함수이므로 `utils/`에 유지

### ⚙️ D. Email 관련 (`api/email-config.ts`)
- **Controller**: `controllers/config.controller.ts`
- **Service**: `services/config.service.ts`

## 📝 5. 단계별 실행 계획 (AI 지시용)

1. **Models 정의**: 기존 코드에서 사용되는 데이터 타입(User, Post 등)을 `models/`로 추출
2. **Repositories 생성**: `utils/github.ts` 및 각 핸들러에 흩어진 데이터 패칭 로직을 `repositories/`로 이동
3. **Services 생성**: 비즈니스 로직(검증, 계산, 흐름 제어)을 `services/`로 이동하고 Repository를 주입받도록 작성
4. **Controllers 생성**: `req/res`를 처리하는 부분을 `controllers/`로 이동하고 Service를 호출하도록 작성
5. **Routes 연결**: (Express 등을 사용할 경우) `routes/` 파일을 생성하여 URL과 Controller를 연결

## ⚠️ 6. 주의사항

- **환경 변수**: `process.env` 접근은 `config/index.ts` 등을 통해 중앙에서 관리
- **에러 처리**: `try-catch`를 Controller에 중복해서 쓰지 않고, `middlewares/error.middleware.ts`를 통해 전역적으로 처리하는 패턴 도입
- **의존성 주입**: 각 레이어 간의 결합도를 낮추기 위해 DI(Dependency Injection) 패턴 적용 고려