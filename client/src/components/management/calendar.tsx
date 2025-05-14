import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, startOfMonth, endOfMonth, isToday, isSameMonth, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'visit' | 'call' | 'meeting' | 'payment' | 'deadline' | 'follow-up';
  description?: string;
  time: string;
  entityId: number;
  entityType: 'client' | 'debtor';
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  // Format date strings for API
  const startDate = format(firstDayOfMonth, "yyyy-MM-dd");
  const endDate = format(lastDayOfMonth, "yyyy-MM-dd");

  // Fetch calendar events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/activities/calendar", { start: startDate, end: endDate }],
    keepPreviousData: true,
  });

  const previousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleCloseEventDialog = () => {
    setSelectedEvent(null);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl">Calendario de Actividades</CardTitle>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium text-lg capitalize">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </h3>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            onEventClick={setSelectedEvent}
          />
        )}
      </CardContent>

      {/* Event details dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={handleCloseEventDialog}>
        {selectedEvent && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <span className="mr-2">{selectedEvent.title}</span>
                <EventBadge type={selectedEvent.type} />
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium text-right">Fecha:</p>
                <p className="col-span-3">{format(parseISO(selectedEvent.date), "dd/MM/yyyy")}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium text-right">Hora:</p>
                <p className="col-span-3">{selectedEvent.time}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium text-right">Tipo:</p>
                <p className="col-span-3">
                  {selectedEvent.type === "visit"
                    ? "Visita"
                    : selectedEvent.type === "call"
                    ? "Llamada"
                    : selectedEvent.type === "meeting"
                    ? "Reunión"
                    : selectedEvent.type === "payment"
                    ? "Pago"
                    : selectedEvent.type === "deadline"
                    ? "Vencimiento"
                    : selectedEvent.type === "follow-up"
                    ? "Seguimiento"
                    : selectedEvent.type}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <p className="text-sm font-medium text-right">Relacionado con:</p>
                <p className="col-span-3">
                  {selectedEvent.entityType === "client" ? "Cliente" : "Deudor"} ID:{" "}
                  {selectedEvent.entityId}
                </p>
              </div>
              {selectedEvent.description && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-sm font-medium text-right">Descripción:</p>
                  <p className="col-span-3">{selectedEvent.description}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCloseEventDialog} 
                variant="secondary" 
                className="w-full"
              >
                Cerrar
              </Button>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => {
                  // Navigate to related entity
                  const path = selectedEvent.entityType === "client" 
                    ? `/clients/${selectedEvent.entityId}` 
                    : `/debtors/${selectedEvent.entityId}`;
                  window.location.href = path;
                }}
              >
                Ver {selectedEvent.entityType === "client" ? "Cliente" : "Deudor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}

function CalendarGrid({ 
  currentDate, 
  events, 
  onEventClick 
}: { 
  currentDate: Date; 
  events: Event[]; 
  onEventClick: (event: Event) => void;
}) {
  // Get days in month and determine the first day of the month
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // Create an array for all days in the calendar view
  const calendarDays = [];
  
  // Days from previous month to fill the first week
  const startDay = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Handle Sundays (startDay === 0) by making it appear as day 7
  const adjustedStartDay = startDay === 0 ? 7 : startDay;
  
  // Add days from previous month if needed (to fill first week)
  for (let i = 1; i < adjustedStartDay; i++) {
    const date = new Date(firstDayOfMonth);
    date.setDate(date.getDate() - (adjustedStartDay - i));
    calendarDays.push(date);
  }
  
  // Add days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    calendarDays.push(date);
  }
  
  // Add days from next month if needed (to complete last week)
  const remainingDays = 42 - calendarDays.length; // 6 rows × 7 days = 42
  
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(lastDayOfMonth);
    date.setDate(date.getDate() + i);
    calendarDays.push(date);
  }
  
  // Function to check if a day has events
  const dayHasEvents = (day: Date) => {
    return events.some(event => {
      const eventDate = parseISO(event.date);
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
    });
  };
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
    });
  };

  return (
    <div className="grid grid-cols-7 gap-1 mt-2">
      {/* Weekday headers */}
      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
        <div key={day} className="text-center font-semibold p-2">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {calendarDays.map((day, i) => {
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isCurrentDay = isToday(day);
        const dayEvents = getEventsForDay(day);
        
        return (
          <div
            key={i}
            className={`
              min-h-24 border p-1 relative
              ${isCurrentMonth ? "bg-card" : "bg-muted/40 text-muted-foreground"}
              ${isCurrentDay ? "ring-2 ring-primary ring-offset-2" : ""}
            `}
          >
            <div className="text-right p-1">{format(day, "d")}</div>
            
            {dayEvents.length > 0 && (
              <div className="overflow-y-auto max-h-20 space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id}
                    className="text-xs p-1 truncate rounded cursor-pointer bg-primary/10 hover:bg-primary/20"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-center">
                      <EventBadge type={event.type} className="mr-1" />
                      <span className="truncate">{event.title}</span>
                    </div>
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EventBadge({ type, className = "" }: { type: string; className?: string }) {
  const badgeClass = `${className} inline-flex items-center rounded-full border px-1 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`;
  
  switch (type) {
    case "visit":
      return <span className={`${badgeClass} border-blue-500 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20`}>Visita</span>;
    case "call":
      return <span className={`${badgeClass} border-green-500 bg-green-500/10 text-green-600 hover:bg-green-500/20`}>Llamada</span>;
    case "meeting":
      return <span className={`${badgeClass} border-purple-500 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20`}>Reunión</span>;
    case "payment":
      return <span className={`${badgeClass} border-green-500 bg-green-500/10 text-green-600 hover:bg-green-500/20`}>Pago</span>;
    case "deadline":
      return <span className={`${badgeClass} border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20`}>Vencimiento</span>;
    case "follow-up":
      return <span className={`${badgeClass} border-orange-500 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20`}>Seguimiento</span>;
    default:
      return <span className={`${badgeClass} border-gray-500 bg-gray-500/10 text-gray-600 hover:bg-gray-500/20`}>{type}</span>;
  }
}