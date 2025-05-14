import React from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-xl font-medium text-gray-800">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 overflow-x-hidden bg-gray-50">
        <Navbar title={title} />
        
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
        
        <Footer />
      </main>
    </div>
  );
};
