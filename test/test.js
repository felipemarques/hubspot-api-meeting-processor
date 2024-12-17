// create at least one test here
const Domain = require('../src/domain/entities/Domain');
const { refreshAccessToken } = require('../src/workers/hubspotClient');
const { processCompanies } = require('../src/workers/companyProcessor');
const { processContacts } = require('../src/workers/contactProcessor');
const { createQueue } = require('../src/workers/queueManager');
const { processMeetings } = require('../src/workers/meetingProcessor');
const drainQueue = require('../src/workers/drainQueue');
const { saveActions } = require('../src/utils/utils');
const pullDataFromHubspot = require('../src/workers/hubspotWorker');

// Mock all the imported modules
jest.mock('../src/domain/entities/Domain');
jest.mock('../src/workers/hubspotClient');
jest.mock('../src/workers/companyProcessor');
jest.mock('../src/workers/contactProcessor');
jest.mock('../src/workers/queueManager');
jest.mock('../src/workers/meetingProcessor');
jest.mock('../src/workers/drainQueue');
jest.mock('../src/utils/utils');

describe('pullDataFromHubspot', () => {
  let mockDomain;
  let mockAccounts;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock domain and accounts
    mockAccounts = [
      { hubId: 'account1' },
      { hubId: 'account2' }
    ];

    mockDomain = {
      integrations: {
        hubspot: {
          accounts: mockAccounts
        }
      }
    };

    // Mock Domain.findOne to return the mock domain
    Domain.findOne.mockResolvedValue(mockDomain);

    // Mock createQueue to return a mock queue
    createQueue.mockReturnValue([]);

    // Mock successful processing of each method
    refreshAccessToken.mockResolvedValue(null);
    processContacts.mockResolvedValue(null);
    processCompanies.mockResolvedValue(null);
    processMeetings.mockResolvedValue(null);
    drainQueue.mockResolvedValue(null);
    saveActions.mockResolvedValue(null);
  });

  it('should process data for all Hubspot accounts', async () => {
    await pullDataFromHubspot();

    // Verify Domain.findOne was called
    expect(Domain.findOne).toHaveBeenCalledWith({});

    // Verify processing methods were called for each account
    expect(refreshAccessToken).toHaveBeenCalledTimes(2);
    expect(processContacts).toHaveBeenCalledTimes(2);
    expect(processCompanies).toHaveBeenCalledTimes(2);
    expect(processMeetings).toHaveBeenCalledTimes(2);
    expect(drainQueue).toHaveBeenCalledTimes(2);
    expect(saveActions).toHaveBeenCalledTimes(2);

    // Verify each method was called with correct arguments
    mockAccounts.forEach((account, index) => {
      expect(refreshAccessToken).toHaveBeenNthCalledWith(index + 1, mockDomain, account.hubId);
      expect(processContacts).toHaveBeenNthCalledWith(index + 1, mockDomain, account.hubId, expect.any(Array));
      expect(processCompanies).toHaveBeenNthCalledWith(index + 1, mockDomain, account.hubId, expect.any(Array));
      expect(processMeetings).toHaveBeenNthCalledWith(index + 1, mockDomain, account.hubId, expect.any(Array));
      expect(drainQueue).toHaveBeenNthCalledWith(index + 1, mockDomain, expect.any(Array), expect.any(Array));
      expect(saveActions).toHaveBeenNthCalledWith(index + 1, mockDomain);
    });
  });

  it('should handle errors for individual accounts without stopping entire process', async () => {
    // Mock console.error to prevent cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Make first account processing fail
    refreshAccessToken.mockImplementationOnce(() => {
      throw new Error('Token refresh failed');
    });

    await pullDataFromHubspot();

    // Verify that error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing data:', 
      'Token refresh failed'
    );

    // Verify that processing continues for second account
    expect(refreshAccessToken).toHaveBeenCalledTimes(2);
    expect(processContacts).toHaveBeenCalledTimes(1);
    expect(processCompanies).toHaveBeenCalledTimes(1);
    expect(processMeetings).toHaveBeenCalledTimes(1);

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should create a queue for each account', async () => {
    await pullDataFromHubspot();

    // Verify createQueue was called twice (once per account)
    expect(createQueue).toHaveBeenCalledTimes(2);
    expect(createQueue).toHaveBeenCalledWith(expect.any(Array));
  });
});