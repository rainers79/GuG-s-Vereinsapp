
import React, { useState, useMemo } from 'react';
// Fixed error: Removed 'theme' from imports as it is not exported from types.ts and is used as a prop instead.
import { CalendarEvent, CalendarViewMode } from '../types';

interface CalendarViewProps {
  theme: 'light' | 'dark';
}

const CalendarView: React.FC<CalendarViewProps> = ({ theme }) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Mock Events für die Visualisierung
  const events: CalendarEvent[] = useMemo(() => [
    { id: '1', title: 'Vorstandssitzung', description: 'Besprechung der neuen Satzung und Planung des Sommerfests.', date: new Date().toISOString(), type: 'event', status: 'orange', author: 'Admin' },
    { id: '2', title: 'Abstimmung: Logo', description: 'Finale Wahl des neuen Vereinslogos.', date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), type: 'poll', status: 'red', author: 'Vorstand' },
    { id: '3', title: 'Mitgliederliste Update', description: 'Alle Profile müssen bis Ende der Woche vervollständigt sein.', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), type: 'task', status: 'green', author: 'System' },
  ], []);

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust to Monday start
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const getEventsForDay = (date: Date) => 
    events.filter(e => isSameDay(new Date(e.date), date));

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const renderMonth = (year: number, month: number, isMini = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const days = [];

    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }

    return (
      <div className={`grid grid-cols-7 ${isMini ? 'gap-0.5' : 'gap-2'}`}>
        {!isMini && dayNames.map(d => (
          <div key={d} className="text-[10px] font-black text-center opacity-30 uppercase tracking-widest mb-2">{d}</div>
        ))}
        {days.map((d, idx) => {
          const dayEvents = getEventsForDay(d.date);
          const hasEvents = dayEvents.length > 0;
          const isToday = isSameDay(new Date(), d.date);

          return (
            <div 
              key={idx} 
              onClick={() => {
                setSelectedDay(d.date);
                setViewMode('day');
              }}
              className={`
                relative flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-300
                ${isMini ? 'h-8 text-[10px]' : 'h-14 sm:h-20'}
                ${d.current ? (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50') : 'opacity-20'}
                ${isToday && d.current ? 'border-2 border-[#B5A47A]' : ''}
              `}
            >
              <span className={`font-bold ${isToday && d.current ? 'text-[#B5A47A]' : ''}`}>{d.day}</span>
              {hasEvents && (
                <div className="flex gap-1 mt-1">
                  {dayEvents.map(e => (
                    <div 
                      key={e.id} 
                      className={`w-1.5 h-1.5 rounded-full ${
                        e.status === 'red' ? 'bg-red-500' : 
                        e.status === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                      }`} 
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">
            {viewMode === 'year' ? currentDate.getFullYear() : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>
          <div className="h-1.5 w-16 bg-[#B5A47A] mt-3 rounded-full"></div>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
          {(['month', 'year'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === mode ? 'bg-[#B5A47A] text-white shadow-lg shadow-[#B5A47A]/20' : 'text-slate-400 hover:text-inherit'
              }`}
            >
              {mode === 'month' ? 'Monat' : 'Jahr'}
            </button>
          ))}
        </div>
      </div>

      {/* View Rendering */}
      {viewMode === 'month' && (
        <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} p-6 sm:p-10 rounded-3xl border shadow-xl transition-colors duration-500`}>
          <div className="flex justify-between items-center mb-10">
            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-[#B5A47A]/10 text-[#B5A47A] rounded-xl transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-black uppercase tracking-[0.2em]">{monthNames[currentDate.getMonth()]}</span>
            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-[#B5A47A]/10 text-[#B5A47A] rounded-xl transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {renderMonth(currentDate.getFullYear(), currentDate.getMonth())}
        </div>
      )}

      {viewMode === 'year' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {monthNames.map((name, idx) => (
            <div 
              key={name} 
              onClick={() => {
                setCurrentDate(new Date(currentDate.getFullYear(), idx, 1));
                setViewMode('month');
              }}
              className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} p-6 rounded-3xl border shadow-sm hover:shadow-xl hover:border-[#B5A47A]/30 transition-all cursor-pointer group`}
            >
              <h4 className="text-xs font-black uppercase tracking-widest mb-4 group-hover:text-[#B5A47A] transition-colors">{name}</h4>
              {renderMonth(currentDate.getFullYear(), idx, true)}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'day' && selectedDay && (
        <div className="animate-in zoom-in-95 duration-500">
          <button 
            onClick={() => setViewMode('month')}
            className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" /></svg>
            Zurück zur Übersicht
          </button>
          
          <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-3xl border shadow-2xl overflow-hidden`}>
            <div className="p-8 sm:p-12 border-b border-slate-100 dark:border-white/5 bg-[#B5A47A]/5">
              <span className="text-[#B5A47A] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">
                {dayNames[selectedDay.getDay() === 0 ? 6 : selectedDay.getDay() - 1]}ansicht
              </span>
              <h3 className="text-5xl font-black tracking-tighter">
                {selectedDay.getDate()}. {monthNames[selectedDay.getMonth()]}
              </h3>
            </div>
            
            <div className="p-8 sm:p-12 space-y-10">
              {getEventsForDay(selectedDay).length === 0 ? (
                <div className="py-20 text-center opacity-30">
                  <p className="text-sm font-bold uppercase tracking-widest italic">Keine Einträge für diesen Tag vorhanden.</p>
                </div>
              ) : (
                getEventsForDay(selectedDay).map(event => (
                  <div key={event.id} className="flex flex-col sm:flex-row gap-8 items-start">
                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${
                      event.status === 'red' ? 'bg-red-500/10 text-red-500' : 
                      event.status === 'orange' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-2xl font-black uppercase tracking-tight">{event.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           event.status === 'red' ? 'bg-red-500 text-white' : 
                           event.status === 'orange' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {event.type}
                        </span>
                      </div>
                      <p className="opacity-60 text-lg leading-relaxed max-w-2xl">{event.description}</p>
                      <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#B5A47A]/20 rounded-full"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{event.author}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
