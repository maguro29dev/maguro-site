/**
 * Data layer for site content.
 * All data is stored in src/data/ as TypeScript files.
 * Cursor can directly edit those files to update content.
 */

// ---- Type exports ----

export interface ScheduleItem {
  day: string;
  time: string;
  plan: string;
}

export interface RealEvent {
  title: string;
  date: string;
  url: string;
}

export interface MembershipBenefit {
  title: string;
  tier: "全プラン共通" | "中トロ以上" | "大トロ限定";
  url: string;
  isNew: boolean;
}

export interface Member {
  name: string;
  thumbnailUrl: string | null;
  url: string | null;
}

export interface MemberEvent {
  title: string;
  status: "募集中" | "募集終了";
  eventDate: string;
  location: string;
  contentSummary: string;
  eligibility: string;
  applicationDeadline: string;
  applicationLink: string;
  description: string;
}

export interface EventReport {
  title: string;
  date: string;
  report: string;
}

// ---- Data imports from src/data/ ----

import { weeklySchedule, realEvents, weeklyScheduleUpdatedAt } from "@/data/schedule";
import { membershipBenefits } from "@/data/benefits";
import { members } from "@/data/members";
import { currentEvents, eventReports } from "@/data/events";
import { siteSettings } from "@/data/site-settings";

// ---- Public API ----

export async function getWeeklySchedule(): Promise<ScheduleItem[]> {
  return weeklySchedule;
}

export async function getWeeklyScheduleUpdatedAt(): Promise<string> {
  return weeklyScheduleUpdatedAt;
}

export async function getRealEvents(): Promise<RealEvent[]> {
  return realEvents;
}

export async function getMembershipBenefits(): Promise<MembershipBenefit[]> {
  return membershipBenefits;
}

export async function getMembers(): Promise<Member[]> {
  return members;
}

export async function getCurrentEvents(): Promise<MemberEvent[]> {
  return currentEvents;
}

export async function getEventReports(): Promise<EventReport[]> {
  return eventReports;
}

export async function getSiteSettings(): Promise<{ totalOtoroMembers: number }> {
  return siteSettings;
}
