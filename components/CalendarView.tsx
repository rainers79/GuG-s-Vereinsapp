
import React, { useState, useMemo } from 'react';
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
    { id: '1', title: 'Vorstandssitzung', description: 'Besprechung der neuen Satzung und Planung des Sommerfests. Alle Vorstandsmitglieder sind zur Anwesenheit verpflichtet.', date: new Date().toISOString(), type: 'event', status: 'orange', author: 'Rainer Schmidt' },
    { id: '2', title: 'Abstimmung: Neues Logo', description: 'Finale Wahl des neuen Vereinslogos. Bitte die Entwürfe im Anhang vorab prüfen.', date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), type: 'poll', status: 'red', author: 'Vorstand' },
    { id: '3', title: 'Mitgliederliste Update', description: 'Alle Profile müssen bis Ende der Woche vervollständigt sein, um die neue Mitgliederkarte zu erhalten.', date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), type: 'task', status: 'green', author: 'System' },
    { id: '4', title: 'Platzpflege', description: 'Gemeinsames Reinigen der Außenanlagen.', date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), type: 'task', status: 'orange', author: 'Platzwart' },
  ], []);

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday start
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
                ${isMini ? 'h-8 text-[10px]' : 'h-16 sm:h-24'}
                ${d.current ? (theme === 'dark' ? 'bg-white/5 hover:bg-[#B5A47A]/20' : 'bg-white hover:bg-[#B5A47A]/5') : 'opacity-20'}
                ${isToday && d.current ? 'ring-2 ring-[#B5A47A]' : 'border border-slate-100 dark:border-white/5'}
                hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-[#B5A47A]/20
              `}
            >
              <span className={`font-black text-sm sm:text-lg ${isToday && d.current ? 'text-[#B5A47A]' : ''}`}>{d.day}</span>
              
              {/* Event Dots */}
              {hasEvents && (
                <div className="flex gap-1 mt-2">
                  {dayEvents.map(e => (
                    <div 
                      key={e.id} 
                      className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                        e.status === 'red' ? 'bg-red-500' : 
                        e.status === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                      }`} 
                    />
                  ))}
                </div>
              )}

              {/* HOVER DETAILS PANEL */}
              {!isMini && hasEvents && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 sm:w-64 bg-[#1A1A1A] text-white p-4 rounded-2xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#B5A47A] mb-3 border-b border-white/10 pb-2">Details für diesen Tag</p>
                  <div className="space-y-3">
                    {dayEvents.map(e => (
                      <div key={e.id} className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          e.status === 'red' ? 'bg-red-500' : 
                          e.status === 'orange' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold leading-tight">{e.title}</p>
                          <p className="text-[9px] opacity-40 uppercase font-black">{e.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 text-center">
                    <span className="text-[8px] font-black uppercase opacity-30">Klicken für Vollansicht</span>
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
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-6xl mx-auto">
      {/* View Selectors & Title */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
        <div className="text-center md:text-left">
          <h2 className="text-5xl font-black tracking-tighter uppercase mb-2">
            {viewMode === 'year' ? currentDate.getFullYear() : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="h-1.5 w-16 bg-[#B5A47A] rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Veranstaltungskalender</span>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl shadow-inner">
          {(['month', 'year'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                viewMode === mode 
                  ? 'bg-[#1A1A1A] text-white shadow-2xl' 
                  : 'text-slate-400 hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              {mode === 'month' ? 'Monatsansicht' : 'Jahresübersicht'}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER VIEWS */}
      {viewMode === 'month' && (
        <div className="animate-in fade-in zoom-in-95 duration-700">
          <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} p-6 sm:p-12 rounded-[2.5rem] border shadow-2xl transition-all duration-500`}>
            <div className="flex justify-between items-center mb-12">
              <button onClick={() => changeMonth(-1)} className="group p-4 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all duration-500 shadow-lg hover:shadow-[#B5A47A]/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-center">
                <span className="text-sm font-black uppercase tracking-[0.3em] opacity-30 block mb-1">Aktueller Bereich</span>
                <span className="text-xl font-black uppercase tracking-widest">{monthNames[currentDate.getMonth()]}</span>
              </div>
              <button onClick={() => changeMonth(1)} className="group p-4 hover:bg-[#B5A47A] text-[#B5A47A] hover:text-white rounded-2xl transition-all duration-500 shadow-lg hover:shadow-[#B5A47A]/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            {renderMonth(currentDate.getFullYear(), currentDate.getMonth())}
          </div>
        </div>
      )}

      {viewMode === 'year' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-10 duration-1000">
          {monthNames.map((name, idx) => (
            <div 
              key={name} 
              onClick={() => {
                setCurrentDate(new Date(currentDate.getFullYear(), idx, 1));
                setViewMode('month');
              }}
              className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} p-8 rounded-[2rem] border shadow-xl hover:shadow-2xl hover:border-[#B5A47A] transition-all duration-500 cursor-pointer group`}
            >
              <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 group-hover:text-[#B5A47A] transition-colors">{name}</h4>
              {renderMonth(currentDate.getFullYear(), idx, true)}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'day' && selectedDay && (
        <div className="animate-in slide-in-from-right-10 duration-700 min-h-[600px] flex flex-col">
          <button 
            onClick={() => setViewMode('month')}
            className="mb-10 w-fit flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] px-6 py-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-[#1A1A1A] hover:text-white transition-all shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" /></svg>
            Zurück zur Monatsübersicht
          </button>
          
          <div className={`${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5' : 'bg-white border-slate-100'} rounded-[3rem] border shadow-2xl flex flex-col lg:flex-row overflow-hidden flex-grow`}>
            {/* LEFT: Date Focus */}
            <div className="lg:w-1/3 bg-[#B5A47A] p-12 sm:p-20 flex flex-col justify-center items-center text-[#1A1A1A] text-center">
              <span className="text-sm font-black uppercase tracking-[0.4em] opacity-60 mb-4">
                {dayNames[selectedDay.getDay() === 0 ? 6 : selectedDay.getDay() - 1]}
              </span>
              <span className="text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter">
                {selectedDay.getDate()}
              </span>
              <div className="h-2 w-24 bg-[#1A1A1A] rounded-full my-8"></div>
              <span className="text-2xl font-black uppercase tracking-widest">
                {monthNames[selectedDay.getMonth()]}
              </span>
            </div>
            
            {/* RIGHT: Details List */}
            <div className="flex-grow p-10 sm:p-20 space-y-12 overflow-y-auto">
              {getEventsForDay(selectedDay).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                  <p className="text-xl font-black uppercase tracking-widest italic">Keine Termine hinterlegt</p>
                </div>
              ) : (
                <div className="space-y-16">
                  {getEventsForDay(selectedDay).map((event, idx) => (
                    <div key={event.id} className={`flex flex-col gap-8 animate-in slide-in-from-bottom-10 duration-700`} style={{ animationDelay: `${idx * 150}ms` }}>
                      <div className="flex flex-wrap items-center gap-4">
                         <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            event.status === 'red' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 
                            event.status === 'orange' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                         }`}>
                           {event.type}
                         </div>
                         <span className="text-sm font-black uppercase opacity-20 tracking-widest">Gepostet von {event.author}</span>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-4xl sm:text-6xl font-black tracking-tighter">{event.title}</h4>
                        <p className="text-xl sm:text-2xl opacity-60 leading-relaxed font-medium max-w-4xl">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-8 pt-10 border-t border-slate-100 dark:border-white/5">
                        <button className="bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#B5A47A] hover:text-white transition-all shadow-xl active:scale-95">
                          Teilnahme Bestätigen
                        </button>
                        <button className="text-[#B5A47A] font-black text-xs uppercase tracking-widest hover:underline">
                          In Kalender exportieren
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
