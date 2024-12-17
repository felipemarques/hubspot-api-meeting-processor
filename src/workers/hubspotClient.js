const hubspot = require('@hubspot/api-client');

let hubspotClient = new hubspot.Client({ accessToken: '' });
let expirationDate = null;

/**
 * Atualiza o token de acesso usando o refresh token.
 */
async function refreshAccessToken(domain, hubId) {
  const { HUBSPOT_CID, HUBSPOT_CS } = process.env;
  const account = domain.integrations.hubspot.accounts.find(acc => acc.hubId === hubId);

  const { accessToken, refreshToken } = account;

  try {
    const result = await hubspotClient.oauth.tokensApi.createToken(
      'refresh_token',
      undefined,
      undefined,
      HUBSPOT_CID,
      HUBSPOT_CS,
      refreshToken
    );

    const body = result.body || result;
    const newAccessToken = body.accessToken;
    expirationDate = new Date(body.expiresIn * 1000 + Date.now());

    hubspotClient.setAccessToken(newAccessToken);
    if (newAccessToken !== accessToken) account.accessToken = newAccessToken;

    return true;
  } catch (error) {
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}

function getHubspotClient() {
  return hubspotClient;
}

function getExpirationDate() {
  return expirationDate;
}

module.exports = { refreshAccessToken, getHubspotClient, getExpirationDate };
