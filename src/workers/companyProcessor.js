const { getHubspotClient, getExpirationDate, refreshAccessToken } = require('./hubspotClient');
const { generateLastModifiedDateFilter } = require('../utils/utils');

/**
 * Processa empresas (companies) da HubSpot.
 */
async function processCompanies(domain, hubId, q) {
  const account = domain.integrations.hubspot.accounts.find(acc => acc.hubId === hubId);
  const lastPulledDate = new Date(account.lastPulledDates.companies);
  const now = new Date();
  const hubspotClient = getHubspotClient();

  let hasMore = true;
  const offsetObject = {};
  const limit = 100;

  while (hasMore) {
    const lastModifiedDate = offsetObject.lastModifiedDate || lastPulledDate;
    const filter = generateLastModifiedDateFilter(lastModifiedDate, now);

    try {
      const result = await hubspotClient.crm.companies.searchApi.doSearch({
        filterGroups: [filter],
        sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }],
        properties: ['name', 'domain', 'industry'],
        limit,
        after: offsetObject.after,
      });

      const companies = result.results || [];
      offsetObject.after = result.paging?.next?.after;

      companies.forEach(company => {
        q.push({
          actionName: 'Company Updated',
          actionDate: new Date(company.updatedAt),
          companyProperties: {
            company_id: company.id,
            company_domain: company.properties.domain,
            company_industry: company.properties.industry,
          },
        });
      });

      hasMore = !!offsetObject.after;
    } catch (error) {
      if (new Date() > getExpirationDate()) await refreshAccessToken(domain, hubId);
      throw error;
    }
  }

  account.lastPulledDates.companies = now;
}

module.exports = { processCompanies };
