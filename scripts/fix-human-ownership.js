// This script manually fixes the human.ctc listing ownership
// Run this to sync the marketplace with blockchain ownership

console.log("🔧 Manual fix for human.ctc listing ownership");
console.log("");
console.log("📋 Current situation:");
console.log("   Blockchain owner: 0xcc78505FE8707a1D85229BA0E7177aE26cE0f17D");
console.log("   Listing seller:   0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123");
console.log("");
console.log("🔧 To fix this, run the following SQL in Supabase:");
console.log("");
console.log("UPDATE marketplace_listings");
console.log("SET seller_address = '0xcc78505fe8707a1d85229ba0e7177ae26ce0f17d',");
console.log("    updated_at = NOW()");
console.log("WHERE id IN (");
console.log("  SELECT ml.id FROM marketplace_listings ml");
console.log("  JOIN domains d ON ml.domain_id = d.id");
console.log("  WHERE d.name = 'human' AND ml.status = 'active'");
console.log(");");
console.log("");
console.log("✅ After running this SQL:");
console.log("   - human.ctc will show as 'Listed' in the new owner's profile");
console.log("   - Marketplace will show correct ownership");
console.log("   - Transfer system will work properly for future transfers");

async function main() {
  console.log("\n🚀 Alternative: Use the frontend transfer system");
  console.log("   1. Connect with the current owner (0x7119...)");
  console.log("   2. Transfer human.ctc to the correct owner (0xcc78...)");
  console.log("   3. The transfer will automatically update marketplace ownership");
}

main().catch(console.error);