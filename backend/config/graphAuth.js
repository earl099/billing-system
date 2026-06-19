/**
 * @fileoverview Microsoft Graph API authentication module using MSAL
 * Provides token acquisition with caching for Microsoft Graph API access
 */

import { ConfidentialClientApplication } from '@azure/msal-node'

/**
 * MSAL confidential client application instance
 * Configured with Azure AD credentials for client credential flow
 */
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET
    }
})

/** @type {string|null} Cached access token for Microsoft Graph API */
let cachedToken = null
/** @type {number} Token expiration timestamp in milliseconds */
let tokenExpiry = 0

/**
 * Acquires a Microsoft Graph API access token
 * Returns cached token if still valid (with 5-minute buffer before expiry)
 * 
 * @returns {Promise<string>} Access token for Microsoft Graph API
 * @throws {Error} If token acquisition fails
 */
export async function getGraphToken() {
    const now = Date.now()

    // Return cached token if still valid (5-minute buffer)
    if(cachedToken && now < tokenExpiry - 300000) {
        return cachedToken
    }

    const result = await cca.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default']
    })

    if(!result?.accessToken) {
        throw new Error('Failed to acquire Microsoft Graph token')
    }

    cachedToken = result.accessToken
    tokenExpiry = result.expiresOn.getTime()

    return cachedToken
}
