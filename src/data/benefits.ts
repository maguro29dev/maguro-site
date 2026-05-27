import type { MembershipBenefit } from "@/lib/data";

/**
 * メンバーシップ特典一覧
 * tier: "全プラン共通" | "中トロ以上" | "大トロ限定"
 * isNew: 新しく追加された特典は true にする (1週間程度で false に戻す)
 */
export const membershipBenefits: MembershipBenefit[] = [
  // --- 全プラン共通 ---
  {
    title: "限定動画全部入り再生リスト",
    tier: "全プラン共通",
    url: "https://www.youtube.com/playlist?list=UUMOMP7QuS4suoONg47Nbi-wrg",
    isNew: false,
  },
  {
    title: "Discord「まぐ兄弟の場所」",
    tier: "全プラン共通",
    url: "https://discord.gg/YabfK2buHm",
    isNew: false,
  },
  {
    title: "メンバーイベント憲章※必読",
    tier: "全プラン共通",
    url: "https://docs.google.com/document/d/1aVax0d8e4TWdn173e9HilPREfg9BatMigU34dTgbRHs/edit?usp=sharing",
    isNew: false,
  },

  {
    title: "まぐラジ",
    tier: "全プラン共通",
    url: "https://www.youtube.com/playlist?list=PL5rEiNRr-t0kfXHOm-a9C7ksN7A6FQtvN",
    isNew: false,
  },

  // --- 中トロ以上 ---
  {
    title: "限定ショート動画",
    tier: "中トロ以上",
    url: "https://www.youtube.com/playlist?list=PL5rEiNRr-t0kHgOa0AN985MkPrCLg9CXW",
    isNew: false,
  },
  {
    title: "まぐ家日常投稿チラ見せ",
    tier: "中トロ以上",
    url: "https://www.youtube.com/@%E3%82%B2%E3%83%BC%E3%83%A0%E3%81%BE%E3%81%90%E3%81%AB%E3%81%83/posts",
    isNew: false,
  },
  {
    title: "オフ会のご案内",
    tier: "中トロ以上",
    url: "/membership/#member-events",
    isNew: false,
  },

  // --- 大トロ限定 ---
  {
    title: "オンラインオフ会/リアルキャンプ",
    tier: "大トロ限定",
    url: "/membership/#member-events",
    isNew: false,
  },
  {
    title: "まぐ家毎日日常投稿",
    tier: "大トロ限定",
    url: "https://www.youtube.com/@%E3%82%B2%E3%83%BC%E3%83%A0%E3%81%BE%E3%81%90%E3%81%AB%E3%81%83/posts",
    isNew: false,
  },
  {
    title: "殿堂やクレジットへの表記について",
    tier: "大トロ限定",
    url: "https://www.youtube.com/post/UgkxuqjCpfvhz2hR_rnvmSmk8l-fF-rVc7A0",
    isNew: false,
  },
];
