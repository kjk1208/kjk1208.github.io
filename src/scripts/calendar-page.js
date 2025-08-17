// src/scripts/calendar-page.js
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";

export function initCalendar(el) {
  const calendar = new Calendar(el, {
    plugins: [dayGridPlugin],
    initialView: "dayGridMonth",
    locale: "ko",
    firstDay: 0,
    height: "auto",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: ""
    }
  });
  calendar.render();
  return calendar;
}