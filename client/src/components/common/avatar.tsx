import React from "react";
import { cn } from "@/lib/utils";
import { PersonType } from "@shared/schema";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  personType: PersonType;
  size?: AvatarSize;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  personType,
  size = "md",
  className,
}) => {
  // Get the initials of the name (up to 2 characters)
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get background color based on name (consistent for the same name)
  const getBackgroundColor = (name: string, personType: PersonType) => {
    const colors = {
      individual: [
        "bg-blue-100 text-blue-700",
        "bg-green-100 text-green-700",
        "bg-purple-100 text-purple-700",
        "bg-yellow-100 text-yellow-700",
        "bg-indigo-100 text-indigo-700",
        "bg-pink-100 text-pink-700",
        "bg-red-100 text-red-700",
      ],
      company: [
        "bg-primary-100 text-primary-700",
        "bg-amber-100 text-amber-700",
        "bg-emerald-100 text-emerald-700",
        "bg-sky-100 text-sky-700",
        "bg-rose-100 text-rose-700",
        "bg-violet-100 text-violet-700",
        "bg-slate-100 text-slate-700",
      ],
    };

    const colorArray = colors[personType];
    
    // Use name to generate a consistent index
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    const index = sum % colorArray.length;
    return colorArray[index];
  };

  // Get size classes based on size prop
  const getSizeClasses = (size: AvatarSize) => {
    switch (size) {
      case "sm":
        return "h-8 w-8 text-xs";
      case "lg":
        return "h-14 w-14 text-xl";
      case "md":
      default:
        return "h-10 w-10 text-sm";
    }
  };

  const initials = getInitials(name);
  const bgColorClass = getBackgroundColor(name, personType);
  const sizeClass = getSizeClasses(size);

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-full flex items-center justify-center font-semibold",
        bgColorClass,
        sizeClass,
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
};
