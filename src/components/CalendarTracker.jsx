import React from 'react';

export default function CalendarTracker({ markedDates }) {
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>CSV Upload Tracker (June 2026)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ fontWeight: 'bold', fontSize: '13px', color: '#94a3b8' }}>{d}</div>
        ))}
        {daysInMonth.map(day => {
          const paddedDay = day < 10 ? `0${day}` : day;
          const currentString = `2026-06-${paddedDay}`;
          const isMarked = markedDates.includes(currentString);

          return (
            <div key={day} style={{
              padding: '12px 0', borderRadius: '6px', fontSize: '14px',
              background: isMarked ? '#4f46e5' : '#f8fafc',
              color: isMarked ? '#fff' : '#334155',
              fontWeight: isMarked ? 'bold' : 'normal',
              boxShadow: isMarked ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
            }}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}