
import React, { useState, useEffect } from 'react';
import Event from '../entities/Event.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, Users, Video, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, startOfDay, addHours, isSameWeek, isToday } from 'date-fns';

export default function CalendarTab({ user }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week'); // week, day

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const attendedEvents = await Event.map(event => ({...event}));
        setEvents(attendedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  const navigateToDate = (date) => {
    setCurrentDate(date);
  };

  const navigateWeek = (direction) => {
    if (direction === 'next') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateDay = (direction) => {
    if (direction === 'next') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        time: format(addHours(startOfDay(new Date()), hour), 'HH:mm'),
        hour
      });
    }
    return slots;
  };

  const getEventsForDay = (day) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };

  const getEventsForWeek = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    return events.filter(event => isSameWeek(new Date(event.date), weekStart, { weekStartsOn: 0 }));
  };


  /* change any to number later */
  const getEventStyle = (event) => {
    const eventDate: any = new Date(event.date);
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    
    // Calculate position as percentage of the day (0-100%)
    const topPercentage = ((startHour * 60 + startMinute) / (24 * 60)) * 100;
    
    // Assume 2-hour duration if no end date
    const endDate: any = event.end_date ? new Date(event.end_date) : addHours(eventDate, 2);
    const durationMinutes = (endDate - eventDate) / (1000 * 60);
    const heightPercentage = (durationMinutes / (24 * 60)) * 100;

    return {
      top: `${topPercentage}%`,
      height: `${Math.max(heightPercentage, 8)}%`, // Minimum 8% height
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const WeekView = () => {
    const weekDays = getWeekDays();
    const timeSlots = getTimeSlots();

    return (
      <div className="flex flex-col h-full">
        {/* Header with days */}
        <div className="grid grid-cols-8 bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="p-4 border-r border-slate-200">
            <span className="text-sm font-medium text-slate-500">Time</span>
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-4 text-center border-r border-slate-200 last:border-r-0">
              <div className="text-sm font-medium text-slate-900">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-8 h-full">
            {/* Time column */}
            <div className="border-r border-slate-200">
              {timeSlots.map((slot, index) => (
                <div key={index} className="h-16 border-b border-slate-100 px-4 py-2 text-sm text-slate-500">
                  {slot.hour % 2 === 0 && slot.time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="relative border-r border-slate-200 last:border-r-0">
                {/* Hour lines */}
                {timeSlots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="h-16 border-b border-slate-50"></div>
                ))}
                
                {/* Events */}
                <div className="absolute inset-0 p-1">
                  {getEventsForDay(day).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="absolute left-1 right-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg p-2 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer z-10"
                      style={getEventStyle(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="opacity-90 truncate">{format(new Date(event.date), 'HH:mm')}</div>
                      {event.location && (
                        <div className="opacity-80 truncate flex items-center gap-1">
                          {event.is_virtual ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DayView = () => {
    const timeSlots = getTimeSlots();
    const dayEvents = getEventsForDay(currentDate);

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-500">
              {format(currentDate, 'EEEE')}
            </div>
            <div className={`text-2xl font-bold ${isToday(currentDate) ? 'text-blue-600' : 'text-slate-900'}`}>
              {format(currentDate, 'd')}
            </div>
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 relative">
          <div className="flex">
            {/* Time column */}
            <div className="w-20 border-r border-slate-200">
              {timeSlots.map((slot, index) => (
                <div key={index} className="h-16 border-b border-slate-100 px-4 py-2 text-sm text-slate-500">
                  {slot.hour % 2 === 0 && slot.time}
                </div>
              ))}
            </div>

            {/* Day column */}
            <div className="flex-1 relative">
              {/* Hour lines */}
              {timeSlots.map((slot, slotIndex) => (
                <div key={slotIndex} className="h-16 border-b border-slate-50"></div>
              ))}
              
              {/* Events */}
              <div className="absolute inset-0 p-4">
                {dayEvents.map((event, eventIndex) => (
                  <Card
                    key={eventIndex}
                    className="absolute left-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    style={getEventStyle(event)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium">{event.title}</div>
                      <div className="opacity-90 text-sm">{format(new Date(event.date), 'HH:mm')}</div>
                      {event.location && (
                        <div className="opacity-80 text-sm flex items-center gap-1 mt-1">
                          {event.is_virtual ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {event.location}
                        </div>
                      )}
                      {event.description && (
                        <div className="opacity-80 text-sm mt-1 line-clamp-2">{event.description}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              My Calendar
            </CardTitle>
            <Tabs value={view} onValueChange={setView}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Jump to Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && navigateToDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={() => view === 'week' ? navigateWeek('prev') : navigateDay('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="px-4 py-2 text-sm font-medium">
              {view === 'week' 
                ? format(startOfWeek(currentDate), 'MMM d') + ' - ' + format(addDays(startOfWeek(currentDate), 6), 'MMM d, yyyy')
                : format(currentDate, 'MMMM d, yyyy')
              }
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => view === 'week' ? navigateWeek('next') : navigateDay('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-auto">
        {view === 'week' ? <WeekView /> : <DayView />}
      </CardContent>
    </Card>
  );
}
