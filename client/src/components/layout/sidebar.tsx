import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Building2, Users, ClipboardList, BarChart,
  FileText, Settings, LogOut, ChevronDown, ChevronUp, Gavel,
  UserCheck, List, Menu, X, Wallet, Calculator, Bell, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./global-search";

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
          "flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer transition-colors",
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDebtorsOpen, setIsDebtorsOpen] = useState(location.includes("/debtors"));
  const [isAdminOpen, setIsAdminOpen] = useState(location.includes("/users"));

  const closeMobile = () => setIsMobileSidebarOpen(false);

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const isAdmin = ["superadmin", "admin", "director"].includes(user?.role || "");

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Button
          onClick={() => setIsMobileSidebarOpen(v => !v)}
          size="icon"
          className="bg-primary-600 text-white rounded-full shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <aside className={cn(
        "w-full md:w-64 bg-gray-800 text-white flex flex-col md:h-screen md:sticky md:top-0 overflow-hidden",
        isMobileSidebarOpen ? "fixed inset-0 z-50" : "hidden md:flex"
      )}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DCS" className="h-8" />
            <h1 className="text-xl font-bold tracking-tight">DCS</h1>
          </div>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={closeMobile}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-700 shrink-0">
          <GlobalSearch />
        </div>

        {/* User profile */}
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul>
            <NavItem href="/dashboard" label="Dashboard"
              icon={<LayoutDashboard className="h-5 w-5" />}
              isActive={location === "/" || location === "/dashboard"}
              onClick={closeMobile} />

            <NavItem href="/clients" label="Clientes"
              icon={<Building2 className="h-5 w-5" />}
              isActive={location.startsWith("/clients")}
              onClick={closeMobile} />

            {/* Deudores dropdown */}
            <li className="mb-1">
              <button
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors",
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
                        <div onClick={closeMobile}
                          className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer text-sm transition-colors">
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
              onClick={closeMobile} />

            <NavItem href="/reports/analytics" label="Reportes"
              icon={<BarChart className="h-5 w-5" />}
              isActive={location.startsWith("/reports")}
              onClick={closeMobile} />

            <NavItem href="/calculadora" label="Calculadora"
              icon={<Calculator className="h-5 w-5" />}
              isActive={location === "/calculadora"}
              onClick={closeMobile} />

            <NavItem href="/documents" label="Documentos"
              icon={<FileText className="h-5 w-5" />}
              isActive={location === "/documents"}
              onClick={closeMobile} />

            {/* Administración dropdown (solo admins) */}
            {isAdmin && (
              <li className="mb-1">
                <button
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors",
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
                        <div onClick={closeMobile}
                          className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md cursor-pointer text-sm transition-colors">
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

        {/* Logout */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={() => { logout(); closeMobile(); }}
            className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};
