
import admin from 'firebase-admin';

// Initialize with environment credentials (should be present in Cloud Workstations)
if (!admin.apps.length) {
  admin.initializeApp();
}

async function verifyBackend() {
  try {
    const authConfig = await admin.auth().projectConfigManager().getProjectConfig();
    console.log("--- PROJECT CONFIG ---");
    console.log("Project ID:", process.env.GOOGLE_CLOUD_PROJECT || "Not set in env");
    console.log("Authorized Domains:", authConfig.authorizedDomains);
    
    // Check if Google is in the list of default IdPs
    // This is a bit indirect with Admin SDK, but we can check if it's been configured
    console.log("--- IDENTITY PROVIDERS ---");
    // List all IdPs
    const providers = await admin.auth().listProviderConfigs({ type: 'oidc' });
    console.log("OIDC Providers count:", providers.providerConfigs.length);
    
    const samlProviders = await admin.auth().listProviderConfigs({ type: 'saml' });
    console.log("SAML Providers count:", samlProviders.providerConfigs.length);

    console.log("--- GOOGLE SIGN-IN STATUS ---");
    // Check for Google specifically
    try {
        const googleConfig = await admin.auth().getProviderConfig('google.com');
        console.log("Google Provider Config FOUND:", JSON.stringify(googleConfig));
    } catch (e: any) {
        console.log("Google Provider Config specifically not found via getProviderConfig:", e.message);
    }

  } catch (error: any) {
    console.error("Verification failed:", error.message);
  }
}

verifyBackend();
