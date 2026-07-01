import React from "react";

export default function CalendarTracker({ markedDates }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => `blank-${i}`);

  return (
    <div className="rounded-3xl bg-white/8 border border-emerald-400/20 backdrop-blur-xl p-6 shadow-xl">
  const monthLabel = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => `blank-${i}`);

  return (
    <div className="rounded-3xl bg-white/8 border border-emerald-400/20 backdrop-blur-xl p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-5">
        CSV Upload Tracker
        <span className="text-white/50 text-sm ml-2">({monthLabel})</span>
      </h3>
      <h3 className="text-xl font-bold text-white mb-5">
        CSV Upload Tracker
        <span className="text-white/50 text-sm ml-2">({monthLabel})</span>
      </h3>
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> sarath's-works

      <div className="grid grid-cols-7 gap-3 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-sm font-bold text-emerald-300/80">
            {day}
          </div>
        ))}

        {dayCells.map((day) => {
          const paddedDay = day < 10 ? `0${day}` : day;
          const paddedMonth = month + 1 < 10 ? `0${month + 1}` : month + 1;
          const currentString = `${year}-${paddedMonth}-${paddedDay}`;
<<<<<<< HEAD
>>>>>>> Stashed changes
=======
>>>>>>> sarath's-works
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