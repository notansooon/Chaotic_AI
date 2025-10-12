import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Video, Globe, Share2, CalendarPlus, User, Building, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function EventDetailModal({ event, isOpen, onClose, onAddToCalendar, isAttending }) {
  if (!event) return null;

  const handleAddToCalendar = (e) => {
    e.stopPropagation();
    if (!isAttending) {
      onAddToCalendar(event);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          {event.image_url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 mb-4">
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}
          <DialogTitle className="text-2xl font-bold text-slate-900">{event.title}</DialogTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600 pt-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{format(new Date(event.date), "h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2">
              {event.is_virtual ? <Video className="w-4 h-4 text-teal-600" /> : <MapPin className="w-4 h-4 text-teal-600" />}
              <span>{event.location}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">About This Event</h3>
              <p className="text-slate-600 leading-relaxed">{event.description}</p>
            </div>
            
            {event.notable_speakers && event.notable_speakers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Speakers & Notable Guests</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.notable_speakers.map((speaker, index) => (
                    <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{speaker}</p>
                        <p className="text-xs text-slate-500">Industry Expert</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
                <Button 
                  onClick={handleAddToCalendar}
                  disabled={isAttending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-70"
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  {isAttending ? "Added to Calendar" : "Add to Calendar"}
                </Button>
                
                {event.event_url && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => window.open(event.event_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Original Event
                  </Button>
                )}
                
                <Button variant="outline" className="w-full mt-2">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Event
                </Button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800">Details</h4>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Building className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Organizer</p>
                  <p className="font-medium text-slate-700">{event.organizer}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-500" />
                 <div>
                  <p className="text-xs text-slate-500">Attendees</p>
                  <p className="font-medium text-slate-700">{event.attendees?.length || 0} attending</p>
                </div>
              </div>
               {event.event_url && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Globe className="w-4 h-4 text-slate-500" />
                   <div>
                    <p className="text-xs text-slate-500">Website</p>
                    <a href={event.event_url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                      View Event Page
                    </a>
                  </div>
                </div>
              )}
            </div>

            {event.tags && event.tags.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {event.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}