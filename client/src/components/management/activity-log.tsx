import { useState } from "react";
import { 
  Phone, 
  CircleDot, 
  CreditCard, 
  FileCheck, 
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

// Interfaces para los tipos de actividades
interface Activity {
  id: number;
  type: 'call' | 'visit' | 'payment' | 'document';
  title: string;
  description: string;
  date: string;
  time: string;
  status?: string;
}

interface ActivityLogProps {
  activities: Activity[];
  isLoading: boolean;
}

export function ActivityLog({ activities, isLoading }: ActivityLogProps) {
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

  // Función para obtener el icono según el tipo de actividad
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-5 w-5 text-blue-500" />;
      case 'visit':
        return <CircleDot className="h-5 w-5 text-amber-500" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      case 'document':
        return <FileCheck className="h-5 w-5 text-purple-500" />;
      default:
        return <CircleDot className="h-5 w-5 text-gray-500" />;
    }
  };

  // Función para obtener la clase de color según el tipo de actividad
  const getActivityColorClass = (type: string) => {
    switch (type) {
      case 'call':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'visit':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'payment':
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 'document':
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Mock data para el ejemplo
  const mockActivities: Activity[] = [
    {
      id: 1,
      type: 'call',
      title: 'Llamada a Transportes Veloz',
      description: 'Se contactó al responsable para gestionar el pago pendiente. Promete pago parcial para la próxima semana.',
      date: '2023-06-15',
      time: '10:30',
      status: 'Promesa de pago'
    },
    {
      id: 2,
      type: 'visit',
      title: 'Visita a Comercializadora La Huerta',
      description: 'Visita presencial para entregar documentación. Se programó reunión con el gerente financiero.',
      date: '2023-06-14',
      time: '15:45',
      status: 'Visita realizada'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Pago recibido de Juan Pérez',
      description: 'Se registró un pago parcial de $5,000.00 MXN correspondiente a la factura F-2023-156.',
      date: '2023-06-13',
      time: '09:15',
      status: 'Pago parcial'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: es });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-4 space-y-2 w-full">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayActivities.map((activity) => (
        <div 
          key={activity.id} 
          className={cn(
            "border rounded-lg p-4 transition-all",
            expandedActivity === activity.id ? "shadow-md" : ""
          )}
        >
          <div className="flex items-start">
            <div className="bg-white p-2 rounded-full border shadow-sm">
              {getActivityIcon(activity.type)}
            </div>
            <div className="ml-4 flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900">{activity.title}</h3>
                <div>
                  <span className="text-sm text-gray-500">
                    {formatDate(activity.date)} {activity.time}
                  </span>
                </div>
              </div>
              
              {expandedActivity === activity.id && (
                <p className="text-gray-600 mt-2">{activity.description}</p>
              )}
              
              <div className="flex justify-between items-center mt-2">
                {activity.status && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full border",
                    getActivityColorClass(activity.type)
                  )}>
                    {activity.status}
                  </span>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setExpandedActivity(
                      expandedActivity === activity.id ? null : activity.id
                    )}
                  >
                    {expandedActivity === activity.id ? "Menos" : "Más"} 
                    <ChevronRight className={cn(
                      "h-4 w-4 ml-1 transition-transform",
                      expandedActivity === activity.id ? "rotate-90" : ""
                    )} />
                  </Button>
                  <Button variant="outline" size="sm">
                    Detalles
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center mt-6">
        <Button variant="outline">
          Cargar más actividades
        </Button>
      </div>
    </div>
  );
}