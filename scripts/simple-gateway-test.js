const { ethers } = require('hardhat');

async function simpleGatewayTest() {
  console.log('🧪 Simple Gateway Test...\n');

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const currentChainId = Number(network.chainId);
  
  console.log('Testing with account:', deployer.address);
  console.log(`Current Network: ${network.name} (${currentChainId})`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Gateway address
  const gatewayAddress = "0x6c533f7fe93fae114d0954697069df33c9b74fd7";
  
  // Simple contract that just calls gateway
  const simpleContractCode = `
    pragma solidity ^0.8.19;
    
    interface IZetaGateway {
        function call(
            address receiver,
            bytes calldata payload,
            tuple(address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) revertOptions
        ) external payable;
    }
    
    contract SimpleGatewayTest {
        IZetaGateway public immutable gateway;
        
        constructor(address gatewayAddress) {
            gateway = IZetaGateway(gatewayAddress);
        }
        
        function testCall() external {
            bytes memory message = abi.encode("test message");
            
            tuple(address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) memory revertOptions = 
                tuple(address(this), false, address(this), abi.encode("test revert"), 0);
            
            gateway.call{value: 0}(
                address(this),
                message,
                revertOptions
            );
        }
    }
  `;

  try {
    // Deploy simple test contract
    console.log('📦 Deploying simple test contract...');
    const factory = new ethers.ContractFactory(
      [
        "constructor(address gatewayAddress)",
        "function testCall() external"
      ],
      simpleContractCode,
      deployer
    );
    
    const simpleContract = await factory.deploy(gatewayAddress);
    await simpleContract.waitForDeployment();
    const contractAddress = await simpleContract.getAddress();
    
    console.log('✅ Simple test contract deployed to:', contractAddress);
    
    // Test the call
    console.log('\n🧪 Testing gateway call...');
    const tx = await simpleContract.testCall({
      gasLimit: 200000
    });
    
    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Gateway call successful!');
    console.log('Gas used:', receipt.gasUsed.toString());
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.receipt) {
      console.log('Receipt status:', error.receipt.status);
      console.log('Gas used:', error.receipt.gasUsed.toString());
    }
  }
}

simpleGatewayTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

