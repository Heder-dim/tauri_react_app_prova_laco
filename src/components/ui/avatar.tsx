export type AvatarTone = "blue" | "purple" | "green" | "amber";

const TONE_CLASSES: Record<AvatarTone, string> = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  green: "bg-green-100 text-green-600",
  amber: "bg-amber-100 text-amber-600",
};

export interface AvatarProps {
  initials: string;
  tone?: AvatarTone;
  size?: "sm" | "md";
}

export default function Avatar({ initials, tone = "blue", size = "sm" }: AvatarProps) {
  const sizeClasses = size === "md" ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs";

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${sizeClasses} ${TONE_CLASSES[tone]}`}
    >
      {initials}
    </span>
  );
}
