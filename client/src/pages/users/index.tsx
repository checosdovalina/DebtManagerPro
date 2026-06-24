import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/common/avatar";
import { User, USER_ROLES } from "@shared/schema";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus, PencilLine, Lock, Trash2, CheckCircle2, XCircle,
  ShieldCheck, Users, Eye, EyeOff, Info,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── ROLE CONFIG ──────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; level: number; description: string }> = {
  superadmin: { label: "Super Admin",        color: "bg-purple-100 text-purple-800 border-purple-200", level: 6, description: "Acceso completo al sistema, sin restricciones" },
  admin:      { label: "Administrador",       color: "bg-blue-100 text-blue-800 border-blue-200",      level: 5, description: "Gestión de usuarios, clientes y configuración" },
  director:   { label: "Director",            color: "bg-indigo-100 text-indigo-800 border-indigo-200", level: 4, description: "Vista de reportes y métricas ejecutivas" },
  manager:    { label: "Gerente Cobranza",    color: "bg-cyan-100 text-cyan-800 border-cyan-200",      level: 3, description: "Asigna deudores, supervisa gestores" },
  executive:  { label: "Ejecutivo Comercial", color: "bg-teal-100 text-teal-800 border-teal-200",      level: 2, description: "Gestión de clientes y cartera asignada" },
  collector:  { label: "Gestor Cobranza",     color: "bg-gray-100 text-gray-800 border-gray-200",      level: 1, description: "Gestión y seguimiento de deudores asignados" },
};

// Permissions matrix per role
const PERMISSIONS: Record<string, Record<string, boolean>> = {
  superadmin: { clients_view: true, clients_edit: true, debtors_view: true, debtors_edit: true, debtors_delete: true, payments: true, reports: true, users_manage: true, import: true, export: true, litigation: true, settings: true },
  admin:      { clients_view: true, clients_edit: true, debtors_view: true, debtors_edit: true, debtors_delete: true, payments: true, reports: true, users_manage: true, import: true, export: true, litigation: true, settings: false },
  director:   { clients_view: true, clients_edit: false, debtors_view: true, debtors_edit: false, debtors_delete: false, payments: false, reports: true, users_manage: false, import: false, export: true, litigation: true, settings: false },
  manager:    { clients_view: true, clients_edit: false, debtors_view: true, debtors_edit: true, debtors_delete: false, payments: true, reports: true, users_manage: false, import: true, export: true, litigation: true, settings: false },
  executive:  { clients_view: true, clients_edit: true, debtors_view: true, debtors_edit: true, debtors_delete: false, payments: false, reports: false, users_manage: false, import: false, export: false, litigation: false, settings: false },
  collector:  { clients_view: false, clients_edit: false, debtors_view: true, debtors_edit: true, debtors_delete: false, payments: true, reports: false, users_manage: false, import: false, export: false, litigation: false, settings: false },
};

const PERM_LABELS: Record<string, string> = {
  clients_view:   "Ver clientes",
  clients_edit:   "Editar clientes",
  debtors_view:   "Ver deudores",
  debtors_edit:   "Editar deudores",
  debtors_delete: "Eliminar deudores",
  payments:       "Registrar pagos",
  reports:        "Acceso a reportes",
  users_manage:   "Gestionar usuarios",
  import:         "Importación masiva",
  export:         "Exportar datos",
  litigation:     "Gestión judicial",
  settings:       "Configuración del sistema",
};

// ─── FORM SCHEMA ──────────────────────────────────────────────────────────────
const userFormSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  role: z.string().min(1, "El rol es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleView, setSelectedRoleView] = useState<string>("collector");

  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { fullName: "", email: "", phone: "", role: USER_ROLES.COLLECTOR, password: "", active: true },
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema.extend({ password: z.string().optional() })),
    defaultValues: { fullName: "", email: "", phone: "", role: USER_ROLES.COLLECTOR, password: "", active: true },
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormValues) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      toast({ title: "Usuario creado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Error al crear usuario", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserFormValues> & { id: number }) =>
      apiRequest("PUT", `/api/users/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Usuario actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditUser(null);
    },
    onError: (e: any) => toast({ title: "Error al actualizar", description: e.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (u: User) => apiRequest("PUT", `/api/users/${u.id}`, { active: !u.active }),
    onSuccess: (_, u) => {
      toast({ title: u.active ? "Usuario desactivado" : "Usuario activado" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  function openEdit(u: User) {
    setEditUser(u);
    editForm.reset({ fullName: u.fullName, email: u.email, phone: u.phone ?? "", role: u.role, password: "", active: u.active });
  }

  const canManage = ["superadmin", "admin"].includes(currentUser?.role ?? "");

  // Group users by role
  const usersByRole = Object.keys(ROLE_META).reduce((acc, role) => {
    acc[role] = users.filter(u => u.role === role);
    return acc;
  }, {} as Record<string, User[]>);

  return (
    <Layout title="Usuarios y Roles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios y Roles</h1>
            <p className="text-sm text-gray-500 mt-1">{users.length} usuarios registrados en el sistema</p>
          </div>
          {canManage && (
            <Button onClick={() => setIsAddUserOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nuevo Usuario
            </Button>
          )}
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Usuarios</TabsTrigger>
            <TabsTrigger value="roles"><ShieldCheck className="h-4 w-4 mr-2" />Roles y Permisos</TabsTrigger>
          </TabsList>

          {/* ── USERS TAB ── */}
          <TabsContent value="users" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12 text-gray-400">Cargando...</div>
            ) : (
              <div className="grid gap-3">
                {users.map(u => {
                  const meta = ROLE_META[u.role] ?? ROLE_META.collector;
                  return (
                    <Card key={u.id} className={cn("transition-shadow hover:shadow-md", !u.active && "opacity-60")}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <Avatar name={u.fullName} personType="individual" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900">{u.fullName}</p>
                              <Badge variant="outline" className={cn("text-xs", meta.color)}>{meta.label}</Badge>
                              {!u.active && <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">Inactivo</Badge>}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Último acceso: {u.lastLogin ? format(new Date(u.lastLogin), "dd/MM/yyyy HH:mm", { locale: es }) : "Nunca"}
                            </p>
                          </div>
                          {canManage && u.id !== currentUser?.id && (
                            <div className="flex gap-1.5 shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                                    <PencilLine className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"
                                    onClick={() => toggleActiveMutation.mutate(u)}>
                                    {u.active
                                      ? <XCircle className="h-4 w-4 text-red-500" />
                                      : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{u.active ? "Desactivar" : "Activar"}</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── ROLES & PERMISSIONS TAB ── */}
          <TabsContent value="roles">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Role selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-3">Selecciona un rol para ver sus permisos</p>
                {Object.entries(ROLE_META).map(([roleKey, meta]) => (
                  <button
                    key={roleKey}
                    onClick={() => setSelectedRoleView(roleKey)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-all",
                      selectedRoleView === roleKey ? "border-primary-400 bg-primary-50 shadow-sm" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{meta.label}</span>
                      <Badge variant="outline" className={cn("text-xs", meta.color)}>
                        {usersByRole[roleKey]?.length ?? 0} usuarios
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{meta.description}</p>
                  </button>
                ))}
              </div>

              {/* Permissions grid */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-5 w-5 text-primary-600" />
                      Permisos: {ROLE_META[selectedRoleView]?.label}
                    </CardTitle>
                    <CardDescription>{ROLE_META[selectedRoleView]?.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(PERM_LABELS).map(([permKey, permLabel]) => {
                        const hasPermission = PERMISSIONS[selectedRoleView]?.[permKey] ?? false;
                        return (
                          <div
                            key={permKey}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 border",
                              hasPermission ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            )}
                          >
                            {hasPermission
                              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              : <XCircle className="h-4 w-4 text-gray-300 shrink-0" />}
                            <span className={cn("text-sm", hasPermission ? "text-green-900 font-medium" : "text-gray-400")}>
                              {permLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Users with this role */}
                    {(usersByRole[selectedRoleView]?.length ?? 0) > 0 && (
                      <div className="mt-5 pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" /> Usuarios con este rol
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {usersByRole[selectedRoleView].map(u => (
                            <div key={u.id} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                              <Avatar name={u.fullName} personType="individual" size="sm" />
                              <span className="text-xs font-medium">{u.fullName}</span>
                              {!u.active && <Badge variant="outline" className="text-[10px] py-0 px-1 bg-red-50 text-red-500 border-red-200">Inactivo</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                      <p>Los permisos están definidos por el rol y no pueden modificarse individualmente. Para cambiar los permisos de un usuario, cambia su rol.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── CREATE USER DIALOG ── */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input placeholder="Juan García López" {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Correo electrónico</FormLabel>
                    <FormControl><Input type="email" placeholder="usuario@dcs.com" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel>
                    <FormControl><Input placeholder="8441234567" {...field} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_META).filter(([k]) => k !== "superadmin").map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} {...field} />
                        <button type="button" className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(v => !v)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage /></FormItem>
                )} />
              </div>
              {form.watch("role") && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <ShieldCheck className="inline h-4 w-4 mr-1 text-primary-500" />
                  {ROLE_META[form.watch("role")]?.description}
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Guardando..." : "Crear Usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT USER DIALOG ── */}
      <Dialog open={!!editUser} onOpenChange={v => { if (!v) setEditUser(null); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario — {editUser?.fullName}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(d => editUser && updateMutation.mutate({ ...d, id: editUser.id }))} className="space-y-4">
              <FormField control={editForm.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Correo</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel>
                    <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={editForm.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(ROLE_META).filter(([k]) => k !== "superadmin").map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="active" render={({ field }) => (
                  <FormItem className="flex flex-col justify-end pb-1">
                    <FormLabel>Estado</FormLabel>
                    <div className="flex items-center gap-2 mt-1">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm text-gray-600">{field.value ? "Activo" : "Inactivo"}</span>
                    </div>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
