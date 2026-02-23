import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, CalendarViewMode, Poll, User, AppRole, ApiError } from '../types';
import * as api from '../services/api';

interface CalendarViewProps { theme: 'light' | 'dark'; polls: Poll[]; user: User; onRefresh: () => void; }

const CalendarView: React.FC<CalendarViewProps> = ({ theme, polls, user, onRefresh }) => {
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

  useEffect(() => {
    loadEvents();
  }, []);

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

  const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const dayNames = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const getEventsForDay = (date: Date) => allEventsCombined.filter(e => isSameDay(new Date(e.date), date));

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;
    setLoading(true);
    setFormError(null);
    try {
      await api.createEvent({
        title: newTitle,
        description: newDesc,
        date: newDate,
        type: newType,
        is_private: isPrivate,
        author: user.displayName,
        author_id: user.id,
        status: newType === 'event' ? 'green' : 'orange'
      }, () => {});
      
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      loadEvents();
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || "Fehler beim Erstellen des Eintrags.");
    } finally {
      setLoading(false);
    }
  };

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
              className={`h-12 sm:h-24 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'} ${isToday ? 'ring-2 ring-[#B5A47A]' : ''}`}
            >
              <span className={`text-xs sm:text-xl font-black ${isToday ? 'text-[#B5A47A]' : theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {d.getDate()}
              </span>
              {dayEvents.length > 0 && <div className="flex gap-0.5 mt-1 sm:mt-2">
                {dayEvents.some(e => e.is_private) && <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-400" title="Privat" />}
                {dayEvents.some(e => !e.is_private) && <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#B5A47A]" title="Öffentlich" />}
              </div>}
            </div>
          );
        })}
      </div>
    );
  };

  const canCreate = user.role === AppRole.SUPERADMIN || user.role === AppRole.VORSTAND;

  return (
    <div className="max-w-4xl mx-auto pb-10 px-4">
      {/* Rest der Datei unverändert */}
    </div>
  );
};

export default CalendarView;
