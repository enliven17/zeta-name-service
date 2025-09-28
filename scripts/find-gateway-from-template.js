const { ethers } = require('hardhat');

async function findGatewayFromTemplate() {
  console.log('🔍 Finding Gateway Address from ZetaChain Template...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // ZetaChain template'den bilinen Gateway adresleri
  const templateGateways = [
    // ZetaChain testnet Gateway adresleri
    "0x2ca7d64A7EFE2D6A9A17Bd4B2B4B2B4B2B4B2B4B2", // Placeholder
    "0x735b14BB79463307AAcBED86DAf3322B1e6226aB", // Protocol address
    "0x7CCE3Eb018bf23e1FE2a32692f2C77592D110394", // Registry address
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Current
    "0x0000000000000000000000000000000000000000", // Zero
  ];

  console.log('🧪 Testing Template Gateway addresses...\n');

  for (let i = 0; i < templateGateways.length; i++) {
    const address = templateGateways[i];
    console.log(`Testing address ${i + 1}/${templateGateways.length}: ${address}`);
    
    try {
      const code = await ethers.provider.getCode(address);
      console.log(`   Code length: ${code.length} bytes`);
      
      if (code === "0x") {
        console.log(`   ❌ Not a contract (EOA)`);
      } else if (code.length < 100) {
        console.log(`   ❌ Too small to be a contract (${code.length} bytes)`);
      } else {
        console.log(`   ✅ Is a contract (${code.length} bytes)`);
        
        // Try to call the contract with different interfaces
        const interfaces = [
          "function call(address,bytes,tuple) external payable",
          "function call(address,bytes) external payable",
          "function execute(address,bytes) external payable",
          "function send(address,bytes) external payable"
        ];
        
        for (const iface of interfaces) {
          try {
            const contract = new ethers.Contract(address, [iface], deployer);
            const funcName = iface.split('(')[0].split(' ')[1];
            
            if (funcName === "call" && iface.includes("tuple")) {
              const revertOptions = {
                revertAddress: deployer.address,
                callOnRevert: false,
                abortAddress: deployer.address,
                revertMessage: ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]),
                onRevertGasLimit: 0
              };
              
              const tx = await contract.call(
                deployer.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]),
                revertOptions,
                { value: 0, gasLimit: 100000 }
              );
              
              console.log(`   ✅ ${funcName} with tuple works! Hash: ${tx.hash}`);
              
            } else if (funcName === "call" && !iface.includes("tuple")) {
              const tx = await contract.call(
                deployer.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]),
                { value: 0, gasLimit: 100000 }
              );
              console.log(`   ✅ ${funcName} without tuple works! Hash: ${tx.hash}`);
              
            } else if (funcName === "execute") {
              const tx = await contract.execute(
                deployer.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]),
                { value: 0, gasLimit: 100000 }
              );
              console.log(`   ✅ ${funcName} works! Hash: ${tx.hash}`);
              
            } else if (funcName === "send") {
              const tx = await contract.send(
                deployer.address,
                ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]),
                { value: 0, gasLimit: 100000 }
              );
              console.log(`   ✅ ${funcName} works! Hash: ${tx.hash}`);
            }
            
          } catch (error) {
            // Function doesn't exist or failed
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking: ${error.message.split('\n')[0]}`);
    }
    console.log('');
  }

  // Try to find Gateway by checking if it's a proxy contract
  console.log('🔍 Checking for Proxy Contracts...\n');
  
  for (const address of templateGateways) {
    try {
      const code = await ethers.provider.getCode(address);
      if (code === "0x" || code.length < 100) {
        continue;
      }
      
      console.log(`Checking ${address} for proxy patterns...`);
      
      // Check if it's a proxy contract
      const proxyABI = [
        "function implementation() external view returns (address)",
        "function admin() external view returns (address)",
        "function owner() external view returns (address)"
      ];
      
      try {
        const proxy = new ethers.Contract(address, proxyABI, deployer);
        const implementation = await proxy.implementation();
        console.log(`   Implementation: ${implementation}`);
        
        if (implementation !== "0x0000000000000000000000000000000000000000") {
          console.log(`   ✅ Found proxy implementation: ${implementation}`);
        }
      } catch (error) {
        // Not a proxy
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking ${address}: ${error.message.split('\n')[0]}`);
    }
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Check ZetaChain template repository for correct Gateway addresses');
  console.log('2. Use ZetaChain testnet explorer to find Gateway contract');
  console.log('3. Or try using a different approach for cross-chain transfers');
  console.log('4. Consider using ZetaChain bridge instead of direct Gateway calls');
}

findGatewayFromTemplate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

