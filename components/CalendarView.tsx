import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarViewMode, Poll, User, AppRole } from '../types';
import * as api from '../services/api';

interface CalendarViewProps { polls: Poll[]; user: User; onRefresh: () => void; }

const CalendarView: React.FC<CalendarViewProps> = ({ polls, user, onRefresh }) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<'event' | 'task'>('event');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents(() => {});
      setEvents(data || []);
    } catch (e) {
      console.error("Could not load events", e);
    }
  };

  const allEventsCombined: CalendarEvent[] = useMemo(() => {
    const pollEvents: CalendarEvent[] = polls.filter(p => p.target_date).map(p => ({
      id: `poll-${p.id}`,
      title: p.question,
      description: `Vereinsumfrage aktiv.`,
      date: p.target_date!,
      type: 'poll',
      status: 'red',
      author: p.author_name || 'Vorstand',
      linkedPollId: p.id,
      is_private: false
    }));

    const filteredCustomEvents = events.filter(e => !e.is_private || e.author_id === user.id);
    return [...pollEvents, ...filteredCustomEvents];
  }, [polls, events, user.id]);

  const monthNames = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const dayNames = ["Mo","Di","Mi","Do","Fr","Sa","So"];

  const getDaysInMonth = (year:number,month:number)=> new Date(year,month+1,0).getDate();
  const getFirstDayOfMonth = (year:number,month:number)=>{
    const d=new Date(year,month,1).getDay();
    return d===0?6:d-1;
  };
  const isSameDay=(d1:Date,d2:Date)=>d1.toDateString()===d2.toDateString();
  const getEventsForDay=(date:Date)=>allEventsCombined.filter(e=>isSameDay(new Date(e.date),date));

  const handleCreateEntry = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(!newTitle||!newDate)return;
    setLoading(true);
    setFormError(null);
    try{
      await api.createEvent({
        title:newTitle,
        description:newDesc,
        date:newDate,
        type:newType,
        is_private:isPrivate,
        author:user.displayName,
        author_id:user.id,
        status:newType==='event'?'green':'orange'
      },()=>{});
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      loadEvents();
      onRefresh();
    }catch(err:any){
      setFormError(err.message||"Fehler beim Erstellen des Eintrags.");
    }finally{ setLoading(false);}
  };

  const renderMonthGrid=(year:number,month:number,isMini=false)=>{
    const daysInMonth=getDaysInMonth(year,month);
    const firstDay=getFirstDayOfMonth(year,month);
    const days=[];
    for(let i=0;i<firstDay;i++)days.push(null);
    for(let i=1;i<=daysInMonth;i++)days.push(new Date(year,month,i));

    return(
      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {!isMini&&dayNames.map(d=>(
          <div key={d} className="text-[8px] sm:text-[10px] font-black text-center text-slate-400 uppercase tracking-widest mb-2">
            {d}
          </div>
        ))}
        {days.map((d,idx)=>{
          if(!d)return<div key={`empty-${idx}`}/>;
          const dayEvents=getEventsForDay(d);
          const isToday=isSameDay(new Date(),d);

          return(
            <div
              key={idx}
              onClick={()=>{setSelectedDay(d);setViewMode('day');}}
              className={`h-12 sm:h-24 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer 
              bg-slate-50 dark:bg-white/5 
              border border-slate-100 dark:border-white/5
              hover:bg-slate-100 dark:hover:bg-white/10
              ${isToday?'ring-2 ring-[#B5A47A]':''}`}
            >
              <span className={`text-xs sm:text-xl font-black ${isToday?'text-[#B5A47A]':'text-slate-800 dark:text-white'}`}>
                {d.getDate()}
              </span>

              {dayEvents.length>0&&(
                <div className="flex gap-0.5 mt-1 sm:mt-2">
                  {dayEvents.some(e=>e.is_private)&&(
                    <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-400" />
                  )}
                  {dayEvents.some(e=>!e.is_private)&&(
                    <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#B5A47A]" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const canCreate=user.role===AppRole.SUPERADMIN||user.role===AppRole.VORSTAND;

  return(
    <div className="max-w-4xl mx-auto pb-10 px-4">

      {/* AB HIER IST ALLES 1:1 DEIN ORIGINALCODE UNVERÄNDERT */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-lg rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border-2 border-[#B5A47A] animate-in zoom-in-95 duration-300 my-auto">
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-[#B5A47A] mb-6 tracking-tighter">Neuer Eintrag</h3>
            
            {formError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold animate-in shake duration-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titel</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/20 rounded-xl outline-none border border-transparent focus:border-[#B5A47A] font-bold text-black dark:text-white" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Datum</label>
                <input required type="date" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/20 rounded-xl outline-none border border-transparent focus:border-[#B5A47A] font-bold text-black dark:text-white" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Typ</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/20 rounded-xl outline-none border border-transparent focus:border-[#B5A47A] font-bold text-black dark:text-white appearance-none" value={newType} onChange={e => setNewType(e.target.value as any)}>
                    <option value="event">Event</option>
                    <option value="task">Aufgabe</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sichtbarkeit</label>
                  <div className="flex bg-slate-50 dark:bg-black/20 p-1 rounded-xl">
                    <button type="button" onClick={() => setIsPrivate(false)} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isPrivate ? 'bg-[#B5A47A] text-[#1A1A1A]' : 'text-slate-400'}`}>Publik</button>
                    <button type="button" onClick={() => setIsPrivate(true)} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isPrivate ? 'bg-[#B5A47A] text-[#1A1A1A]' : 'text-slate-400'}`}>Privat</button>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Beschreibung</label>
                <textarea rows={3} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-black/20 rounded-xl outline-none border border-transparent focus:border-[#B5A47A] font-bold text-black dark:text-white resize-none" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Details zum Eintrag..." />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => { setShowCreateModal(false); setFormError(null); }} className="order-2 sm:order-1 flex-1 py-4 rounded-xl bg-slate-100 dark:bg-white/5 font-black text-[10px] uppercase tracking-widest">Abbruch</button>
                <button type="submit" disabled={loading} className="order-1 sm:order-2 flex-1 py-4 rounded-xl bg-[#B5A47A] text-[#1A1A1A] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#B5A47A]/20 disabled:opacity-50">
                  {loading ? 'Speichere...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 sm:mb-20">
        <div className="text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#B5A47A]/20 rounded-full mb-2 border border-[#B5A47A]/30">
            <div className="w-1.5 h-1.5 rounded-full bg-[#B5A47A] animate-pulse"></div>
            <span className="text-[9px] font-black text-[#B5A47A] uppercase tracking-widest">Interaktiver Planer</span>
          </div>
          
          <h2 className="text-6xl sm:text-9xl font-black uppercase tracking-tighter leading-[0.85] text-[#B5A47A] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-all duration-500">
            {monthNames[currentDate.getMonth()]}
          </h2>
          <p className="text-2xl sm:text-4xl font-black text-[#B5A47A]/70 tracking-[0.4em] ml-1">{currentDate.getFullYear()}</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          {canCreate && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-[#B5A47A] text-[#1A1A1A] px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Neuer Eintrag
            </button>
          )}
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl shadow-2xl border border-white/5">
            <button 
              onClick={() => setViewMode('month')} 
              className={`flex-1 sm:flex-none px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Monatsansicht
            </button>
            <button 
              onClick={() => setViewMode('year')} 
              className={`flex-1 sm:flex-none px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'year' ? 'bg-[#B5A47A] text-[#1A1A1A] shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              Jahresansicht
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="bg-white dark:bg-[#1E1E1E] p-5 sm:p-14 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl border border-slate-100 dark:border-white/5">
           <div className="flex justify-between items-center mb-12 bg-slate-50 dark:bg-black/20 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} 
                className="p-5 bg-white dark:bg-white/5 shadow-sm rounded-2xl text-[#B5A47A] hover:bg-[#B5A47A] hover:text-white transition-all border border-slate-100 dark:border-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-center">
                <span className="font-black text-2xl sm:text-4xl uppercase tracking-tighter text-black dark:text-white block leading-none">{monthNames[currentDate.getMonth()]}</span>
                <span className="font-black text-[12px] uppercase text-[#B5A47A] tracking-[0.4em] mt-2 block">{currentDate.getFullYear()}</span>
              </div>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} 
                className="p-5 bg-white dark:bg-white/5 shadow-sm rounded-2xl text-[#B5A47A] hover:bg-[#B5A47A] hover:text-white transition-all border border-slate-100 dark:border-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
           </div>
           {renderMonthGrid(currentDate.getFullYear(), currentDate.getMonth())}
        </div>
      )}

      {viewMode === 'year' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {monthNames.map((name, idx) => (
            <div key={name} onClick={() => { setCurrentDate(new Date(currentDate.getFullYear(), idx, 1)); setViewMode('month'); }} className="bg-white dark:bg-[#1E1E1E] p-8 rounded-[2rem] shadow-xl cursor-pointer hover:border-[#B5A47A] border-2 border-transparent transition-all group">
              <h4 className="text-sm font-black uppercase mb-6 text-[#B5A47A] group-hover:scale-110 origin-left transition-transform">{name}</h4>
              {renderMonthGrid(currentDate.getFullYear(), idx, true)}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'day' && selectedDay && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <button 
             onClick={() => setViewMode('month')} 
             className="text-[10px] font-black uppercase tracking-widest bg-black text-[#B5A47A] px-10 py-5 rounded-2xl shadow-xl flex items-center gap-3 hover:gap-5 transition-all border border-[#B5A47A]/30"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             Zurück zum Monat
           </button>
           <div className="bg-white dark:bg-[#1E1E1E] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col border border-slate-100 dark:border-white/5">
              <div className="bg-slate-900 p-12 sm:p-20 flex flex-col items-center justify-center text-white relative">
                 <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                    <span className="text-[20rem] font-black absolute -top-20 -left-10 leading-none">{selectedDay.getDate()}</span>
                 </div>
                 <span className="text-[10rem] sm:text-[14rem] font-black leading-none z-10">{selectedDay.getDate()}</span>
                 <span className="text-2xl sm:text-4xl font-black uppercase tracking-[0.3em] z-10 text-[#B5A47A]">{monthNames[selectedDay.getMonth()]}</span>
              </div>
              <div className="p-10 sm:p-20 space-y-12">
                 {getEventsForDay(selectedDay).length === 0 ? (
                   <div className="py-20 text-center space-y-4">
                     <p className="font-black opacity-10 text-4xl sm:text-6xl uppercase tracking-tighter">Keine Termine</p>
                     <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Genieße deinen freien Tag!</p>
                   </div>
                 ) : (
                   getEventsForDay(selectedDay).map(e => (
                     <div key={e.id} className={`group border-l-8 ${e.is_private ? 'border-slate-400' : 'border-[#B5A47A]'} pl-8 sm:pl-12 py-4 space-y-4 relative`}>
                        <div className="flex items-center gap-3">
                           <span className={`px-3 py-1 ${e.is_private ? 'bg-slate-100 text-slate-500' : 'bg-[#B5A47A]/10 text-[#B5A47A]'} text-[9px] font-black rounded-lg uppercase tracking-widest`}>
                            {e.type} {e.is_private && '• Privat'}
                           </span>
                           <span className={`w-2 h-2 rounded-full ${e.type === 'poll' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                        </div>
                        <h4 className="text-4xl sm:text-6xl font-black leading-[0.9] uppercase tracking-tighter text-black dark:text-white transition-colors">
                          {e.title}
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg sm:text-2xl leading-relaxed max-w-2xl">{e.description}</p>
                        <div className="flex items-center gap-4 pt-4">
                           <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-xs text-[#B5A47A]">
                              {e.author.charAt(0)}
                           </div>
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Eingetragen von {e.author}</span>
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



