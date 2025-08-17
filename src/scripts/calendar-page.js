// src/scripts/calendar-page.js
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

// BaseLayout의 <meta id="auth-config">에서 관리자 이메일 읽기
const OWNER = document.getElementById('auth-config')?.dataset.owner || "";

// 토큰 헬퍼
function getAccessToken() {
  const t = localStorage.getItem("access_token");
  const exp = Number(localStorage.getItem("token_exp") || 0);
  return (t && exp > Date.now()) ? t : null;
}

async function fetchMe(token) {
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return {};
    return r.json();
  } catch { return {}; }
}

async function createEvent(token) {
  const start = new Date(Date.now() + 60*60*1000).toISOString();
  const end   = new Date(Date.now() + 2*60*60*1000).toISOString();
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: "테스트 이벤트",
      start: { dateTime: start, timeZone: "Asia/Seoul" },
      end:   { dateTime: end,   timeZone: "Asia/Seoul" },
    })
  });
  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    alert("생성 실패:\n" + t);
    return false;
  }
  return true;
}

async function main() {
  const token = getAccessToken();

  // 로그인 상태라면 공개 임베드 섹션 제거(CSP 경고 방지)
  if (token) document.getElementById('public-embed')?.remove();
  if (!token) return; // 비로그인: 공개 임베드만 표시

  const me = await fetchMe(token);

  // FullCalendar 인스턴스 생성
  const el = document.getElementById('calendar');
  if (!el) return;

  const calendar = new Calendar(el, {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    locale: 'ko',
    height: 'auto',
    firstDay: 0,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    events: async (info, success, failure) => {
      try {
        const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
        url.searchParams.set("singleEvents", "true");
        url.searchParams.set("orderBy", "startTime");
        url.searchParams.set("timeMin", new Date(info.start).toISOString());
        url.searchParams.set("timeMax", new Date(info.end).toISOString());

        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          const txt = await res.text().catch(()=> "");
          console.error("Calendar API error:", res.status, txt);
          failure(new Error(txt || "Calendar API error"));
          return;
        }
        const { items = [] } = await res.json();
        const evts = items.map(e => ({
          id: e.id,
          title: e.summary || "(제목 없음)",
          start: e.start?.dateTime || e.start?.date,
          end:   e.end?.dateTime   || e.end?.date,
          allDay: !!e.start?.date
        }));
        success(evts);
      } catch (err) {
        failure(err);
      }
    }
  });

  calendar.render();

  // 관리자만 쓰기 버튼 노출
  if (me?.email === OWNER) {
    const ownerActions = document.getElementById('owner-actions');
    ownerActions && (ownerActions.style.display = "flex");
    document.getElementById('btnCreate')?.addEventListener('click', async () => {
      const ok = await createEvent(token);
      if (ok) {
        alert("이벤트 생성 완료!");
        calendar.refetchEvents();
      }
    });
  }
}

main();
