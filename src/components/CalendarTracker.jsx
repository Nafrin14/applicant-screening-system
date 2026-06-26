import React from "react";

export default function CalendarTracker({ markedDates }) {
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="rounded-3xl bg-white/8 border border-emerald-400/20 backdrop-blur-xl p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-5">
        CSV Upload Tracker
        <span className="text-white/50 text-sm ml-2">(June 2026)</span>
      </h3>

      <div className="grid grid-cols-7 gap-3 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-sm font-bold text-emerald-300/80"
          >
            {day}
          </div>
        ))}

        {daysInMonth.map((day) => {
          const paddedDay = day < 10 ? `0${day}` : day;
          const currentString = `2026-06-${paddedDay}`;
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