import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, isToday, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, MessageSquare, MapPin, Mail, Clock, AlertTriangle, CheckCircle, Calendar, ArrowRight, Search, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const contactTypeIcon = (type: string) => {
  switch (type) {
    case "phone": return <Phone className="h-4 w-4" />;
    case "whatsapp": return <MessageSquare className="h-4 w-4" />;
    case "visit": return <MapPin className="h-4 w-4" />;
    case "email": return <Mail className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const contactTypeName = (type: string) => {
  const map: Record<string, string> = {
    phone: "Llamada", whatsapp: "WhatsApp", visit: "Visita", email: "Email", other: "Otro"
  };
  return map[type] || type;
};

interface Followup {
  id: number;
  debtorId: number;
  debtorName: string;
  nextAction: string;
  nextActionDate: string;
  contactType: string;
  result: string;
  isOverdue: boolean;
  isToday: boolean;
  userId: number;
}

export default function SeguimientosPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const { data: followups = [], isLoading } = useQuery<Followup[]>({
    queryKey: ["/api/followups/pending"],
  });

  const filtered = followups.filter(f => {
    if (search && !f.debtorName.toLowerCase().includes(search.toLowerCase()) && !f.nextAction?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && f.contactType !== typeFilter) return false;
    if (myTasksOnly && f.userId !== user?.id) return false;
    return true;
  });

  const overdue = filtered.filter(f => f.isOverdue);
  const dueToday = filtered.filter(f => f.isToday);
  const upcoming = filtered.filter(f => !f.isOverdue && !f.isToday);

  const stats = {
    total: followups.length,
    overdue: followups.filter(f => f.isOverdue).length,
    today: followups.filter(f => f.isToday).length,
    upcoming: followups.filter(f => !f.isOverdue && !f.isToday).length,
  };

  const renderCard = (f: Followup) => (
    <Card
      key={f.id}
      className={f.isOverdue ? "border-red-300 hover:border-red-400" : f.isToday ? "border-blue-300 hover:border-blue-400" : "hover:border-gray-300"}
      data-testid={`followup-card-${f.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                className="font-semibold text-gray-900 hover:text-primary cursor-pointer transition-colors"
                data-testid={`text-debtor-${f.id}`}
                onClick={() => window.location.href = `/debtors/${f.debtorId}`}
              >
                {f.debtorName}
              </span>
              {f.isOverdue && (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />Vencido
                </Badge>
              )}
              {f.isToday && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />Hoy
                </Badge>
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-gray-50 text-gray-600 border-gray-200`}>
                {contactTypeIcon(f.contactType)}
                {contactTypeName(f.contactType)}
              </span>
            </div>

            {f.nextAction && (
              <p className="text-sm text-gray-700 leading-snug">{f.nextAction}</p>
            )}

            <p className="text-xs text-gray-400 mt-1">
              {f.nextActionDate
                ? format(parseISO(f.nextActionDate), "EEEE d 'de' MMMM", { locale: es })
                : "Fecha no definida"
              }
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs"
            data-testid={`btn-go-debtor-${f.id}`}
            onClick={() => window.location.href = `/debtors/${f.debtorId}?tab=activity`}
          >
            Ver deudor
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Seguimientos Pendientes">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seguimientos Pendientes</h1>
          <p className="text-sm text-gray-500 mt-1">Acciones de gestión programadas y vencidas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, icon: <Clock className="h-5 w-5 text-gray-400" />, color: "text-gray-700" },
            { label: "Vencidos", value: stats.overdue, icon: <AlertTriangle className="h-5 w-5 text-red-400" />, color: "text-red-600" },
            { label: "Para hoy", value: stats.today, icon: <Calendar className="h-5 w-5 text-blue-400" />, color: "text-blue-600" },
            { label: "Próximos", value: stats.upcoming, icon: <CheckCircle className="h-5 w-5 text-green-400" />, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Buscar deudor o acción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-followups"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44" data-testid="select-type-filter">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Tipo de gestión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="phone">Llamada</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="visit">Visita</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={myTasksOnly ? "default" : "outline"}
            onClick={() => setMyTasksOnly(v => !v)}
            className="shrink-0"
            data-testid="btn-my-tasks"
          >
            {myTasksOnly ? "Mis tareas" : "Todos"}
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-3" />
              <p className="font-medium text-gray-700">
                {followups.length === 0 ? "¡Sin seguimientos pendientes!" : "No hay resultados con estos filtros"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {followups.length === 0 ? "Registra actividades con fecha de próxima acción para verlas aquí." : "Intenta cambiar los filtros de búsqueda."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overdue">
            <TabsList className="mb-4">
              <TabsTrigger value="overdue" className="relative">
                Vencidos
                {overdue.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5">{overdue.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="today">
                Hoy
                {dueToday.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-1.5">{dueToday.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">Próximos ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="all">Todos ({filtered.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overdue" className="space-y-3">
              {overdue.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No hay seguimientos vencidos</div>
              ) : overdue.map(renderCard)}
            </TabsContent>

            <TabsContent value="today" className="space-y-3">
              {dueToday.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No hay seguimientos para hoy</div>
              ) : dueToday.map(renderCard)}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-3">
              {upcoming.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No hay seguimientos próximos</div>
              ) : upcoming.map(renderCard)}
            </TabsContent>

            <TabsContent value="all" className="space-y-3">
              {filtered.map(renderCard)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
