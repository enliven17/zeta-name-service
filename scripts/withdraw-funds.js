const { ethers } = require("hardhat");

async function main() {
    const mktAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;
    const nsAddress = process.env.NEXT_PUBLIC_ZETA_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS;
    const recipientAddress = process.env.CONTRACT_OWNER_ADDRESS; // Your wallet address

    console.log("💸 Withdrawing funds from contracts...");
    console.log("Recipient:", recipientAddress);

    // Get contract instances
    const mkt = await ethers.getContractAt("ZetaNameMarketplace", mktAddress);
    const ns = await ethers.getContractAt("ZetaNameService", nsAddress);

    // Check balances before withdrawal
    const provider = ethers.provider;
    const mktBalanceBefore = await provider.getBalance(mktAddress);
    const nsBalanceBefore = await provider.getBalance(nsAddress);
    const walletBalanceBefore = await provider.getBalance(recipientAddress);

    console.log(`\n📊 BEFORE WITHDRAWAL:`);
    console.log(`Marketplace: ${ethers.formatEther(mktBalanceBefore)} tCTC`);
    console.log(`NameService: ${ethers.formatEther(nsBalanceBefore)} tCTC`);
    console.log(`Your Wallet: ${ethers.formatEther(walletBalanceBefore)} tCTC`);

    try {
        // Withdraw from Marketplace
        if (parseFloat(ethers.formatEther(mktBalanceBefore)) > 0) {
            console.log(`\n💰 Withdrawing from Marketplace...`);
            const mktTx = await mkt.withdraw(recipientAddress);
            await mktTx.wait();
            console.log(`✅ Marketplace withdrawal successful: ${mktTx.hash}`);
        }

        // Withdraw from NameService
        if (parseFloat(ethers.formatEther(nsBalanceBefore)) > 0) {
            console.log(`\n💰 Withdrawing from NameService...`);
            const nsTx = await ns.withdraw(recipientAddress);
            await nsTx.wait();
            console.log(`✅ NameService withdrawal successful: ${nsTx.hash}`);
        }

        // Check balances after withdrawal
        const mktBalanceAfter = await provider.getBalance(mktAddress);
        const nsBalanceAfter = await provider.getBalance(nsAddress);
        const walletBalanceAfter = await provider.getBalance(recipientAddress);

        console.log(`\n📊 AFTER WITHDRAWAL:`);
        console.log(`Marketplace: ${ethers.formatEther(mktBalanceAfter)} tCTC`);
        console.log(`NameService: ${ethers.formatEther(nsBalanceAfter)} tCTC`);
        console.log(`Your Wallet: ${ethers.formatEther(walletBalanceAfter)} tCTC`);

        const totalWithdrawn = parseFloat(ethers.formatEther(walletBalanceAfter)) - parseFloat(ethers.formatEther(walletBalanceBefore));
        console.log(`\n🎉 Total Withdrawn: ${totalWithdrawn.toFixed(2)} tCTC`);

    } catch (error) {
        console.error("❌ Withdrawal failed:", error.message);
    }
}

main().catch(console.error);