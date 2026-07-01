import React, { useState } from "react";

export default function CalendarTracker({ markedDates = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1
  );

  const goPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="rounded-3xl bg-white/8 border border-emerald-400/20 backdrop-blur-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-white">
          CSV Upload Tracker
          <span className="text-white/50 text-sm ml-2">
            ({monthLabel})
          </span>
        </h3>

        <div className="flex gap-2">
          <button
            onClick={goPrevMonth}
            className="px-3 py-1 rounded-lg bg-black/30 text-white"
          >
            ◀
          </button>

          <button
            onClick={goNextMonth}
            className="px-3 py-1 rounded-lg bg-black/30 text-white"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-sm font-bold text-emerald-300/80">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {days.map((day) => {
          const currentString = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
          const isMarked = markedDates.includes(currentString);

          return (
            <div
              key={day}
              className={`rounded-xl py-3 text-sm font-bold transition ${
                isMarked
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-black/25 text-white/70 border border-white/10"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}