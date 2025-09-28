const { ethers } = require('hardhat');

async function findCorrectGateway() {
  console.log('🔍 Finding Correct Gateway Address...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Known Gateway addresses to test
  const gatewayAddresses = [
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Current
    "0x735b14BB79463307AAcBED86DAf3322B1e6226aB", // Protocol address
    "0x7CCE3Eb018bf23e1FE2a32692f2C77592D110394", // Registry address
    "0x0000000000000000000000000000000000000000", // Zero address
  ];

  console.log('🧪 Testing Gateway addresses...\n');

  for (let i = 0; i < gatewayAddresses.length; i++) {
    const address = gatewayAddresses[i];
    console.log(`Testing address ${i + 1}/${gatewayAddresses.length}: ${address}`);
    
    try {
      const code = await ethers.provider.getCode(address);
      console.log(`   Code length: ${code.length} bytes`);
      
      if (code === "0x") {
        console.log(`   ❌ Not a contract (EOA)`);
      } else if (code.length < 100) {
        console.log(`   ❌ Too small to be a contract (${code.length} bytes)`);
      } else {
        console.log(`   ✅ Is a contract (${code.length} bytes)`);
        
        // Try to call the contract
        try {
          const gateway = new ethers.Contract(address, [
            "function call(address receiver, bytes calldata payload, tuple(address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) revertOptions) external payable"
          ], deployer);
          
          const revertOptions = {
            revertAddress: deployer.address,
            callOnRevert: false,
            abortAddress: deployer.address,
            revertMessage: ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]),
            onRevertGasLimit: 0
          };
          
          const tx = await gateway.call(
            deployer.address,
            ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test"]),
            revertOptions,
            { value: 0, gasLimit: 100000 }
          );
          
          console.log(`   ✅ Gateway call successful! Hash: ${tx.hash}`);
          
        } catch (error) {
          console.log(`   ❌ Gateway call failed: ${error.message.split('\n')[0]}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking: ${error.message.split('\n')[0]}`);
    }
    console.log('');
  }

  // Try to find Gateway by checking common patterns
  console.log('🔍 Searching for Gateway by common patterns...\n');
  
  // Common Gateway patterns
  const patterns = [
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7", // Current
    "0x735b14BB79463307AAcBED86DAf3322B1e6226aB", // Protocol
    "0x7CCE3Eb018bf23e1FE2a32692f2C77592D110394", // Registry
  ];

  // Try to find Gateway by checking if it has the right functions
  console.log('🔍 Checking for Gateway functions...\n');
  
  for (const address of patterns) {
    try {
      const code = await ethers.provider.getCode(address);
      if (code === "0x" || code.length < 100) {
        continue;
      }
      
      console.log(`Checking ${address} for Gateway functions...`);
      
      // Try different Gateway function signatures
      const functions = [
        "function call(address,bytes,tuple) external payable",
        "function call(address,bytes) external payable",
        "function deposit(address,uint256,tuple) external payable",
        "function deposit(address,tuple) external payable",
        "function execute(address,bytes) external payable",
        "function send(address,bytes) external payable"
      ];
      
      for (const func of functions) {
        try {
          const contract = new ethers.Contract(address, [func], deployer);
          const funcName = func.split('(')[0].split(' ')[1];
          
          if (funcName === "call" && func.includes("tuple")) {
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
            console.log(`   ✅ ${funcName} works! Hash: ${tx.hash}`);
            
          } else if (funcName === "call" && !func.includes("tuple")) {
            const tx = await contract.call(
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
      
    } catch (error) {
      console.log(`   ❌ Error checking ${address}: ${error.message.split('\n')[0]}`);
    }
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Check ZetaChain documentation for correct Gateway address');
  console.log('2. Use ZetaChain testnet explorer to find Gateway contract');
  console.log('3. Or try using a different approach for cross-chain transfers');
}

findCorrectGateway()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

