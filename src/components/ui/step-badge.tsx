import type { ReactNode } from "react";

export interface StepBadgeProps {
  children: ReactNode;
}

export default function StepBadge({ children }: StepBadgeProps) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
      {children}
    </span>
  );
}