import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex", className)}>
      <ol className="flex items-center space-x-1 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-1 h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
            )}
            
            {index === 0 && item.label === "Inicio" && (
              <Link href={item.href}>
                <a className={cn(
                  "flex items-center text-gray-500 hover:text-gray-700",
                  item.active && "text-primary font-medium"
                )}>
                  <Home className="h-4 w-4 mr-1" />
                  <span className="sr-only">Inicio</span>
                </a>
              </Link>
            )}
            
            {(index > 0 || item.label !== "Inicio") && (
              <Link href={item.href}>
                <a className={cn(
                  "text-gray-500 hover:text-gray-700",
                  item.active && "text-primary font-medium"
                )}>
                  {item.label}
                </a>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
