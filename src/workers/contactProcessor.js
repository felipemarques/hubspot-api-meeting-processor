const { getHubspotClient, refreshAccessToken, getExpirationDate } = require('./hubspotClient');
const { generateLastModifiedDateFilter, filterNullValuesFromObject } = require('../utils/utils');

/**
 * Processa contatos (contacts) da HubSpot.
 */
async function processContacts(domain, hubId, q) {
  const account = domain.integrations.hubspot.accounts.find(acc => acc.hubId === hubId);
  const lastPulledDate = new Date(account.lastPulledDates.contacts);
  const now = new Date();
  const hubspotClient = getHubspotClient();

  let hasMore = true;
  const offsetObject = {};
  const limit = 100;

  while (hasMore) {
    const filter = generateLastModifiedDateFilter(lastPulledDate, now, 'lastmodifieddate');

    try {
      const result = await hubspotClient.crm.contacts.searchApi.doSearch({
        filterGroups: [filter],
        sorts: [{ propertyName: 'lastmodifieddate', direction: 'ASCENDING' }],
        properties: ['firstname', 'lastname', 'email'],
        limit,
        after: offsetObject.after,
      });

      const contacts = result.results || [];
      contacts.forEach(contact => {
        q.push({
          actionName: 'Contact Updated',
          actionDate: new Date(contact.updatedAt),
          userProperties: filterNullValuesFromObject({
            contact_name: `${contact.properties.firstname} ${contact.properties.lastname}`,
            contact_email: contact.properties.email,
          }),
        });
      });

      offsetObject.after = result.paging?.next?.after;
      hasMore = !!offsetObject.after;
    } catch (error) {
      if (new Date() > getExpirationDate()) await refreshAccessToken(domain, hubId);
      throw error;
    }
  }

  account.lastPulledDates.contacts = now;
}

module.exports = { processContacts };
