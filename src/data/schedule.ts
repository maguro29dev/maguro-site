import type { ScheduleItem, RealEvent } from "@/lib/data";

/**
 * 週間スケジュール
 * Cursorに「スケジュール更新して」と依頼すればここを書き換えます。
 */
export const weeklySchedule: ScheduleItem[] = [
  { day: "月曜日", time: "13:30〜19:00のどこか", plan: "配信" },
  { day: "火曜日", time: "13:30〜19:00のどこか", plan: "配信 & 21:00〜 パーティーアニマルズ" },
  { day: "水曜日", time: "13:30〜19:00のどこか", plan: "配信" },
  { day: "木曜日", time: "13:30〜19:00のどこか", plan: "配信 & 21:00〜 homeクラ夜" },
  { day: "金曜日", time: "13:30〜19:00のどこか", plan: "配信 & 21:00〜 おじくら" },
  { day: "土曜日", time: "13:30〜19:00のどこか", plan: "配信" },
  { day: "日曜日", time: "", plan: "基本お休み" },
];

/**
 * リアルイベント
 */
export const realEvents: RealEvent[] = [
  {
    title: "【大トロメンバー限定】第4回オンラインオフ会",
    date: "6/20(土)",
    url: "/membership/#member-events",
  },
  {
    title: "【リアイベ】まぐにぃの飲みたい人と飲みに行く with じゃじゃーん菊池",
    date: "6/27(土)",
    url: "https://uuum.jp/posts/1063658",
  },
];
