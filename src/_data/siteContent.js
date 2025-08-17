// src/_data/siteContent.js

const contentful = require('contentful');

const client = contentful.createClient({
  space: process.env.CTF_SPACE_ID,
  accessToken: process.env.CTF_ACCESS_TOKEN,
});

module.exports = async function () {
  if (!process.env.CTF_SPACE_ID || !process.env.CTF_ACCESS_TOKEN) {
    console.warn("Contentful API keys are not set. Skipping fetch.");
    return {};
  }
  
  console.log("Fetching data from Contentful...");

  try {
    const mainPlans = await client.getEntries({ content_type: 'mainPlan', order: 'fields.order' });
    const collabPlans = await client.getEntries({ content_type: 'collabPlan' });
    const members = await client.getEntries({ content_type: 'member', order: 'fields.order' });
    const eventReports = await client.getEntries({ content_type: 'eventReport', order: '-fields.date' });
    const weeklySchedule = await client.getEntries({ content_type: 'weeklySchedule', order: 'fields.order' });
    const settings = await client.getEntries({ content_type: 'siteSettings', limit: 1 });
    const currentEvent = await client.getEntries({ content_type: 'currentEvent', 'fields.isActive': true, limit: 1 });
    const realEvents = await client.getEntries({ content_type: 'realEvent', order: 'fields.order' });
    // ▼▼▼【追加】メンバーシップ特典を取得 ▼▼▼
    const membershipBenefits = await client.getEntries({ content_type: 'membershipBenefit', order: 'fields.order' });

    console.log("Data fetched successfully!");

    return {
      mainPlans: mainPlans.items,
      collabPlans: collabPlans.items,
      members: members.items,
      eventReports: eventReports.items,
      weeklySchedule: weeklySchedule.items,
      settings: settings.items[0],
      currentEvent: currentEvent.items[0],
      realEvents: realEvents.items,
      // ▼▼▼【追加】取得したデータを返す ▼▼▼
      membershipBenefits: membershipBenefits.items,
    };
  } catch (error) {
    console.error("Error fetching Contentful data:", error.message);
    return {};
  }
};