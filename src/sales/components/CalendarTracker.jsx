import React from "react";

export default function CalendarTracker({ markedDates }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const monthLabel = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const leadingBlanks = Array.from(
    { length: firstWeekday },
    (_, i) => `blank-${i}`
  );

  return (
    <div className="rounded-3xl bg-[#022C22] border border-[#064E3B] p-6 shadow-xl">
      <div className="rounded-3xl bg-[#033327] border border-[#064E3B] p-6">
        <h3 className="text-xl font-bold text-white mb-7">
          CSV Upload Tracker
          <span className="text-emerald-300 text-sm ml-2">
            ({monthLabel})
          </span>
        </h3>

        <div className="grid grid-cols-7 gap-3 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-sm font-bold text-[#6EE7B7]"
            >
              {day}
            </div>
          ))}

          {leadingBlanks.map((key) => (
            <div key={key}></div>
          ))}

          {dayCells.map((day) => {
            const paddedDay = String(day).padStart(2, "0");
            const paddedMonth = String(month + 1).padStart(2, "0");

            const currentString = `${year}-${paddedMonth}-${paddedDay}`;

            const isMarked = markedDates.includes(currentString);

            return (
              <div
                key={day}
                className={`rounded-2xl py-3 text-sm font-bold transition duration-200 ${
                  isMarked
                    ? "bg-[#10B981] text-white shadow-md"
                    : "bg-white text-slate-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}