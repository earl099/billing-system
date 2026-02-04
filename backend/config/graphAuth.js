import { ConfidentialClientApplication } from '@azure/msal-node'

const cca = new ConfidentialClientApplication({
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET
    }
})

export async function getGraphToken() {
    const result = await cca.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default']
    })
    return result.accessToken
}