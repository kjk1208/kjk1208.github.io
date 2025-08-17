# To do list

[x] 달력 주인장만 보이게 설정. 내 구글 아이디 연결해주었음
[ ] 달력에서 시간대 선택은 못해결함
[ ] 전체적으로 디자인이 안이쁜데 이를 해결할 방법을 고민해야함
[ ] 갤러리 탭을 만들어서 사진을 업로드 왕창 하고 싶음
[ ] 게시판 탭이 버그가 있는데 해결 안했음
[ ] 뽀모도로 디자인, 구성 등 완료해야함







# KJK Astro Starter

본 템플릿은 다음을 지원합니다.

- MD/MDX 기반 문서
- 수식(KaTeX), 다이어그램(Mermaid)
- 코드 하이라이트 + 복사 버튼 (astro-expressive-code)
- giscus 댓글 (GitHub Discussions)
- Pagefind 정적 검색
- Google Calendar 임베드 (공개 캘린더)
- RSS 피드

## 사용법

1) 의존성 설치
```
npm i
```

2) 개발 서버
```
npm run dev
```

3) 빌드
```
npm run build
```

4) 설정
- `src/site.config.ts`에서 사이트 타이틀/설명과 giscus, CALENDAR 설정을 변경하세요.
- giscus는 https://giscus.app 에서 repoId/categoryId를 발급받아 입력하세요.
- Google Calendar는 읽기 전용 공개 달력을 만들어 공개한 뒤, 캘린더 ID를 입력하세요.
  - (예: `abcdefg@group.calendar.google.com`)

## 콘텐츠 작성
- 논문 리뷰: `src/content/reviews/*.mdx`
- 개발 노트: `src/content/dev/*.mdx`

프론트매터 예시:
```yaml
---
title: "제목"
date: "2025-08-16"
tags: ["tag1", "tag2"]
summary: "요약"
draft: false
---
```

수식 예시:
```
$$
E=mc^2
$$
```

Mermaid 예시:
```mdx
<Mermaid code={`
graph TD
  A --> B
`}/>
```

## GitHub Pages 배포 (Actions)
`.github/workflows/deploy.yml`가 포함되어 있습니다.
- `main` 브랜치에 push 시 자동 빌드/배포됩니다.
- 빌드 후 Pagefind로 검색 인덱스를 만듭니다.
