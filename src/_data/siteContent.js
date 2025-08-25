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
    const mainPlans = await client.getEntries({ content_type: 'mainPlan', 'fields.archive[ne]': true, order: 'fields.order' });
    const collabPlans = await client.getEntries({ content_type: 'collabPlan', 'fields.archive[ne]': true, order: 'fields.order' });
    
    // ▼▼▼【変更】並び順を'date'から'sys.createdAt'に変更 ▼▼▼
    const archivedMainPlans = await client.getEntries({ content_type: 'mainPlan', 'fields.archive': true, order: '-sys.createdAt' });
    const archivedCollabPlans = await client.getEntries({ content_type: 'collabPlan', 'fields.archive': true, order: '-sys.createdAt' });

    const members = await client.getEntries({ content_type: 'member', order: 'fields.order' });
    const eventReports = await client.getEntries({ content_type: 'eventReport', order: '-fields.date' });
    const weeklySchedule = await client.getEntries({ content_type: 'weeklySchedule', order: 'fields.order' });
    const settings = await client.getEntries({ content_type: 'siteSettings', limit: 1 });
    const currentEvents = await client.getEntries({ 
        content_type: 'currentEvent', 
        'fields.status[in]': '募集中,募集終了',
        order: 'fields.order' 
    });
    const realEvents = await client.getEntries({ content_type: 'realEvent', order: 'fields.order' });
    const membershipBenefits = await client.getEntries({ content_type: 'membershipBenefit', order: 'fields.order' });

    console.log("Data fetched successfully!");

    return {
      mainPlans: mainPlans.items,
      collabPlans: collabPlans.items,
      archivedPlans: [...archivedMainPlans.items, ...archivedCollabPlans.items],
      members: members.items,
      eventReports: eventReports.items,
      weeklySchedule: weeklySchedule.items,
      settings: settings.items[0],
      currentEvents: currentEvents.items,
      realEvents: realEvents.items,
      membershipBenefits: membershipBenefits.items,
    };
  } catch (error) {
    console.error("Error fetching Contentful data:", error.message);
    return {};
  }
};