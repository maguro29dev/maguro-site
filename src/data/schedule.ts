import type { ScheduleItem, RealEvent } from "@/lib/data";

/**
 * 週間スケジュールの最終更新日（YYYY-MM-DD）
 * スケジュールを直したら必ず今日の日付に更新してください。
 * 今週の月曜より古いと「更新忘れかも」メッセージが出ます。
 */
export const weeklyScheduleUpdatedAt = "2026-06-29";

/**
 * 週間スケジュール
 * Cursorに「スケジュール更新して」と依頼すればここを書き換えます。
 */
export const weeklySchedule: ScheduleItem[] = [
  { day: "月曜日", time: "13:30〜19:00のどこか", plan: "配信" },
  { day: "火曜日", time: "13:30〜19:00のどこか", plan: "配信 & 21:00〜 homeクラシーズン1最終日" },
  { day: "水曜日", time: "13:30〜19:00のどこか", plan: "配信 & 21:00〜 homeクラシーズン2開始" },
  { day: "木曜日", time: "13:30〜19:00のどこか", plan: "配信 & 21:00〜 コラボ配信" },
  { day: "金曜日", time: "13:30〜19:00のどこか", plan: "配信 & 21:00〜 おじくら" },
  { day: "土曜日", time: "", plan: "基本お休み" },
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
