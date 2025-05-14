import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Users, Phone, Briefcase, CreditCard } from "lucide-react";

interface Event {
  id: number;
  title: string;
  date: Date;
  type: 'visit' | 'call' | 'meeting' | 'payment' | 'deadline';
  description: string;
  time: string;
  relatedTo?: {
    type: 'client' | 'debtor';
    id: number;
    name: string;
  };
}

export function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
  // Mock events data - en producción vendría de una API
  const events: Event[] = [
    {
      id: 1,
      title: "Reunión con Transportes Veloz",
      date: new Date(2023, 5, 15),
      type: "meeting",
      description: "Discutir plan de pagos",
      time: "10:30",
      relatedTo: {
        type: "client",
        id: 1,
        name: "Transportes Veloz"
      }
    },
    {
      id: 2,
      title: "Visita a La Huerta",
      date: new Date(2023, 5, 14),
      type: "visit",
      description: "Entrega de documentación",
      time: "15:45",
      relatedTo: {
        type: "client",
        id: 2,
        name: "Comercializadora La Huerta"
      }
    },
    {
      id: 3,
      title: "Llamada con Juan Pérez",
      date: new Date(2023, 5, 13),
      type: "call",
      description: "Seguimiento de pago",
      time: "09:15",
      relatedTo: {
        type: "debtor",
        id: 1,
        name: "Juan Pérez"
      }
    }
  ];

  // Filtrar eventos para el día seleccionado
  const selectedDateEvents = events.filter(event => 
    isSameDay(event.date, date)
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return <Users className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Briefcase className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'visit':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'call':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'meeting':
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 'payment':
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 'deadline':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Función para verificar si un día tiene eventos (para mostrar en el calendario)
  const dayHasEvents = (day: Date) => {
    return events.some(event => isSameDay(event.date, day));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-medium">Calendario de Actividades</h2>
          <p className="text-gray-500">Visualiza y gestiona tus actividades programadas</p>
        </div>
        <div className="flex space-x-2">
          <Select value={view} onValueChange={(value: any) => setView(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Día</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Hoy</Button>
          <div className="flex">
            <Button variant="outline" size="icon" className="rounded-r-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-l-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                locale={es}
                modifiers={{
                  hasEvents: (date) => dayHasEvents(date),
                }}
                modifiersClassNames={{
                  hasEvents: "text-primary has-events"
                }}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Actividades para {format(date, "EEEE dd 'de' MMMM", { locale: es })}</CardTitle>
              <CardDescription>
                {selectedDateEvents.length} actividades programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No hay actividades programadas para este día
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map(event => (
                    <div key={event.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="mt-1">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">{event.title}</p>
                          <span className="text-xs text-gray-500">{event.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                        {event.relatedTo && (
                          <div className="mt-1 flex items-center">
                            <Badge variant="outline" className="text-xs">
                              {event.relatedTo.type === 'client' ? 'Cliente' : 'Deudor'}: {event.relatedTo.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}