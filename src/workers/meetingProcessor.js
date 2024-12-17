const moment = require("moment");
const { getHubspotClient, getExpirationDate, refreshAccessToken } = require('./hubspotClient');
const { generateLastModifiedDateFilter, filterNullValuesFromObject } = require('../utils/utils');

async function processMeetings(domain, hubId, q) {
    const account = domain.integrations.hubspot.accounts.find(acc => acc.hubId === hubId);

    if (!account.lastPulledDates.meetings) {
      account.lastPulledDates.meetings = moment()
        .subtract(4, "year")
        .toISOString();
    }
  
    const lastPulledDate = new Date(account.lastPulledDates.meetings);
    const now = new Date();
    const hubspotClient = getHubspotClient();
  
    let hasMore = true;
    const offsetObject = {};
    const limit = 100;
  
    while (hasMore) {
      const lastModifiedDate = offsetObject.lastModifiedDate || lastPulledDate;
      const lastModifiedDateFilter = generateLastModifiedDateFilter(
        lastModifiedDate,
        now
      );
      const searchObject = {
        filterGroups: [lastModifiedDateFilter],
        sorts: [{ propertyName: "hs_lastmodifieddate", direction: "ASCENDING" }],
        properties: [
          "hs_title",
          "hs_meeting_start_time",
          "hs_meeting_end_time",
          "hs_meeting_body",
          "hs_created_by",
          "hs_meeting_outcome",
        ],
        limit,
        after: offsetObject.after,
      };
  
      let searchResult = {};
  
      let tryCount = 0;
      while (tryCount <= 4) {
        try {
          searchResult =
            await hubspotClient.crm.objects.meetings.searchApi.doSearch(
              searchObject
            );
          break;
        } catch (err) {
            if (new Date() > getExpirationDate()) await refreshAccessToken(domain, hubId);
            throw Error(err)

        }
      }
  
      if (!searchResult)
        throw new Error("Failed to fetch meetings for the 4th time. Aborting.");
      const data = searchResult?.results || [];
      offsetObject.after = parseInt(searchResult?.paging?.next?.after);
  
      const meetingIds = data.map((meeting) => meeting.id);
      const attendeesResults =
        (
          await (
            await hubspotClient.apiRequest({
              method: "post",
              path: "/crm/v3/associations/MEETINGS/CONTACTS/batch/read",
              body: {
                inputs: meetingIds.map((meetingId) => ({ id: meetingId })),
              },
            })
          ).json()
        )?.results || [];

        const meetingAttendees = {};
      attendeesResults.forEach((result) => {
        if (result.from && result.to && result.to.length > 0) {
          meetingAttendees[result.from.id] = result.to.map(
            (contact) => contact.id
          );
        }
      });
  
      const contactDetails = {};
      for (const contactId of Object.values(meetingAttendees).flat()) {
        try {
          const contactResult = await hubspotClient.crm.contacts.basicApi.getById(
            contactId,
            ["email"]
          );
          contactDetails[contactId] = contactResult.properties.email;
        } catch (err) {
          console.error(
            `Failed to fetch contact details for ID ${contactId}:`,
            err
          );
        }
      }
  
      data.forEach((meeting) => {
        if (!meeting.properties) return;
  
        const attendeeEmails = (meetingAttendees[meeting.id] || [])
          .map((contactId) => contactDetails[contactId])
          .filter(Boolean);
  
        const isCreated =
          !lastPulledDate || new Date(meeting.createdAt) > lastPulledDate;
  
        const meetingProperties = {
          meeting_id: meeting.id,
          meeting_title: meeting.properties.hs_title,
          meeting_start_time: meeting.properties.hs_meeting_start_time,
          meeting_end_time: meeting.properties.hs_meeting_end_time,
          meeting_body: meeting.properties.hs_meeting_body,
          meeting_outcome: meeting.properties.hs_meeting_outcome,
        };
  
        const actionTemplate = {
          includeInAnalytics: 0,
          meetingProperties: filterNullValuesFromObject(meetingProperties),
          identities: attendeeEmails,
        };
  
        q.push({
          actionName: isCreated ? "Meeting Created" : "Meeting Updated",
          actionDate:
            new Date(isCreated ? meeting.createdAt : meeting.updatedAt) - 2000,
          ...actionTemplate,
        });
      });
  
      if (!offsetObject?.after) {
        hasMore = false;
        break;
      } else if (offsetObject?.after >= 9900) {
        offsetObject.after = 0;
        offsetObject.lastModifiedDate = new Date(
          data[data.length - 1].updatedAt
        ).valueOf();
      }
    }
  
    account.lastPulledDates.meetings = now;
  
  };
  
module.exports = { processMeetings };