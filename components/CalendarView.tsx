
import React, { useState, useMemo } from 'react';
import { CalendarEvent, CalendarViewMode, Poll } from '../types';

interface CalendarViewProps { theme: 'light' | 'dark'; polls: Poll[]; }

const CalendarView: React.FC<CalendarViewProps> = ({ theme, polls }) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const allEvents: CalendarEvent[] = useMemo(() => {
    const pollEvents: CalendarEvent[] = polls.filter(p => p.target_date).map(p => ({
      id: `poll-${p.id}`,
      title: p.question,
      description: `Vereinsumfrage aktiv.`,
      date: p.target_date!,
      type: 'poll',
      status: 'red',
      author: p.author_name || 'Vorstand',
      linkedPollId: p.id
    }));
    return [...pollEvents];
  }, [polls]);

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const getEventsForDay = (date: Date) => allEvents.filter(e => isSameDay(new Date(e.date), date));

  const renderMonthGrid = (year: number, month: number, isMini = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {!isMini && dayNames.map(d => <div key={d} className="text-[8px] sm:text-[10px] font-black text-center text-slate-400 uppercase tracking-widest mb-2">{d}</div>)}
        {days.map((d, idx) => {
          if (!d) return <div key={`empty-${idx}`} />;
          const dayEvents = getEventsForDay(d);
          const isToday = isSameDay(new Date(), d);
          return (
            <div 
              key={idx} 
              onClick={() => { setSelectedDay(d); setViewMode('day'); }}
              className={`h-12 sm:h-24 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50 border border-slate-100'} ${isToday ? 'ring-2 ring-[#B5A47A]' : ''}`}
            >
              <span className={`text-xs sm:text-xl font-black ${isToday ? 'text-[#B5A47A]' : 'text-inherit'}`}>{d.getDate()}</span>
              {dayEvents.length > 0 && <div className="flex gap-0.5 mt-1 sm:mt-2"><div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#B5A47A]" /></div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 sm:mb-20">
        <div className="text-center sm:text-left">
          <h2 className="text-4xl sm:text-7xl font-black uppercase tracking-tighter leading-none">{monthNames[currentDate.getMonth()]}</h2>
          <p className="text-lg sm:text-2xl font-black text-[#B5A47A] tracking-widest">{currentDate.getFullYear()}</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
          <button onClick={() => setViewMode('month')} className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewMode === 'month' ? 'bg-[#B5A47A] text-black' : 'text-slate-400'}`}>Monat</button>
          <button onClick={() => setViewMode('year')} className={`flex-1 sm:flex-none px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewMode === 'year' ? 'bg-[#B5A47A] text-black' : 'text-slate-400'}`}>Jahr</button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="bg-white dark:bg-[#1E1E1E] p-4 sm:p-12 rounded-3xl sm:rounded-[3rem] shadow-xl">
           <div className="flex justify-between items-center mb-10">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 bg-slate-100 dark:bg-white/5 rounded-lg text-[#B5A47A]">←</button>
              <span className="font-black text-sm sm:text-xl uppercase">{monthNames[currentDate.getMonth()]}</span>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 bg-slate-100 dark:bg-white/5 rounded-lg text-[#B5A47A]">→</button>
           </div>
           {renderMonthGrid(currentDate.getFullYear(), currentDate.getMonth())}
        </div>
      )}

      {viewMode === 'year' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {monthNames.map((name, idx) => (
            <div key={name} onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), idx, 1)); setViewMode('month'); }} className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl shadow-lg cursor-pointer hover:border-[#B5A47A] border-2 border-transparent">
              <h4 className="text-xs font-black uppercase mb-4 text-[#B5A47A]">{name}</h4>
              {renderMonthGrid(currentDate.getFullYear(), idx, true)}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'day' && selectedDay && (
        <div className="space-y-6">
           <button onClick={() => setViewMode('month')} className="text-[10px] font-black uppercase tracking-widest bg-black text-[#B5A47A] px-8 py-4 rounded-xl">Zurück</button>
           <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-slate-900 p-10 flex flex-col items-center justify-center text-white">
                 <span className="text-[8rem] font-black leading-none">{selectedDay.getDate()}</span>
                 <span className="text-xl font-black uppercase tracking-widest">{monthNames[selectedDay.getMonth()]}</span>
              </div>
              <div className="p-8 sm:p-16 space-y-12">
                 {getEventsForDay(selectedDay).length === 0 ? <p className="text-center font-black opacity-20 text-3xl uppercase">Keine Termine</p> : (
                   getEventsForDay(selectedDay).map(e => (
                     <div key={e.id} className="border-l-4 border-[#B5A47A] pl-6 space-y-2">
                        <span className="text-[10px] font-black text-[#B5A47A] uppercase">{e.type}</span>
                        <h4 className="text-3xl font-black leading-tight uppercase">{e.title}</h4>
                        <p className="text-slate-500 font-bold">{e.description}</p>
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
