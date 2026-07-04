export interface LiveBadgeProps {
  label?: string;
}

export default function LiveBadge({ label = "Em andamento" }: LiveBadgeProps) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      {label}
    </span>
  );
}
