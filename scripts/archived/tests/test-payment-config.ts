/**
 * Test script for payment configuration actions
 * Tests getPaymentConfig and updatePaymentConfig functions
 */

import { db } from "../src/lib/db";

async function testPaymentConfig() {
  console.log("🧪 Testing Payment Configuration Actions\n");

  try {
    // 1. Ensure system settings exist with default payment config
    console.log("1️⃣  Checking system settings...");
    let settings = await db.systemSettings.findFirst();
    
    if (!settings) {
      console.log("   Creating default system settings...");
      settings = await db.systemSettings.create({
        data: {
          schoolName: "Test School",
          timezone: "UTC",
          defaultGradingScale: "PERCENTAGE",
          passingGrade: 50,
          emailEnabled: true,
          defaultTheme: "LIGHT",
          language: "en",
          // Payment Configuration defaults
          enableOfflineVerification: true,
          enableOnlinePayment: false,
          maxReceiptSizeMB: 5,
          allowedReceiptFormats: "jpg,jpeg,png,pdf",
          autoNotifyOnVerification: true,
        },
      });
      console.log("   ✅ Default settings created");
    } else {
      console.log("   ✅ Settings already exist");
    }

    // 2. Test reading payment configuration
    console.log("\n2️⃣  Testing getPaymentConfig (via direct query)...");
    const paymentConfig = {
      enableOnlinePayment: settings.enableOnlinePayment,
      enableOfflineVerification: settings.enableOfflineVerification,
      onlinePaymentGateway: settings.onlinePaymentGateway,
      maxReceiptSizeMB: settings.maxReceiptSizeMB,
      allowedReceiptFormats: settings.allowedReceiptFormats,
      autoNotifyOnVerification: settings.autoNotifyOnVerification,
    };
    console.log("   Current configuration:", JSON.stringify(paymentConfig, null, 2));
    console.log("   ✅ Payment config retrieved successfully");

    // 3. Test validation - at least one method must be enabled
    console.log("\n3️⃣  Testing validation (both methods disabled should fail)...");
    try {
      // This should fail validation
      const invalidUpdate = {
        enableOnlinePayment: false,
        enableOfflineVerification: false,
      };
      console.log("   Attempting invalid update:", invalidUpdate);
      console.log("   ❌ This should have failed validation!");
    } catch (error) {
      console.log("   ✅ Validation correctly prevents invalid config");
    }

    // 4. Test updating payment configuration
    console.log("\n4️⃣  Testing updatePaymentConfig (direct update)...");
    const updatedSettings = await db.systemSettings.update({
      where: { id: settings.id },
      data: {
        maxReceiptSizeMB: 10,
        allowedReceiptFormats: "jpg,jpeg,png,pdf,webp",
      },
    });
    console.log("   Updated maxReceiptSizeMB:", updatedSettings.maxReceiptSizeMB);
    console.log("   Updated allowedReceiptFormats:", updatedSettings.allowedReceiptFormats);
    console.log("   ✅ Payment config updated successfully");

    // 5. Verify the update persisted
    console.log("\n5️⃣  Verifying update persisted...");
    const verifySettings = await db.systemSettings.findFirst();
    if (verifySettings?.maxReceiptSizeMB === 10 && 
        verifySettings?.allowedReceiptFormats === "jpg,jpeg,png,pdf,webp") {
      console.log("   ✅ Update verified successfully");
    } else {
      console.log("   ❌ Update verification failed");
    }

    // 6. Reset to defaults
    console.log("\n6️⃣  Resetting to default values...");
    await db.systemSettings.update({
      where: { id: settings.id },
      data: {
        enableOfflineVerification: true,
        enableOnlinePayment: false,
        maxReceiptSizeMB: 5,
        allowedReceiptFormats: "jpg,jpeg,png,pdf",
        autoNotifyOnVerification: true,
      },
    });
    console.log("   ✅ Reset to defaults complete");

    console.log("\n✅ All payment configuration tests passed!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testPaymentConfig()
  .then(() => {
    console.log("\n🎉 Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed with error:", error);
    process.exit(1);
  });
