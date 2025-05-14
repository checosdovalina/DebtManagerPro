import React from "react";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex justify-between items-center flex-col md:flex-row">
          <div className="text-sm text-gray-500">
            &copy; {currentYear} SisCobra - Sistema de Gestión de Cobranza. Todos los derechos reservados.
          </div>
          <div className="mt-3 md:mt-0 text-sm text-gray-500">
            Versión 1.2.5
          </div>
        </div>
      </div>
    </footer>
  );
};
