
import React, { useState, useMemo } from 'react';
import { CalendarEvent, CalendarViewMode, Poll } from '../types';

interface CalendarViewProps {
  theme: 'light' | 'dark';
  polls: Poll[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ theme, polls }) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const allEvents: CalendarEvent[] = useMemo(() => {
    const pollEvents: CalendarEvent[] = polls.filter(p => p.target_date).map(p => ({
      id: `poll-${p.id}`,
      title: `ABSTIMMUNG: ${p.question}`,
      description: `Dies ist eine aktive Umfrage im Verein. ${p.is_multiple_choice ? 'Mehrfachauswahl möglich.' : 'Einzelwahl.'}`,
      date: p.target_date!,
      type: 'poll',
      status: 'red',
      author: p.author_name || 'Vorstand',
      linkedPollId: p.id
    }));

    const mockEvents: CalendarEvent[] = [
      { id: 'm1', title: 'Fixtermin: Vorstandssitzung', description: 'Reguläre Sitzung im Clubheim.', date: new Date().toISOString(), type: 'event', status: 'orange', author: 'Rainer' },
      { id: 'm2', title: 'Arbeitseinsatz: Platzpflege', description: 'Bitte Werkzeug mitbringen.', date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), type: 'task', status: 'green', author: 'Platzwart' },
    ];

    return [...pollEvents, ...mockEvents];
  }, [polls]);

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const getEventsForDay = (date: Date) => 
    allEvents.filter(e => isSameDay(new Date(e.date), date));

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderMonthGrid = (year: number, month: number, isMini = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }

    return (
      <div className={`grid grid-cols-7 ${isMini ? 'gap-0.5' : 'gap-3 sm:gap-4'}`}>
        {!isMini && dayNames.map(d => (
          <div key={d} className="text-[10px] font-black text-center text-slate-400 dark:text-white/30 uppercase tracking-widest mb-4">{d}</div>
        ))}
        {days.map((d, idx) => {
          const dayEvents = getEventsForDay(d.date);
          const hasEvents = dayEvents.length > 0;
          const isToday = isSameDay(new Date(), d.date);

          return (
            <div 
              key={idx} 
              onClick={() => { setSelectedDay(d.date); setViewMode('day'); }}
              className={`
                group relative flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-500
                ${isMini ? 'h-8 text-[9px]' : 'h-16 sm:h-28'}
                ${d.current ? (theme === 'dark' ? 'bg-white/5 hover:bg-[#B5A47A]/30' : 'bg-white hover:bg-[#B5A47A]/15 shadow-sm border border-slate-100') : 'opacity-20'}
                ${isToday && d.current ? 'ring-2 ring-[#B5A47A] z-10' : ''}
              `}
            >
              <span className={`font-black ${isMini ? 'text-[10px]' : 'text-sm sm:text-xl'} ${isToday && d.current ? 'text-[#B5A47A]' : 'text-slate-900 dark:text-white'}`}>{d.day}</span>
              {hasEvents && (
                <div className={`flex gap-1 ${isMini ? 'mt-0.5' : 'mt-2'}`}>
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id} className={`${isMini ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full ${e.status === 'red' ? 'bg-red-500' : e.status === 'orange' ? 'bg-orange-500' : 'bg-green-500'}`} />
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
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header mit scharfem Kontrast */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-20">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#B5A47A]/20 rounded-full mb-4">
            <span className="w-2 h-2 bg-[#B5A47A] rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B5A47A]">Interaktiver Planer</span>
          </div>
          <h2 className="text-6xl sm:text-8xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
            {viewMode === 'year' ? currentDate.getFullYear() : monthNames[currentDate.getMonth()]}
          </h2>
          <p className="text-2xl font-black text-[#B5A47A] tracking-[0.5em] uppercase mt-2">{viewMode === 'year' ? 'Vereinsjahr' : currentDate.getFullYear()}</p>
        </div>

        <div className="flex bg-slate-200 dark:bg-white/10 p-2 rounded-3xl">
          {(['month', 'year'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                viewMode === mode ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-xl' : 'text-slate-500 dark:text-white/40 hover:text-slate-900'
              }`}
            >
              {mode === 'month' ? 'Monatsansicht' : 'Jahresansicht'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="bg-white dark:bg-[#1E1E1E] p-8 sm:p-16 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-16">
            <button onClick={() => changeMonth(-1)} className="p-5 bg-slate-100 dark:bg-white/5 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-3xl font-black uppercase text-slate-900 dark:text-white">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => changeMonth(1)} className="p-5 bg-slate-100 dark:bg-white/5 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {renderMonthGrid(currentDate.getFullYear(), currentDate.getMonth())}
        </div>
      )}

      {viewMode === 'year' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {monthNames.map((name, idx) => (
            <div key={name} onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), idx, 1)); setViewMode('month'); }} className="bg-white dark:bg-[#1E1E1E] p-10 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl hover:border-[#B5A47A] transition-all cursor-pointer group">
              <h4 className="text-xl font-black uppercase text-slate-900 dark:text-white mb-8 group-hover:text-[#B5A47A]">{name}</h4>
              {renderMonthGrid(currentDate.getFullYear(), idx, true)}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'day' && selectedDay && (
        <div className="flex flex-col gap-12 animate-in slide-in-from-right-12 duration-700">
           <button onClick={() => setViewMode('month')} className="bg-[#B5A47A] text-[#1A1A1A] w-fit px-10 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-4 shadow-xl">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" /></svg>
             Zurück zum Kalender
           </button>
           <div className="bg-white dark:bg-[#1E1E1E] rounded-[4rem] border border-slate-200 dark:border-white/5 shadow-3xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
              <div className="lg:w-2/5 bg-slate-900 p-20 flex flex-col justify-center items-center text-center">
                 <span className="text-sm font-black uppercase text-[#B5A47A] tracking-[0.5em] mb-4">Ereignis-Fokus</span>
                 <span className="text-[14rem] font-black text-white leading-none tracking-tighter">{selectedDay.getDate()}</span>
                 <span className="text-3xl font-black text-white uppercase tracking-widest">{monthNames[selectedDay.getMonth()]}</span>
              </div>
              <div className="flex-grow p-12 sm:p-20 space-y-16">
                 {getEventsForDay(selectedDay).length === 0 ? (
                   <p className="text-4xl font-black text-slate-200 uppercase tracking-widest text-center py-20">Keine Einträge</p>
                 ) : (
                   <div className="space-y-20">
                      {getEventsForDay(selectedDay).map(event => (
                        <div key={event.id} className="space-y-6 animate-in fade-in duration-1000">
                           <div className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest w-fit text-white ${event.status === 'red' ? 'bg-red-500' : 'bg-[#B5A47A]'}`}>
                             {event.type}
                           </div>
                           <h4 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">{event.title}</h4>
                           <p className="text-xl sm:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">{event.description}</p>
                           {event.linkedPollId && (
                             <button className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-12 py-6 rounded-2xl font-black text-xs uppercase tracking-widest mt-10 hover:bg-[#B5A47A] transition-all">
                               Direkt zur Abstimmung
                             </button>
                           )}
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
