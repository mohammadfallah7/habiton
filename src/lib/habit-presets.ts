import type { Frequency } from "@/lib/habit-logic";

export const EMOJIS = [
  "💧", "📚", "🏃", "🧘", "💪", "😴", "✍️", "🥗",
  "🚶", "🎧", "🧹", "💊", "🌱", "🎨", "☀️", "🦷",
];

export const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#14b8a6", "#0ea5e9",
];

export const UNITS = ["بار", "لیوان", "دقیقه", "صفحه", "ساعت", "کیلومتر"];

export interface HabitPreset {
  title: string;
  emoji: string;
  color: string;
  frequency: Frequency;
  target: number;
  unit: string;
}

export const TEMPLATES: HabitPreset[] = [
  { title: "نوشیدن آب", emoji: "💧", color: "#0ea5e9", frequency: "DAILY", target: 8, unit: "لیوان" },
  { title: "مطالعه", emoji: "📚", color: "#8b5cf6", frequency: "DAILY", target: 20, unit: "صفحه" },
  { title: "ورزش", emoji: "🏃", color: "#10b981", frequency: "WEEKLY", target: 3, unit: "بار" },
  { title: "مدیتیشن", emoji: "🧘", color: "#ec4899", frequency: "DAILY", target: 10, unit: "دقیقه" },
];
