
import { checkWhatsAppConfiguration } from "@/lib/services/whatsapp-service";

async function main() {
    console.log("Starting WhatsApp Configuration Verification...");

    // 1. Check Env Vars using the service logic
    const config = checkWhatsAppConfiguration();

    console.log("Configuration Status:");
    console.log(`- Configured: ${config.configured ? '✅ Yes' : '❌ No'}`);
    console.log(`- Access Token Present: ${config.accessToken ? '✅ Yes' : '❌ No'}`);
    console.log(`- Phone Number ID Present: ${config.phoneNumberId ? '✅ Yes' : '❌ No'}`);
    console.log(`- Business Account ID Present: ${config.businessAccountId ? '✅ Yes' : '❌ No'}`);
    console.log(`- App Secret Present: ${config.appSecret ? '✅ Yes' : '❌ No'}`);
    console.log(`- API Version: ${config.apiVersion}`);

    if (!config.configured) {
        console.warn("\n⚠️  Manage WhatsApp integration is NOT fully configured.");
        console.warn("Please add the following to your .env file:");
        if (!config.accessToken) console.warn("  WHATSAPP_ACCESS_TOKEN=...");
        if (!config.phoneNumberId) console.warn("  WHATSAPP_PHONE_NUMBER_ID=...");
        process.exit(1);
    }

    console.log("\n✅ Base configuration found. Logic appears sound.");
    // We won't attempt to send a message here unless explicitly asked with a target number,
    // to avoid spamming or errors if the token is invalid.
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
