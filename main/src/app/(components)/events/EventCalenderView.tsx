import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const DayCell = ({ day, eventsOnDay, isCurrentMonth, onEventClick }) => {
  const isCurrentDay = isToday(day);

  return (
    <div
      className={`border border-slate-200/80 p-2 flex flex-col min-h-[120px] transition-colors duration-200 ${
        isCurrentMonth ? 'bg-white' : 'bg-slate-50'
      } ${isCurrentDay ? 'bg-emerald-50 border-emerald-300' : ''}`}
    >
      <span
        className={`font-semibold mb-2 text-sm ${
          isCurrentMonth ? (isCurrentDay ? 'text-emerald-700' : 'text-slate-800') : 'text-slate-400'
        }`}
      >
        {format(day, 'd')}
      </span>
      <div className="space-y-1 overflow-y-auto flex-1">
        {eventsOnDay.slice(0, 3).map(event => (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 p-2 rounded-md cursor-pointer hover:from-emerald-200 hover:to-teal-200 transition-all duration-200 shadow-sm"
          >
            <div className="font-medium truncate mb-1">{event.title}</div>
            <div className="flex items-center gap-1 text-emerald-600">
              <Clock className="w-2.5 h-2.5" />
              <span>{format(new Date(event.date), 'HH:mm')}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1 text-emerald-600 mt-0.5">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        ))}
        {eventsOnDay.length > 3 && (
          <div className="text-xs text-slate-500 font-medium cursor-pointer hover:text-slate-700 p-1">
            + {eventsOnDay.length - 3} more events
          </div>
        )}
      </div>
    </div>
  );
};

export default function EventCalendarView({ events, onEventClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const navigateToDate = (date) => {
    setCurrentMonth(date);
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 bg-white rounded-t-lg border-b">
      <h2 className="text-xl font-bold text-slate-800">
        {format(currentMonth, 'MMMM yyyy')}
      </h2>
      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Jump to Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={currentMonth}
              onSelect={(date) => date && navigateToDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderDaysOfWeek = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 text-center font-medium text-slate-600 text-sm py-3 bg-slate-50 border-b border-slate-200">
        {days.map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const eventsOnDay = events.filter(event => 
            isSameDay(new Date(event.date), day)
          );
          return (
            <DayCell
              key={i}
              day={day}
              eventsOnDay={eventsOnDay}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              onEventClick={onEventClick}
            />
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md border border-slate-200"
    >
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </motion.div>
  );
}                                                                                                                             