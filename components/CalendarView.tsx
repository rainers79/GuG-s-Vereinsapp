
import React, { useState, useMemo } from 'react';
import { CalendarEvent, CalendarViewMode } from '../types';

interface CalendarViewProps {
  theme: 'light' | 'dark';
}

const CalendarView: React.FC<CalendarViewProps> = ({ theme }) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Mock Events für die Visualisierung mit Admin-Farben (Rot, Orange, Grün)
  const events: CalendarEvent[] = useMemo(() => [
    { id: '1', title: 'Vorstandssitzung', description: 'Detaillierte Besprechung der neuen Satzung und Planung des Sommerfests. Alle Vorstandsmitglieder sind zur Anwesenheit verpflichtet.', date: new Date().toISOString(), type: 'event', status: 'orange', author: 'Rainer Schmidt' },
    { id: '2', title: 'Abstimmung: Neues Logo', description: 'Finale Wahl des neuen Vereinslogos. Bitte die Entwürfe im Anhang vorab prüfen und die Stimmen pünktlich abgeben.', date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), type: 'poll', status: 'red', author: 'Vorstand' },
    { id: '3', title: 'Mitgliederliste Update', description: 'Alle Profile müssen bis Ende der Woche vervollständigt sein, um die neue Mitgliederkarte zu erhalten.', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), type: 'task', status: 'green', author: 'System' },
    { id: '4', title: 'Platzpflege', description: 'Gemeinsames Reinigen der Außenanlagen. Werkzeug wird gestellt.', date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), type: 'task', status: 'orange', author: 'Platzwart' },
  ], []);

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Start mit Montag
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  const getEventsForDay = (date: Date) => 
    events.filter(e => isSameDay(new Date(e.date), date));

  const changeMonth = (offset: number) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const renderMonthGrid = (year: number, month: number, isMini = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const days = [];

    // Tage des Vormonats (heller dargestellt)
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, current: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Aktueller Monat
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, current: true, date: new Date(year, month, i) });
    }
    // Tage des nächsten Monats (heller dargestellt)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
    }

    return (
      <div className={`grid grid-cols-7 ${isMini ? 'gap-0.5' : 'gap-3 sm:gap-4'}`}>
        {!isMini && dayNames.map(d => (
          <div key={d} className="text-[10px] font-black text-center opacity-30 uppercase tracking-widest mb-4">{d}</div>
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
                ${d.current ? (theme === 'dark' ? 'bg-white/5 hover:bg-[#B5A47A]/20' : 'bg-white hover:bg-[#B5A47A]/10 shadow-sm border border-slate-100') : 'opacity-20'}
                ${isToday && d.current ? 'ring-2 ring-[#B5A47A] z-10' : ''}
                ${!isMini ? 'hover:scale-110 hover:z-30 hover:shadow-2xl shadow-[#B5A47A]/20' : ''}
              `}
            >
              <span className={`font-black ${isMini ? 'text-[10px]' : 'text-sm sm:text-xl'} ${isToday && d.current ? 'text-[#B5A47A]' : ''}`}>{d.day}</span>
              
              {/* Event Markierungen */}
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
                  {!isMini && dayEvents.length > 3 && (
                    <span className="text-[8px] font-bold opacity-40">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}

              {/* INTERAKTIVES HOVER DETAIL PANEL (ZOOM EFFEKT) */}
              {!isMini && hasEvents && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-[#1A1A1A] text-white p-5 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] opacity-0 scale-90 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 ease-out z-50">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#B5A47A]">Tagesdetails</p>
                    <span className="text-[10px] opacity-40 font-bold">{d.date.toLocaleDateString('de-DE')}</span>
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
                             <span className="text-[8px] opacity-40 uppercase font-black tracking-widest">{e.type}</span>
                             <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                             <span className="text-[8px] opacity-40 font-black">{e.author}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t border-white/5 text-center">
                    <span className="text-[8px] font-black uppercase text-[#B5A47A] animate-pulse">Klicken für Vollansicht</span>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#1A1A1A]"></div>
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
      {/* Header Bereich */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 mb-20">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#B5A47A]/10 rounded-full mb-4">
            <span className="w-2 h-2 bg-[#B5A47A] rounded-full animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B5A47A]">Live Kalender</span>
          </div>
          <h2 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase leading-none">
            {viewMode === 'year' ? currentDate.getFullYear() : `${monthNames[currentDate.getMonth()]}`}
          </h2>
          <p className="text-xl opacity-30 font-bold mt-2 uppercase tracking-[0.5em]">{viewMode === 'year' ? 'Jahresübersicht' : currentDate.getFullYear()}</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-2 rounded-[2rem] shadow-inner backdrop-blur-md">
          {(['month', 'year'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-10 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-700 ${
                viewMode === mode 
                  ? 'bg-[#1A1A1A] text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                  : 'text-slate-400 hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              {mode === 'month' ? 'Monat' : 'Jahr'}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER MONATSANSICHT */}
      {viewMode === 'month' && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
          <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} p-8 sm:p-16 rounded-[3rem] border shadow-2xl transition-all duration-500`}>
            <div className="flex justify-between items-center mb-16">
              <button onClick={() => changeMonth(-1)} className="group p-5 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all duration-500 shadow-xl hover:shadow-[#B5A47A]/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-center group cursor-pointer" onClick={() => setViewMode('year')}>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 block mb-2 group-hover:text-[#B5A47A] transition-colors">Zur Jahresübersicht</span>
                <span className="text-3xl font-black uppercase tracking-widest">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              </div>
              <button onClick={() => changeMonth(1)} className="group p-5 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all duration-500 shadow-xl hover:shadow-[#B5A47A]/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            {renderMonthGrid(currentDate.getFullYear(), currentDate.getMonth())}
          </div>
        </div>
      )}

      {/* RENDER JAHRESANSICHT */}
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

      {/* RENDER TAGESANSICHT (IMMERSIV) */}
      {viewMode === 'day' && selectedDay && (
        <div className="animate-in slide-in-from-right-12 duration-700 min-h-[700px] flex flex-col">
          <button 
            onClick={() => setViewMode('month')}
            className="mb-12 w-fit flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.2em] px-8 py-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-[#1A1A1A] hover:text-white transition-all shadow-lg hover:shadow-[#1A1A1A]/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" /></svg>
            Monat aufrufen
          </button>
          
          <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-[4rem] border shadow-3xl flex flex-col lg:flex-row overflow-hidden flex-grow`}>
            {/* LINKER TEIL: Fokus Datum */}
            <div className="lg:w-2/5 bg-gradient-to-br from-[#B5A47A] to-[#8E7D56] p-16 sm:p-24 flex flex-col justify-center items-center text-[#1A1A1A] text-center relative overflow-hidden">
              {/* Dekorative Elemente */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
              
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
            
            {/* RECHTER TEIL: Details & Termine */}
            <div className="flex-grow p-12 sm:p-24 space-y-16 overflow-y-auto bg-slate-50/30 dark:bg-transparent">
              {getEventsForDay(selectedDay).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 py-32">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40 mb-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                  <p className="text-3xl font-black uppercase tracking-[0.4em] italic">Keine Einträge vorhanden</p>
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
                            <div className="h-0.5 w-6 bg-slate-200 dark:bg-white/10"></div>
                            <span className="text-[10px] font-black uppercase opacity-30 tracking-widest">Administrator Eintrag</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#B5A47A]/10 border border-[#B5A47A]/20 flex items-center justify-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#B5A47A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <span className="text-xs font-bold">{event.author}</span>
                         </div>
                      </div>

                      <div className="space-y-8">
                        <h4 className="text-5xl sm:text-8xl font-black tracking-tighter leading-[0.9]">{event.title}</h4>
                        <p className="text-xl sm:text-3xl opacity-50 leading-relaxed font-medium max-w-5xl">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-10 pt-16 border-t border-slate-100 dark:border-white/5">
                        <button className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-[#B5A47A] hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-4">
                          <span>Teilnahme Bestätigen</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>
                        <div className="flex gap-6">
                            <button className="text-[#B5A47A] font-black text-xs uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">Exportieren</button>
                            <button className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:text-[#1A1A1A] transition-colors">Details teilen</button>
                        </div>
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
