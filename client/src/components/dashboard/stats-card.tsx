import React from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary-600",
  iconBgColor = "bg-primary-50",
}) => {
  return (
    <Card className="p-4 flex items-start">
      <div className={cn("p-3 rounded-full text-lg", iconBgColor, iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </Card>
  );
};
