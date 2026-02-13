
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

  // Mische Mock-Events mit echten Umfragen für den Kalender
  const allEvents: CalendarEvent[] = useMemo(() => {
    const pollEvents: CalendarEvent[] = polls.map(p => ({
      id: `poll-${p.id}`,
      title: `Umfrage: ${p.question}`,
      description: `Wichtige Mitgliederabstimmung. ${p.is_multiple_choice ? 'Mehrfachauswahl möglich.' : 'Einzelwahl.'}`,
      date: p.created_at,
      type: 'poll',
      status: 'red',
      author: p.author_name || 'Vorstand'
    }));

    const mockEvents: CalendarEvent[] = [
      { id: 'm1', title: 'Vorstandssitzung', description: 'Besprechung der neuen Satzung.', date: new Date().toISOString(), type: 'event', status: 'orange', author: 'Rainer' },
      { id: 'm2', title: 'Platzpflege', description: 'Außenanlagen säubern.', date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), type: 'task', status: 'green', author: 'Platzwart' },
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
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
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
          <div key={d} className="text-[10px] font-black text-center opacity-40 uppercase tracking-widest mb-4">{d}</div>
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
                group relative flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-500
                ${isMini ? 'h-8 text-[9px]' : 'h-16 sm:h-28'}
                ${d.current ? (theme === 'dark' ? 'bg-white/5 hover:bg-[#B5A47A]/30' : 'bg-white hover:bg-[#B5A47A]/15 shadow-sm border border-slate-100') : 'opacity-20'}
                ${isToday && d.current ? 'ring-2 ring-[#B5A47A] z-10' : ''}
                ${!isMini ? 'hover:scale-110 hover:z-30 hover:shadow-2xl shadow-[#B5A47A]/20' : ''}
              `}
            >
              <span className={`font-black ${isMini ? 'text-[10px]' : 'text-sm sm:text-xl'} ${isToday && d.current ? 'text-[#B5A47A]' : ''}`}>{d.day}</span>
              
              {hasEvents && (
                <div className={`flex gap-1 ${isMini ? 'mt-0.5' : 'mt-2'}`}>
                  {dayEvents.slice(0, 3).map(e => (
                    <div 
                      key={e.id} 
                      className={`${isMini ? 'w-1 h-1' : 'w-2 h-2'} rounded-full shadow-sm ${
                        e.status === 'red' ? 'bg-red-500' : 
                        e.status === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                      }`} 
                    />
                  ))}
                </div>
              )}

              {!isMini && hasEvents && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-[#1A1A1A] text-white p-5 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] opacity-0 scale-90 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-50">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#B5A47A]">Tagesdetails</p>
                    <span className="text-[10px] opacity-60 font-bold">{d.date.toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="space-y-4">
                    {dayEvents.map(e => (
                      <div key={e.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          e.status === 'red' ? 'bg-red-500' : 
                          e.status === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold leading-tight line-clamp-2">{e.title}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] opacity-60 uppercase font-black tracking-widest">{e.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-20">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#B5A47A]/20 rounded-full mb-4">
            <span className="w-2 h-2 bg-[#B5A47A] rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B5A47A]">Live Kalender</span>
          </div>
          <h2 className="text-6xl sm:text-8xl font-black tracking-tighter uppercase leading-none">
            {viewMode === 'year' ? currentDate.getFullYear() : `${monthNames[currentDate.getMonth()]}`}
          </h2>
          <p className="text-2xl font-black mt-2 uppercase tracking-[0.5em] text-[#B5A47A] opacity-90">
            {viewMode === 'year' ? 'Jahresübersicht' : currentDate.getFullYear()}
          </p>
        </div>

        <div className="flex bg-slate-200 dark:bg-white/10 p-2 rounded-[2rem] shadow-inner backdrop-blur-md">
          {(['month', 'year'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-10 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                viewMode === mode 
                  ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-[0_10px_30px_rgba(181,164,122,0.3)]' 
                  : 'text-slate-500 dark:text-white/60 hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              {mode === 'month' ? 'Monat' : 'Jahr'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
          <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} p-8 sm:p-16 rounded-[3rem] border shadow-2xl transition-all duration-500`}>
            <div className="flex justify-between items-center mb-16">
              <button onClick={() => changeMonth(-1)} className="group p-5 bg-[#B5A47A]/10 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all duration-500 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-center group cursor-pointer" onClick={() => setViewMode('year')}>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B5A47A] block mb-2 group-hover:scale-110 transition-transform">Jahr wechseln</span>
                <span className="text-3xl font-black uppercase tracking-widest">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              </div>
              <button onClick={() => changeMonth(1)} className="group p-5 bg-[#B5A47A]/10 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all duration-500 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            {renderMonthGrid(currentDate.getFullYear(), currentDate.getMonth())}
          </div>
        </div>
      )}

      {viewMode === 'year' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-in slide-in-from-bottom-12 duration-1000">
          {monthNames.map((name, idx) => (
            <div 
              key={name} 
              onClick={() => {
                setCurrentDate(new Date(currentDate.getFullYear(), idx, 1));
                setViewMode('month');
              }}
              className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} p-10 rounded-[2.5rem] border shadow-xl hover:shadow-2xl hover:border-[#B5A47A] transition-all duration-500 cursor-pointer group`}
            >
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-lg font-black uppercase tracking-[0.2em] group-hover:text-[#B5A47A] transition-colors">{name}</h4>
                <div className="h-0.5 w-10 bg-[#B5A47A]/30 group-hover:w-full transition-all duration-500"></div>
              </div>
              {renderMonthGrid(currentDate.getFullYear(), idx, true)}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'day' && selectedDay && (
        <div className="animate-in slide-in-from-right-12 duration-700 min-h-[700px] flex flex-col">
          <button 
            onClick={() => setViewMode('month')}
            className="mb-12 w-fit flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.2em] px-8 py-4 bg-[#B5A47A] text-[#1A1A1A] rounded-2xl hover:bg-[#1A1A1A] hover:text-white transition-all shadow-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" /></svg>
            Zurück zur Monatsansicht
          </button>
          
          <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-[4rem] border shadow-3xl flex flex-col lg:flex-row overflow-hidden flex-grow`}>
            <div className="lg:w-2/5 bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] p-16 sm:p-24 flex flex-col justify-center items-center text-[#1A1A1A] text-center relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-sm font-black uppercase tracking-[0.5em] opacity-60 mb-6 block">
                  {dayNames[selectedDay.getDay() === 0 ? 6 : selectedDay.getDay() - 1]}
                </span>
                <span className="text-[12rem] sm:text-[18rem] font-black leading-none tracking-tighter drop-shadow-2xl">
                  {selectedDay.getDate()}
                </span>
                <div className="h-3 w-32 bg-[#1A1A1A] rounded-full my-12 mx-auto"></div>
                <span className="text-3xl sm:text-4xl font-black uppercase tracking-[0.3em]">
                  {monthNames[selectedDay.getMonth()]}
                </span>
                <p className="mt-4 text-xl font-bold opacity-40 uppercase tracking-widest">{selectedDay.getFullYear()}</p>
              </div>
            </div>
            
            <div className="flex-grow p-12 sm:p-24 space-y-16 overflow-y-auto bg-slate-50/30 dark:bg-transparent">
              {getEventsForDay(selectedDay).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-32">
                  <p className="text-3xl font-black uppercase tracking-[0.4em] italic">Keine Termine</p>
                </div>
              ) : (
                <div className="space-y-24">
                  {getEventsForDay(selectedDay).map((event, idx) => (
                    <div key={event.id} className={`flex flex-col gap-10 animate-in slide-in-from-bottom-12 duration-700`} style={{ animationDelay: `${idx * 200}ms` }}>
                      <div className="flex flex-wrap items-center justify-between gap-6">
                         <div className="flex items-center gap-4">
                            <div className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                                event.status === 'red' ? 'bg-red-500 text-white shadow-xl shadow-red-500/30' : 
                                event.status === 'orange' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/30' : 'bg-green-500 text-white shadow-xl shadow-green-500/30'
                            }`}>
                              {event.type}
                            </div>
                         </div>
                         <span className="text-xs font-bold text-inherit opacity-60">Von {event.author}</span>
                      </div>

                      <div className="space-y-8">
                        <h4 className="text-5xl sm:text-8xl font-black tracking-tighter leading-[0.9] text-inherit">{event.title}</h4>
                        <p className="text-xl sm:text-3xl opacity-70 leading-relaxed font-medium max-w-5xl">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-10 pt-16 border-t border-slate-200 dark:border-white/10">
                        <button className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-[#B5A47A] hover:text-white transition-all shadow-2xl">
                          Details ansehen
                        </button>
                      </div>
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
