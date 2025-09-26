// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEvmGateway {
    function call(
        address receiver,
        bytes calldata message,
        bytes calldata revertOptions
    ) external;
}

/// @title Zeta Connected Contract (minimal)
/// @notice Lives on a connected EVM chain; can call the Universal App on ZetaChain
contract ZetaConnected {
    IEvmGateway public immutable gateway;

    constructor(address gatewayAddress) {
        require(gatewayAddress != address(0), "GATEWAY_ZERO");
        gateway = IEvmGateway(gatewayAddress);
    }

    function sendHello(address universalOnZeta, string calldata name) external {
        bytes memory payload = abi.encode(name);
        // Minimal revert options payload (no callOnRevert for gateway.call variant per docs)
        bytes memory revertOptions = abi.encode(address(0), false, address(0), bytes(""), uint256(0));
        gateway.call(universalOnZeta, payload, revertOptions);
    }
}



