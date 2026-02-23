import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarViewMode, Poll, User, AppRole } from '../types';
import * as api from '../services/api';

interface CalendarViewProps { polls: Poll[]; user: User; onRefresh: () => void; }

const CalendarView: React.FC<CalendarViewProps> = ({ polls, user, onRefresh }) => {

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [yearPage, setYearPage] = useState(0); // 🔥 NEU
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

  // 🔥 NEU – Monatsprüfung
  const hasEventsInMonth = (year:number, month:number) =>
    allEventsCombined.some(e=>{
      const d = new Date(e.date);
      return d.getFullYear()===year && d.getMonth()===month;
    });

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
                  <div className="w-2 h-2 rounded-full bg-[#B5A47A]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const canCreate=user.role===AppRole.SUPERADMIN||user.role===AppRole.VORSTAND;

  // 🔥 2-Monats-Logik
  const startMonth = yearPage*2;
  const monthsToShow = [startMonth, startMonth+1].filter(m=>m<12);

  return(
    <div className="max-w-4xl mx-auto pb-10 px-4">

      {/* Umschalt Buttons erweitert */}
      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl mb-10">
        <button onClick={()=>setViewMode('month')} className={`flex-1 py-3 rounded-xl ${viewMode==='month'?'bg-[#B5A47A] text-black':'text-slate-500'}`}>Monat</button>
        <button onClick={()=>setViewMode('year')} className={`flex-1 py-3 rounded-xl ${viewMode==='year'?'bg-[#B5A47A] text-black':'text-slate-500'}`}>Jahr</button>
        <button onClick={()=>setViewMode('year-list')} className={`flex-1 py-3 rounded-xl ${viewMode==='year-list'?'bg-[#B5A47A] text-black':'text-slate-500'}`}>Liste</button>
      </div>

      {viewMode==='year' && (
        <>
          <div className="flex justify-between mb-6">
            <button onClick={()=>setYearPage(p=>Math.max(p-1,0))}>←</button>
            <button onClick={()=>setYearPage(p=>Math.min(p+1,5))}>→</button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {monthsToShow.map(month=>(
              <div key={month}
                onClick={()=>{setCurrentDate(new Date(currentDate.getFullYear(),month,1));setViewMode('month');}}
                className={`p-8 rounded-2xl cursor-pointer border-2 transition-all
                ${hasEventsInMonth(currentDate.getFullYear(),month)
                  ? 'border-[#B5A47A] bg-[#B5A47A]/10'
                  : 'border-transparent bg-white dark:bg-[#1E1E1E]'}`}
              >
                <h4 className="font-black text-[#B5A47A]">{monthNames[month]}</h4>
                {renderMonthGrid(currentDate.getFullYear(),month,true)}
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode==='year-list' && (
        <div className="space-y-4">
          {monthNames.map((name,idx)=>(
            <div key={idx}
              onClick={()=>{setCurrentDate(new Date(currentDate.getFullYear(),idx,1));setViewMode('month');}}
              className={`p-6 rounded-2xl cursor-pointer border transition-all flex justify-between
              ${hasEventsInMonth(currentDate.getFullYear(),idx)
                ? 'border-[#B5A47A] bg-[#B5A47A]/10'
                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E]'}`}
            >
              <span className="font-black">{name}</span>
              {hasEventsInMonth(currentDate.getFullYear(),idx) && (
                <span className="text-[#B5A47A] font-bold">Termine</span>
              )}
            </div>
          ))}
        </div>
      )}

      {viewMode==='month' && (
        renderMonthGrid(currentDate.getFullYear(),currentDate.getMonth())
      )}

    </div>
  );
};

export default CalendarView;
