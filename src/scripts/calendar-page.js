// src/scripts/calendar-page.js
export function initCalendar(el) {
  const calendar = new FullCalendar.Calendar(el, {
    plugins: [ FullCalendarDayGrid ],
    initialView: 'dayGridMonth',
    locale: 'ko',
    firstDay: 0,
    height: 'auto',
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' }
  });
  calendar.render();
}