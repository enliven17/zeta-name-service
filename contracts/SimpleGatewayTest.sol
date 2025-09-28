// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IZetaGateway {
    function call(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external payable;
}

struct RevertOptions {
    address revertAddress;
    bool callOnRevert;
    address abortAddress;
    bytes revertMessage;
    uint256 onRevertGasLimit;
}

contract SimpleGatewayTest {
    IZetaGateway public immutable gateway;
    
    constructor(address gatewayAddress) {
        gateway = IZetaGateway(gatewayAddress);
    }
    
    function testCall() external {
        bytes memory message = abi.encode("test message");
        
        RevertOptions memory revertOptions = RevertOptions({
            revertAddress: address(this),
            callOnRevert: false,
            abortAddress: address(this),
            revertMessage: abi.encode("test revert"),
            onRevertGasLimit: 0
        });
        
        gateway.call{value: 0}(
            address(this),
            message,
            revertOptions
        );
    }
}

