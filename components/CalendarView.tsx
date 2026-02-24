import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarViewMode, Poll, User, AppRole } from '../types';
import * as api from '../services/api';
import EventDetailView from './EventDetailView';
import EventCreateModal from './EventCreateModal';
import PollCreate from './PollCreate';

interface CalendarViewProps {
  polls: Poll[];
  user: User;
  onRefresh: () => void;
  onOpenPoll: (pollId: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  polls,
  user,
  onRefresh,
  onOpenPoll
}) => {

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
const [showPollCreate, setShowPollCreate] = useState(false);
const [pollEventContext, setPollEventContext] = useState<CalendarEvent | null>(null);
  const canCreate =
    user.role === AppRole.SUPERADMIN ||
    user.role === AppRole.VORSTAND;

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

  const hasEventsInMonth = (year:number, month:number) =>
    allEventsCombined.some(e=>{
      const d = new Date(e.date);
      return d.getFullYear()===year && d.getMonth()===month;
    });

  const renderMonthGrid=(year:number,month:number,isMini=false)=>{
    const daysInMonth=getDaysInMonth(year,month);
    const firstDay=getFirstDayOfMonth(year,month);
    const days:(Date|null)[]=[];
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
          const isSelectedDay = selectedDay ? isSameDay(selectedDay, d) : false;

          return(
            <div
              key={idx}
              onClick={() => { setSelectedDay(d); setViewMode('day'); }}
              className={`h-14 sm:h-24 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer 
              bg-white dark:bg-[#1E1E1E]
              border border-slate-200 dark:border-white/5
              hover:bg-slate-100 dark:hover:bg-white/10
              ${isToday?'ring-2 ring-[#B5A47A]':''}
              ${isSelectedDay?'outline outline-2 outline-[#B5A47A]/60':''}`}
            >
              <span className={`text-sm sm:text-xl font-black ${isToday?'text-[#B5A47A]':'text-slate-900 dark:text-white'}`}>
                {d.getDate()}
              </span>

              {dayEvents.slice(0,2).map(ev => (
                <button
                  key={ev.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                  className="mt-1 text-[10px] font-bold text-[#B5A47A] hover:underline max-w-[90%] truncate"
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

  const renderDayView = () => {
    if (!selectedDay) return null;

    const dayEvents = getEventsForDay(selectedDay);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMode('month')} className="text-sm font-bold text-slate-500 hover:text-[#B5A47A]">
            ← zurück
          </button>

          <div className="text-sm font-black">
            {selectedDay.toLocaleDateString()}
          </div>

          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#B5A47A] text-black font-bold px-4 py-2 rounded-lg"
            >
              + Termin
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 border border-slate-200 dark:border-white/5">
          {dayEvents.length === 0 ? (
            <p className="text-slate-500 font-bold">
              Keine Termine an diesem Tag.
            </p>
          ) : (
            <div className="space-y-3">
              {dayEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-[#B5A47A] transition"
                >
                  <div className="font-black">{ev.title}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {ev.description || 'Keine Beschreibung'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 🔥 POLL CREATE VIEW
if (showPollCreate && pollEventContext) {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      <button
        onClick={() => {
          setShowPollCreate(false);
          setPollEventContext(null);
        }}
        className="mb-6 text-sm font-bold text-slate-500 hover:text-[#B5A47A]"
      >
        ← Zurück zum Event
      </button>

      <PollCreate
        onSuccess={async () => {
          await onRefresh();
          setShowPollCreate(false);
          setPollEventContext(null);
        }}
        onUnauthorized={() => {}}
      />
    </div>
  );
}

if (selectedEvent) {
  return (
    <EventDetailView
      event={selectedEvent}
      user={user}
      onBack={() => setSelectedEvent(null)}
      onCreatePoll={() => {
        setPollEventContext(selectedEvent);
        setShowPollCreate(true);
      }}
      onOpenPoll={(pollId) => {
        onOpenPoll(pollId);
      }}
      onCreateTasks={(id) => console.log('Create tasks for', id)}
    />
  );
}

  return(
    <div className="max-w-4xl mx-auto pb-10 px-4">

      {showCreateModal && (
        <EventCreateModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { loadEvents(); onRefresh(); }}
        />
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-slate-200 dark:bg-[#1E1E1E] p-1 rounded-2xl">
          <button onClick={()=>setViewMode('month')} className={`flex-1 py-3 px-6 rounded-xl font-bold ${viewMode==='month'?'bg-[#B5A47A] text-black':'text-slate-700 dark:text-white'}`}>Monat</button>
          <button onClick={()=>setViewMode('year')} className={`flex-1 py-3 px-6 rounded-xl font-bold ${viewMode==='year'?'bg-[#B5A47A] text-black':'text-slate-700 dark:text-white'}`}>Jahr</button>
          <button onClick={()=>setViewMode('year-list')} className={`flex-1 py-3 px-6 rounded-xl font-bold ${viewMode==='year-list'?'bg-[#B5A47A] text-black':'text-slate-700 dark:text-white'}`}>Liste</button>
        </div>

        {canCreate && viewMode !== 'day' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#B5A47A] text-black font-bold px-4 py-3 rounded-xl"
          >
            + Termin
          </button>
        )}
      </div>

      {/* MONATS TITEL */}
      {viewMode==='month' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))}
              className="font-bold text-slate-500 hover:text-[#B5A47A]"
            >
              ←
            </button>

            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>

            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))}
              className="font-bold text-slate-500 hover:text-[#B5A47A]"
            >
              →
            </button>
          </div>

          {renderMonthGrid(currentDate.getFullYear(),currentDate.getMonth())}
        </>
      )}

      {viewMode==='year' && (
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-8">
          {monthNames.map((name,month)=> {
            const isActive = month === currentDate.getMonth();
            return (
              <div key={month}
                onClick={()=>{setCurrentDate(new Date(currentDate.getFullYear(),month,1));setViewMode('month');}}
                className={`p-8 rounded-2xl cursor-pointer border-2 transition-all
                ${hasEventsInMonth(currentDate.getFullYear(),month)
                  ? 'border-[#B5A47A] bg-[#B5A47A]/10'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E]'}
                ${isActive ? 'ring-2 ring-[#B5A47A]' : ''}`}
              >
                <h4 className="font-black text-[#B5A47A] mb-4">{name}</h4>
                {renderMonthGrid(currentDate.getFullYear(),month,true)}
              </div>
            );
          })}
        </div>
      )}

      {viewMode==='year-list' && (
        <div className="space-y-4">
          {monthNames.map((name,idx)=> {
            const isActive = idx === currentDate.getMonth();
            return (
              <div key={idx}
                onClick={()=>{setCurrentDate(new Date(currentDate.getFullYear(),idx,1));setViewMode('month');}}
                className={`p-6 rounded-2xl cursor-pointer border transition-all flex justify-between items-center
                ${hasEventsInMonth(currentDate.getFullYear(),idx)
                  ? 'border-[#B5A47A] bg-[#B5A47A]/10'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E1E1E]'}
                ${isActive ? 'ring-2 ring-[#B5A47A]' : ''}`}
              >
                <span className="font-black">{name}</span>
                {hasEventsInMonth(currentDate.getFullYear(),idx) && (
                  <span className="text-[#B5A47A] font-bold">Termine</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode==='day' && renderDayView()}

    </div>
  );
};

export default CalendarView;
