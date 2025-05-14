import React from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center space-x-2 text-sm text-gray-500">
        {items.map((item, index) => {
          const key = `breadcrumb-${index}-${item.href}`;
          return (
            <React.Fragment key={key}>
              {index > 0 && (
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                </li>
              )}
              <li>
                {item.active ? (
                  <span className="text-gray-900 font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href}>
                    <span className="hover:text-gray-700 cursor-pointer">{item.label}</span>
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};