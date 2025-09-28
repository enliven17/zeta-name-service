const { ethers } = require('hardhat');

async function debugGatewayInterface() {
  console.log('🔍 Debugging Gateway Interface...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Gateway address
  const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
  
  // Test different gateway interfaces
  const interfaces = [
    {
      name: "Interface 1: call(address, bytes, RevertOptions)",
      abi: [
        "function call(address receiver, bytes calldata payload, tuple(address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) revertOptions) external payable"
      ]
    },
    {
      name: "Interface 2: call(bytes, address, bytes, bytes, bytes)",
      abi: [
        "function call(bytes calldata receiver, address zrc20, bytes calldata message, bytes calldata callOptions, bytes calldata revertOptions) external"
      ]
    },
    {
      name: "Interface 3: call(address, bytes, bytes)",
      abi: [
        "function call(address receiver, bytes calldata payload, bytes calldata revertOptions) external payable"
      ]
    }
  ];

  for (const iface of interfaces) {
    console.log(`\n🧪 Testing ${iface.name}...`);
    
    try {
      const gateway = new ethers.Contract(gatewayAddress, iface.abi, deployer);
      
      const testReceiver = deployer.address;
      const testPayload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"], 
        ["test message"]
      );
      
      if (iface.name.includes("Interface 1")) {
        // Test with RevertOptions struct
        const revertOptions = {
          revertAddress: deployer.address,
          callOnRevert: false,
          abortAddress: deployer.address,
          revertMessage: ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test revert"]),
          onRevertGasLimit: 0
        };

        const tx = await gateway.call(
          testReceiver,
          testPayload,
          revertOptions,
          {
            value: 0,
            gasLimit: 200000
          }
        );
        
        console.log('✅ Success! Transaction hash:', tx.hash);
        
      } else if (iface.name.includes("Interface 2")) {
        // Test with 5 parameters
        const callOptions = ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint256", "bool"], 
          [500000, false]
        );
        const revertOptions = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "bool", "address", "bytes", "uint256"],
          [deployer.address, false, deployer.address, ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test revert"]), 0]
        );

        const tx = await gateway.call(
          ethers.AbiCoder.defaultAbiCoder().encode(["address"], [testReceiver]),
          ethers.ZeroAddress, // No ZRC20
          testPayload,
          callOptions,
          revertOptions,
          {
            gasLimit: 200000
          }
        );
        
        console.log('✅ Success! Transaction hash:', tx.hash);
        
      } else if (iface.name.includes("Interface 3")) {
        // Test with 3 parameters (bytes for revertOptions)
        const revertOptions = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "bool", "address", "bytes", "uint256"],
          [deployer.address, false, deployer.address, ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["test revert"]), 0]
        );

        const tx = await gateway.call(
          testReceiver,
          testPayload,
          revertOptions,
          {
            value: 0,
            gasLimit: 200000
          }
        );
        
        console.log('✅ Success! Transaction hash:', tx.hash);
      }
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
  }
}

debugGatewayInterface()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

