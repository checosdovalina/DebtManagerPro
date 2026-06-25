import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Phone, MessageSquare, MapPin, Mail, DollarSign,
  CheckCircle2, XCircle, Clock, AlertCircle, FileText, MoreHorizontal
} from "lucide-react";
import { ActivityLog, Visit, Payment } from "@shared/schema";

interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  type: "activity" | "visit" | "payment";
  contactType?: string;
  result?: string;
  title: string;
  description?: string;
  nextAction?: string;
  nextActionDate?: string | null;
  amount?: number;
}

interface Props {
  debtorId: number;
}

const contactTypeIcon = (type: string) => {
  switch (type) {
    case "phone": return <Phone className="h-4 w-4" />;
    case "whatsapp": return <MessageSquare className="h-4 w-4" />;
    case "visit": return <MapPin className="h-4 w-4" />;
    case "email": return <Mail className="h-4 w-4" />;
    default: return <MoreHorizontal className="h-4 w-4" />;
  }
};

const contactTypeName = (type: string) => {
  const map: Record<string, string> = {
    phone: "Llamada", whatsapp: "WhatsApp", visit: "Visita", email: "Email", other: "Otro"
  };
  return map[type] || type;
};

const resultConfig = (result: string): { label: string; className: string; icon: React.ReactNode } => {
  switch (result) {
    case "located": return { label: "Localizado", className: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> };
    case "not_located": return { label: "No localizado", className: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> };
    case "promise": return { label: "Promesa de pago", className: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3" /> };
    case "refused": return { label: "Se negó", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <AlertCircle className="h-3 w-3" /> };
    case "partial_payment": return { label: "Pago parcial", className: "bg-indigo-100 text-indigo-700 border-indigo-200", icon: <DollarSign className="h-3 w-3" /> };
    case "full_payment": return { label: "Pago completo", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <DollarSign className="h-3 w-3" /> };
    default: return { label: "Otro", className: "bg-gray-100 text-gray-600 border-gray-200", icon: <MoreHorizontal className="h-3 w-3" /> };
  }
};

const dotColor = (type: string, result?: string) => {
  if (type === "payment") return "bg-emerald-500 border-emerald-600";
  if (type === "visit") return "bg-purple-500 border-purple-600";
  if (result === "promise") return "bg-blue-500 border-blue-600";
  if (result === "not_located") return "bg-red-400 border-red-500";
  if (result === "full_payment" || result === "partial_payment") return "bg-emerald-500 border-emerald-600";
  return "bg-primary border-primary/80";
};

const formatDateLabel = (dateStr: string) => {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Hoy";
    if (isYesterday(d)) return "Ayer";
    return format(d, "EEEE, d 'de' MMMM yyyy", { locale: es });
  } catch { return dateStr; }
};

export function InteractionTimeline({ debtorId }: Props) {
  const { data: activities = [], isLoading: loadingAct } = useQuery<ActivityLog[]>({
    queryKey: [`/api/debtors/${debtorId}/activity`],
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery<Visit[]>({
    queryKey: [`/api/debtors/${debtorId}/visits`],
  });

  const isLoading = loadingAct || loadingVisits;

  const events: TimelineEvent[] = [
    ...activities.map(a => ({
      id: `activity-${a.id}`,
      date: typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10),
      time: a.time,
      type: "activity" as const,
      contactType: a.contactType,
      result: a.result,
      title: contactTypeName(a.contactType),
      description: a.comments || undefined,
      nextAction: a.nextAction || undefined,
      nextActionDate: a.nextActionDate,
    })),
    ...visits.map(v => ({
      id: `visit-${v.id}`,
      date: typeof v.date === "string" ? v.date.slice(0, 10) : new Date(v.date).toISOString().slice(0, 10),
      time: v.time,
      type: "visit" as const,
      title: "Visita presencial",
      description: v.notes || v.result,
    })),
  ].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`).getTime();
    const db = new Date(`${b.date}T${b.time}`).getTime();
    return db - da;
  });

  const grouped = events.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-700">Sin interacciones registradas</p>
        <p className="text-sm mt-1">Usa "Registrar Actividad" para comenzar el historial.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Línea de tiempo</h2>
        <p className="text-sm text-gray-500">{events.length} interacciones registradas</p>
      </div>

      {sortedDates.map(date => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 capitalize">
              {formatDateLabel(date)}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="space-y-3 relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />

            {grouped[date].map(ev => {
              const rc = ev.result ? resultConfig(ev.result) : null;
              return (
                <div key={ev.id} className="relative" data-testid={`timeline-event-${ev.id}`}>
                  <div className={`absolute -left-5 top-3 h-4 w-4 rounded-full border-2 ${dotColor(ev.type, ev.result)} shadow-sm`} />

                  <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {ev.type === "payment" ? (
                          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-100 text-emerald-600">
                            <DollarSign className="h-4 w-4" />
                          </span>
                        ) : ev.type === "visit" ? (
                          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-purple-100 text-purple-600">
                            <MapPin className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-50 text-blue-600">
                            {contactTypeIcon(ev.contactType || "")}
                          </span>
                        )}
                        <span className="font-medium text-gray-900 text-sm">{ev.title}</span>
                        {rc && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${rc.className}`}>
                            {rc.icon}{rc.label}
                          </span>
                        )}
                        {ev.type === "visit" && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">Visita</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{ev.time}</span>
                    </div>

                    {ev.description && (
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{ev.description}</p>
                    )}

                    {ev.nextAction && (
                      <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-2">
                        <Clock className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-amber-700">Próxima acción: </span>
                          <span className="text-xs text-amber-600">{ev.nextAction}</span>
                          {ev.nextActionDate && (
                            <span className="text-xs text-amber-500 ml-1">
                              ({format(parseISO(ev.nextActionDate), "dd/MM/yyyy", { locale: es })})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
