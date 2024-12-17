const Domain = require('../domain/entities/Domain');
const { refreshAccessToken } = require('./hubspotClient');
const { processCompanies } = require('./companyProcessor');
const { processContacts } = require('./contactProcessor');
const { createQueue } = require('./queueManager');
const { processMeetings } = require('./meetingProcessor');
const drainQueue = require('./drainQueue');
const { saveActions } = require('../utils/utils');

async function pullDataFromHubspot() {
  const domain = await Domain.findOne({});

  for (const account of domain.integrations.hubspot.accounts) {
    const actions = [];
    const q = createQueue(actions);

    try {
      await refreshAccessToken(domain, account.hubId);
      await processContacts(domain, account.hubId, q);
      await processCompanies(domain, account.hubId, q);
      await processMeetings(domain, account.hubId, q);
      await drainQueue(domain, actions, q);
      await saveActions(domain);
    } catch (error) {
      console.error('Error processing data:', error.message);
    }

    console.log('Finished processing account:', account.hubId);
  }

  // I dont understand very well why exit the process 
  // because we have in the original code express implementation without any routes
  // to reorganize and use the express at this moment I commented this.
  // process.exit();
}

module.exports = pullDataFromHubspot;
