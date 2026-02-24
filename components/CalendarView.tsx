import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarViewMode, Poll, User, AppRole } from '../types';
import * as api from '../services/api';
import EventDetailView from './EventDetailView';

interface CalendarViewProps { polls: Poll[]; user: User; onRefresh: () => void; }

const CalendarView: React.FC<CalendarViewProps> = ({ polls, user, onRefresh }) => {

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

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

  const renderMonthGrid=(year:number,month:number,isMini=false)=>{
    const daysInMonth=getDaysInMonth(year,month);
    const firstDay=getFirstDayOfMonth(year,month);
    const days=[];
    for(let i=0;i<firstDay;i++)days.push(null);
    for(let i=1;i<=daysInMonth;i++)days.push(new Date(year,month,i));

    return(
      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {!isMini&&dayNames.map(d=>(
          <div key={d} className="text-[9px] sm:text-[11px] font-bold text-center text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">
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
              className={`h-14 sm:h-24 flex flex-col items-center justify-center rounded-xl transition-all 
              bg-white dark:bg-[#1E1E1E]
              border border-slate-200 dark:border-white/5
              ${isToday?'ring-2 ring-[#B5A47A]':''}`}
            >
              <span className={`text-sm sm:text-xl font-black ${isToday?'text-[#B5A47A]':'text-slate-900 dark:text-white'}`}>
                {d.getDate()}
              </span>

              {dayEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="mt-1 text-[10px] font-bold text-[#B5A47A] hover:underline"
                >
                  {ev.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  if (selectedEvent) {
    return (
      <EventDetailView
        event={selectedEvent}
        user={user}
        onBack={() => setSelectedEvent(null)}
        onCreatePoll={(id) => console.log('Create poll for', id)}
        onCreateTasks={(id) => console.log('Create tasks for', id)}
      />
    );
  }

  return(
    <div className="max-w-4xl mx-auto pb-10 px-4">

      <div className="flex bg-slate-200 dark:bg-[#1E1E1E] p-1 rounded-2xl mb-10">
        <button onClick={()=>setViewMode('month')} className={`flex-1 py-3 rounded-xl font-bold ${viewMode==='month'?'bg-[#B5A47A] text-black':'text-slate-700 dark:text-white'}`}>Monat</button>
        <button onClick={()=>setViewMode('year')} className={`flex-1 py-3 rounded-xl font-bold ${viewMode==='year'?'bg-[#B5A47A] text-black':'text-slate-700 dark:text-white'}`}>Jahr</button>
        <button onClick={()=>setViewMode('year-list')} className={`flex-1 py-3 rounded-xl font-bold ${viewMode==='year-list'?'bg-[#B5A47A] text-black':'text-slate-700 dark:text-white'}`}>Liste</button>
      </div>

      {viewMode==='month' && (
        renderMonthGrid(currentDate.getFullYear(),currentDate.getMonth())
      )}

    </div>
  );
};

export default CalendarView;
