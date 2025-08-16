export const SITE = {
  title: "KJK — Notes & Reviews",
  description: "논문 리뷰와 개발 노트를 정리하는 개인 웹사이트",
  lang: "ko",
  author: "kjk1208",
  baseUrl: "https://kjk1208.github.io"
};

// giscus configuration (fill after creating giscus discussion category)
export const GISCUS = {
  repo: "kjk1208/kjk1208.github.io",   // e.g. "owner/repo"
  repoId: "R_kgDOPe6wFA",                          // from giscus.app
  category: "General",                 // or the category you create
  categoryId: "DIC_kwDOPe6wFM4CuPn-",                      // from giscus.app
  mapping: "pathname"                  // "pathname" is convenient for SSG
};

// Google Calendar (public) embed configuration
export const CALENDAR = {
  id: "d1b5tgvi6bmre0pnrs6950cehs@group.calendar.google.com",
  timezone: "Asia/Seoul"
};
