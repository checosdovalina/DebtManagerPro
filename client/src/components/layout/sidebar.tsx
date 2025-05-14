import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ClipboardList, 
  BarChart, 
  FileText, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronUp,
  Gavel,
  UserCheck,
  List,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon, isActive, onClick }) => {
  return (
    <li className="mb-1">
      <Link href={href}>
        <a
          onClick={onClick}
          className={cn(
            "flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md",
            isActive && "bg-gray-700 text-white"
          )}
        >
          <div className="w-5 h-5 mr-3 text-center">{icon}</div>
          <span>{label}</span>
        </a>
      </Link>
    </li>
  );
};

export const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDebtorsOpen, setIsDebtorsOpen] = useState(location.includes("/debtors"));

  const toggleDebtors = () => {
    setIsDebtorsOpen(!isDebtorsOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // Get initials for the avatar
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Button 
          onClick={toggleMobileSidebar} 
          size="icon" 
          className="bg-primary-600 text-white rounded-full p-3 shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "w-full md:w-64 bg-gray-800 text-white flex flex-col md:h-screen md:sticky md:top-0",
        isMobileSidebarOpen ? "fixed inset-0 z-50" : "hidden md:flex"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <h1 className="text-xl font-bold">DCS</h1>
          <button
            className="block md:hidden text-gray-400 hover:text-white"
            onClick={closeMobileSidebar}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User profile mini */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
              {user?.fullName ? getInitials(user.fullName) : "U"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.role === "manager" ? "Gerente de Cobranza" : 
                user?.role === "admin" ? "Administrador" : 
                user?.role === "executive" ? "Ejecutivo Comercial" : 
                user?.role === "collector" ? "Gestor de Cobranza" : 
                user?.role === "superadmin" ? "Super Administrador" : 
                "Usuario"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            <NavItem
              href="/"
              label="Dashboard"
              icon={<LayoutDashboard className="h-5 w-5" />}
              isActive={location === "/"}
              onClick={closeMobileSidebar}
            />

            <NavItem
              href="/clients"
              label="Clientes"
              icon={<Building2 className="h-5 w-5" />}
              isActive={location.includes("/clients")}
              onClick={closeMobileSidebar}
            />

            {/* Debtors dropdown */}
            <li className="mb-1">
              <button
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md",
                  location.includes("/debtors") && "bg-gray-700 text-white"
                )}
                onClick={toggleDebtors}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3" />
                  <span>Deudores</span>
                </div>
                {isDebtorsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {isDebtorsOpen && (
                <ul className="ml-6 mt-1 space-y-1">
                  <li>
                    <Link href="/debtors">
                      <a
                        onClick={closeMobileSidebar}
                        className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md"
                      >
                        <List className="h-5 w-5 mr-3" />
                        <span>Todos los deudores</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/debtors?assigned=true">
                      <a
                        onClick={closeMobileSidebar}
                        className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md"
                      >
                        <UserCheck className="h-5 w-5 mr-3" />
                        <span>Mis asignaciones</span>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/debtors?status=in_litigation">
                      <a
                        onClick={closeMobileSidebar}
                        className="flex items-center px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md"
                      >
                        <Gavel className="h-5 w-5 mr-3" />
                        <span>Estado judicial</span>
                      </a>
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <NavItem
              href="/reports"
              label="Gestión y seguimiento"
              icon={<ClipboardList className="h-5 w-5" />}
              isActive={location === "/reports"}
              onClick={closeMobileSidebar}
            />

            <NavItem
              href="/reports/analytics"
              label="Reportes"
              icon={<BarChart className="h-5 w-5" />}
              isActive={location === "/reports/analytics"}
              onClick={closeMobileSidebar}
            />

            <NavItem
              href="/documents"
              label="Documentos"
              icon={<FileText className="h-5 w-5" />}
              isActive={location === "/documents"}
              onClick={closeMobileSidebar}
            />

            {(user?.role === "admin" || user?.role === "superadmin") && (
              <NavItem
                href="/users"
                label="Administración"
                icon={<Settings className="h-5 w-5" />}
                isActive={location === "/users"}
                onClick={closeMobileSidebar}
              />
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              logout();
              closeMobileSidebar();
            }}
            className="flex items-center text-gray-300 hover:text-white"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
