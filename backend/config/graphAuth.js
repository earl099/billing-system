import { ConfidentialClientApplication } from '@azure/msal-node'

const cca = new ConfidentialClientApplication({
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET
    }
})

export async function getGraphToken() {
    let cachedToken = null
    let tokenExpiry = 0
    const now = Date.now()

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