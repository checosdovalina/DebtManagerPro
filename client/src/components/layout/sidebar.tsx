import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Building2, Users, ClipboardList, BarChart,
  FileText, Settings, LogOut, ChevronDown, ChevronUp, Gavel,
  UserCheck, List, Menu, X, Wallet, Calculator, Bell, Shield,
  AlarmClock, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { GlobalSearch } from "./global-search";
import { NotificationsBell } from "./notifications-bell";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon, isActive, onClick }) => (
  <li className="mb-1">
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer transition-colors",
          isActive && "bg-gray-700 text-white"
        )}
      >
        <div className="w-5 h-5 mr-3 shrink-0">{icon}</div>
        <span className="text-sm">{label}</span>
      </div>
    </Link>
  </li>
);

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Administrador",
  admin: "Administrador",
  director: "Director",
  executive: "Ejecutivo Comercial",
  manager: "Gerente de Cobranza",
  collector: "Gestor de Cobranza",
};

export const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDebtorsOpen, setIsDebtorsOpen] = useState(location.includes("/debtors"));
  const [isAdminOpen, setIsAdminOpen] = useState(location.includes("/users"));

  const closeDrawer = () => setIsDrawerOpen(false);

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const isAdmin = ["superadmin", "admin", "director"].includes(user?.role || "");

  const bottomNavItems = [
    { href: "/dashboard", label: "Inicio", icon: <LayoutDashboard className="h-5 w-5" />, match: (l: string) => l === "/" || l === "/dashboard" },
    { href: "/clients", label: "Clientes", icon: <Building2 className="h-5 w-5" />, match: (l: string) => l.startsWith("/clients") },
    { href: "/debtors", label: "Deudores", icon: <Users className="h-5 w-5" />, match: (l: string) => l.startsWith("/debtors") },
    { href: "/seguimientos", label: "Seguimientos", icon: <AlarmClock className="h-5 w-5" />, match: (l: string) => l === "/seguimientos" },
  ];

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-64 bg-gray-800 text-white flex-col h-screen sticky top-0 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DCS" className="h-8" />
            <h1 className="text-xl font-bold tracking-tight">DCS</h1>
          </div>
          <NotificationsBell />
        </div>

        <div className="px-3 py-2 border-b border-gray-700 shrink-0">
          <GlobalSearch />
        </div>

        <div className="px-4 py-3 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-primary-600 font-semibold text-sm">
              {user?.fullName ? getInitials(user.fullName) : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{ROLE_LABELS[user?.role || ""] || "Usuario"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul>
            <NavItem href="/dashboard" label="Dashboard"
              icon={<LayoutDashboard className="h-5 w-5" />}
              isActive={location === "/" || location === "/dashboard"} />
            <NavItem href="/clients" label="Clientes"
              icon={<Building2 className="h-5 w-5" />}
              isActive={location.startsWith("/clients")} />
            <li className="mb-1">
              <button
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors",
                  location.startsWith("/debtors") && "bg-gray-700 text-white"
                )}
                onClick={() => setIsDebtorsOpen(v => !v)}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3" />
                  <span className="text-sm">Deudores</span>
                </div>
                {isDebtorsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isDebtorsOpen && (
                <ul className="ml-5 mt-1 space-y-0.5">
                  {[
                    { href: "/debtors", label: "Todos los deudores", icon: <List className="h-4 w-4" /> },
                    { href: "/debtors?assigned=true", label: "Mis asignaciones", icon: <UserCheck className="h-4 w-4" /> },
                    { href: "/debtors?status=in_litigation", label: "Estado judicial", icon: <Gavel className="h-4 w-4" /> },
                  ].map(item => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <div className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer text-sm transition-colors">
                          <span className="mr-2 shrink-0">{item.icon}</span>
                          {item.label}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <NavItem href="/management" label="Gestión y Seguimiento"
              icon={<ClipboardList className="h-5 w-5" />}
              isActive={location.startsWith("/management")} />
            <NavItem href="/seguimientos" label="Seguimientos Pendientes"
              icon={<AlarmClock className="h-5 w-5" />}
              isActive={location === "/seguimientos"} />
            <NavItem href="/reports/analytics" label="Reportes"
              icon={<BarChart className="h-5 w-5" />}
              isActive={location.startsWith("/reports")} />
            <NavItem href="/reportes" label="Reportes y Exportación"
              icon={<BarChart className="h-5 w-5" />}
              isActive={location === "/reportes"} />
            <NavItem href="/calculadora" label="Calculadora"
              icon={<Calculator className="h-5 w-5" />}
              isActive={location === "/calculadora"} />
            <NavItem href="/importacion" label="Importación Masiva"
              icon={<FileText className="h-5 w-5" />}
              isActive={location === "/importacion"} />
            {isAdmin && (
              <li className="mb-1">
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors",
                    isAdminOpen && "bg-gray-700 text-white"
                  )}
                  onClick={() => setIsAdminOpen(v => !v)}
                >
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-3" />
                    <span className="text-sm">Administración</span>
                  </div>
                  {isAdminOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isAdminOpen && (
                  <ul className="ml-5 mt-1 space-y-0.5">
                    <li>
                      <Link href="/users">
                        <div className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer text-sm transition-colors">
                          <Shield className="h-4 w-4 mr-2" /> Usuarios y Roles
                        </div>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={logout}
            className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ===== MOBILE: BACKDROP + DRAWER ===== */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={closeDrawer}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full z-50 w-72 bg-gray-800 text-white flex flex-col transition-transform duration-300 ease-in-out md:hidden",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700 shrink-0"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DCS" className="h-8" />
            <h1 className="text-xl font-bold tracking-tight">DCS</h1>
          </div>
          <button className="text-gray-400 hover:text-white p-1" onClick={closeDrawer}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-primary-600 font-semibold text-sm">
              {user?.fullName ? getInitials(user.fullName) : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{ROLE_LABELS[user?.role || ""] || "Usuario"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul>
            <NavItem href="/dashboard" label="Dashboard"
              icon={<LayoutDashboard className="h-5 w-5" />}
              isActive={location === "/" || location === "/dashboard"}
              onClick={closeDrawer} />
            <NavItem href="/clients" label="Clientes"
              icon={<Building2 className="h-5 w-5" />}
              isActive={location.startsWith("/clients")}
              onClick={closeDrawer} />
            <li className="mb-1">
              <button
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors",
                  location.startsWith("/debtors") && "bg-gray-700 text-white"
                )}
                onClick={() => setIsDebtorsOpen(v => !v)}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3" />
                  <span className="text-sm">Deudores</span>
                </div>
                {isDebtorsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isDebtorsOpen && (
                <ul className="ml-5 mt-1 space-y-0.5">
                  {[
                    { href: "/debtors", label: "Todos los deudores", icon: <List className="h-4 w-4" /> },
                    { href: "/debtors?assigned=true", label: "Mis asignaciones", icon: <UserCheck className="h-4 w-4" /> },
                    { href: "/debtors?status=in_litigation", label: "Estado judicial", icon: <Gavel className="h-4 w-4" /> },
                  ].map(item => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <div onClick={closeDrawer}
                          className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer text-sm transition-colors">
                          <span className="mr-2 shrink-0">{item.icon}</span>
                          {item.label}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <NavItem href="/management" label="Gestión y Seguimiento"
              icon={<ClipboardList className="h-5 w-5" />}
              isActive={location.startsWith("/management")}
              onClick={closeDrawer} />
            <NavItem href="/seguimientos" label="Seguimientos Pendientes"
              icon={<AlarmClock className="h-5 w-5" />}
              isActive={location === "/seguimientos"}
              onClick={closeDrawer} />
            <NavItem href="/reports/analytics" label="Reportes"
              icon={<BarChart className="h-5 w-5" />}
              isActive={location.startsWith("/reports")}
              onClick={closeDrawer} />
            <NavItem href="/reportes" label="Reportes y Exportación"
              icon={<BarChart className="h-5 w-5" />}
              isActive={location === "/reportes"}
              onClick={closeDrawer} />
            <NavItem href="/calculadora" label="Calculadora"
              icon={<Calculator className="h-5 w-5" />}
              isActive={location === "/calculadora"}
              onClick={closeDrawer} />
            <NavItem href="/importacion" label="Importación Masiva"
              icon={<FileText className="h-5 w-5" />}
              isActive={location === "/importacion"}
              onClick={closeDrawer} />
            {isAdmin && (
              <li className="mb-1">
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors",
                    isAdminOpen && "bg-gray-700 text-white"
                  )}
                  onClick={() => setIsAdminOpen(v => !v)}
                >
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-3" />
                    <span className="text-sm">Administración</span>
                  </div>
                  {isAdminOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {isAdminOpen && (
                  <ul className="ml-5 mt-1 space-y-0.5">
                    <li>
                      <Link href="/users">
                        <div onClick={closeDrawer}
                          className="flex items-center px-4 py-2.5 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer text-sm transition-colors">
                          <Shield className="h-4 w-4 mr-2" /> Usuarios y Roles
                        </div>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700 shrink-0"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <button
            onClick={() => { logout(); closeDrawer(); }}
            className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors w-full py-2"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ===== MOBILE: BOTTOM NAV BAR ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-gray-800 border-t border-gray-700 md:hidden flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {bottomNavItems.map(item => {
          const active = item.match(location);
          return (
            <Link key={item.href} href={item.href}>
              <div
                data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-1 min-w-0 flex-1 cursor-pointer transition-colors",
                  active ? "text-white" : "text-gray-400"
                )}
                style={{ minWidth: 0, flex: 1, width: "calc((100vw - 56px) / 4)" }}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-xl transition-colors",
                  active && "bg-primary-600"
                )}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium leading-none truncate w-full text-center">{item.label}</span>
              </div>
            </Link>
          );
        })}

        {/* Más → abre drawer */}
        <button
          data-testid="bottom-nav-mas"
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-2 px-1 text-gray-400 hover:text-white transition-colors"
          style={{ minWidth: 0, flex: 1 }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl">
            <MoreHorizontal className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium leading-none">Más</span>
        </button>
      </nav>
    </>
  );
};
