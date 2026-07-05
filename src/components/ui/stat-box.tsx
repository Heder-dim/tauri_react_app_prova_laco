export type StatBoxTone = "blue" | "purple" | "green" | "amber";

const TONE_CLASSES: Record<StatBoxTone, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
};

export interface StatBoxProps {
  value: number | string;
  label: string;
  tone?: StatBoxTone;
}

export default function StatBox({ value, label, tone = "blue" }: StatBoxProps) {
  const { bg, text } = TONE_CLASSES[tone];

  return (
    <div className={`flex-1 rounded-xl px-4 py-3 ${bg}`}>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}