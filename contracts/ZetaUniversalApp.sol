// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Minimal interfaces following ZetaChain Universal App patterns
interface IZetaGateway {
    function call(
        bytes calldata receiver,
        address zrc20,
        bytes calldata message,
        bytes calldata callOptions,
        bytes calldata revertOptions
    ) external;
}

interface IZRC20 {
    function approve(address spender, uint256 amount) external returns (bool);
}

struct MessageContext {
    bytes sourceAddress;
    uint256 sourceChainId;
}

struct RevertContext {
    bytes revertMessage;
}

/// @title Zeta Universal App (minimal)
/// @notice Receives onCall from connected EVM chains and can perform outbound calls
contract ZetaUniversalApp {
    event HelloEvent(string message, string name);
    event RevertEvent(string message, bytes revertData);

    IZetaGateway public immutable gateway;

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "ONLY_GATEWAY");
        _;
    }

    constructor(address gatewayAddress) {
        require(gatewayAddress != address(0), "GATEWAY_ZERO");
        gateway = IZetaGateway(gatewayAddress);
    }

    // Incoming call handler invoked by Zeta Gateway
    function onCall(
        MessageContext calldata /*context*/,
        address /*zrc20*/, // gas token for the source chain if provided
        uint256 /*amount*/, // delivered amount if any
        bytes calldata message
    ) external onlyGateway {
        string memory name = abi.decode(message, (string));
        emit HelloEvent("Hello on ZetaChain", name);
    }

    // Optional revert handler
    function onRevert(RevertContext calldata revertContext) external onlyGateway {
        emit RevertEvent("Revert on ZetaChain", revertContext.revertMessage);
    }

    // Example of making an outbound call (Universal -> Connected)
    function outboundHello(
        address zrc20GasToken,
        address connectedContract,
        string calldata name,
        uint256 gasLimit
    ) external {
        // Approvals for gas fee are expected to be handled off-contract if needed.
        // Encodings are simplified to match tutorial shape.
        bytes memory receiver = abi.encode(connectedContract);
        bytes memory payload = abi.encode(name);
        bytes memory callOptions = abi.encode(gasLimit, false); // (gasLimit, isArbitraryCall=false)
        bytes memory revertOptions = abi.encode(address(this), true, address(this), bytes(""), uint256(0));

        // If protocol requires approval for gas ZRC20, caller should approve gateway beforehand.
        IZRC20(zrc20GasToken).approve(address(gateway), type(uint256).max);
        gateway.call(receiver, zrc20GasToken, payload, callOptions, revertOptions);
    }
}



