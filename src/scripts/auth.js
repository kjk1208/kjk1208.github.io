// src/scripts/auth.js
import { AUTH } from "../site.config";

// html[data-auth="signed-in"|"signed-out"] 로 상태 반영
function setAuthState(signedIn, email = "") {
  document.documentElement.dataset.auth = signedIn ? "signed-in" : "signed-out";
  if (signedIn) {
    localStorage.setItem("user_email", email);
  } else {
    localStorage.removeItem("user_email");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_exp");
  }
}

// 유효한 access token 반환(없거나 만료면 null)
export function getAccessToken() {
  const t = localStorage.getItem("access_token");
  const exp = Number(localStorage.getItem("token_exp") || 0);
  if (!t || exp <= Date.now()) return null;
  return t;
}

// 초기 상태 세팅(새로고침/재방문)
export function bootAuth() {
  // GIS SDK 주입
  const s = document.createElement("script");
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  document.head.appendChild(s);

  // 저장된 토큰 유효하면 signed-in, 아니면 signed-out
  const tokenExp = Number(localStorage.getItem("token_exp") || 0);
  setAuthState(tokenExp > Date.now(), localStorage.getItem("user_email") || "");
}

// 로그인 요청 (팝업으로 토큰 받기)
export async function signIn() {
  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    alert("Google SDK 로딩 중입니다. 잠시 후 다시 시도하세요.");
    return;
  }
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: AUTH.googleClientId,
    scope: "openid email profile https://www.googleapis.com/auth/calendar",
    prompt: "consent", // 최초 한 번 동의
    callback: async (resp) => {
      if (resp.error) {
        alert("로그인 실패: " + resp.error);
        return;
      }
      const accessToken = resp.access_token;
      const expiresIn = resp.expires_in;

      // 사용자 이메일 조회
      const me = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json()).catch(() => ({}));

      const email = me.email || "";
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("token_exp", String(Date.now() + expiresIn * 1000));
      setAuthState(true, email);

      // 내 계정이 아닐 때 안내(선택)
      if (email !== AUTH.ownerEmail) {
        console.info("[Auth] 로그인됨(비소유자):", email);
      }
    },
  });
  tokenClient.requestAccessToken();
}

// 로그아웃
export function signOut() {
  setAuthState(false);
}
