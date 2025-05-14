import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  UserPlus, 
  DollarSign, 
  FileText, 
  Phone, 
  Gavel,
  Circle,
  ArrowRight
} from "lucide-react";
import { ContactType, ActivityLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface EnhancedActivityLog extends ActivityLog {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  debtor: {
    id: number;
    name: string;
  };
}

interface ActivityFeedProps {
  activities: EnhancedActivityLog[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const [, navigate] = useLocation();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "client_created":
        return <UserPlus className="h-4 w-4 text-white" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-white" />;
      case "report":
        return <FileText className="h-4 w-4 text-white" />;
      case "phone":
        return <Phone className="h-4 w-4 text-white" />;
      case "whatsapp":
        return <Phone className="h-4 w-4 text-white" />;
      case "litigation":
        return <Gavel className="h-4 w-4 text-white" />;
      default:
        return <Circle className="h-4 w-4 text-white" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "client_created":
        return "bg-blue-500";
      case "payment":
        return "bg-green-500";
      case "report":
        return "bg-primary-500";
      case "phone":
      case "whatsapp":
        return "bg-yellow-500";
      case "litigation":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getActivityDescription = (activity: EnhancedActivityLog) => {
    const contactType = activity.contactType as ContactType;
    
    switch (contactType) {
      case "phone":
        return `Llamada a ${activity.debtor.name}`;
      case "whatsapp":
        return `Mensaje WhatsApp a ${activity.debtor.name}`;
      case "visit":
        return `Visita a ${activity.debtor.name}`;
      case "email":
        return `Correo a ${activity.debtor.name}`;
      default:
        return `Contacto con ${activity.debtor.name}`;
    }
  };

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: es 
    });
  };

  const handleActivityClick = (debtorId: number) => {
    navigate(`/debtors/${debtorId}`);
  };

  const handleViewAllClick = () => {
    navigate("/reports");
  };

  return (
    <Card>
      <CardHeader className="pb-2 border-b border-gray-200">
        <CardTitle className="text-lg font-medium">Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-2">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {index < activities.length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityBgColor(
                          activity.contactType
                        )}`}
                      >
                        {getActivityIcon(activity.contactType)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div className="text-sm text-gray-500">
                        {getActivityDescription(activity)}{" "}
                        <button 
                          onClick={() => handleActivityClick(activity.debtor.id)}
                          className="inline-block font-medium text-gray-900 hover:text-primary-600 cursor-pointer"
                        >
                          {activity.result}
                        </button>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {getTimeAgo(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-200 px-6 py-4">
        <button 
          onClick={handleViewAllClick}
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 cursor-pointer"
        >
          Ver todas las actividades 
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </CardFooter>
    </Card>
  );
};
