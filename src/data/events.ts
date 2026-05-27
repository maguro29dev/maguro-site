import type { MemberEvent, EventReport } from "@/lib/data";

/**
 * 開催予定のメンバーイベント
 * status: "募集中" | "募集終了"
 */
export const currentEvents: MemberEvent[] = [
  {
    title: "【大トロメンバー限定】第4回オンラインオフ会 開催のお知らせ！",
    status: "募集中",
    eventDate: "6/20(土) 20:00〜",
    location: "Google Meet",
    contentSummary: "完全におしゃべり会！家族で参加します！",
    eligibility: "お申し込み時点で「大トロ」にご加入中の方",
    applicationDeadline: "全員いつでも参加と退出OK",
    applicationLink: "https://www.youtube.com/post/UgkxE28Rjz47RzRIU-Wj8E9b3HnVFk1WfLIL",
    description: "6/20(土) 20:00〜 大トロメンバー限定の「オンラインオフ会 #4」を開催します！Google Meetでの開催予定です。開催時間内は出入り自由なので、途中参加・途中退出でも大丈夫です。少しだけの参加でもお気軽にどうぞ！参加方法や詳細は、YouTubeのメンバー専用投稿をご確認ください。",
  },
];

/**
 * 過去のイベントレポート
 * date: YYYY-MM-DD 形式
 * report: HTMLまたはプレーンテキスト
 */
export const eventReports: EventReport[] = [];
