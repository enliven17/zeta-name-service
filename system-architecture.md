# ZetaChain Universal Name Service - System Architecture

## System Overview

The ZetaChain Universal Name Service is a cross-chain domain name service that allows users to register, transfer, and manage domain names across multiple blockchain networks using ZetaChain's Universal App pattern.

## Architecture Diagrams

### 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Web Interface]
        Wallet[Wallet Integration]
        API[API Layer]
    end
    
    subgraph "Blockchain Layer"
        ARB[Arbitrum Sepolia]
        ETH[Ethereum Sepolia]
        ZETA[ZetaChain Testnet]
    end
    
    subgraph "Smart Contracts"
        ARB_NS[Universal Name Service<br/>0x813F8CfB...]
        ETH_NS[Universal Name Service<br/>0x7Dd728c2...]
        ARB_GW[Gateway<br/>0x0dA86Dc3...]
        ETH_GW[Gateway<br/>0x0c487a76...]
    end
    
    subgraph "Cross-Chain Infrastructure"
        ZETA_BRIDGE[ZetaChain Bridge]
        ZETA_GATEWAY[ZetaChain Gateway]
    end
    
    UI --> Wallet
    UI --> API
    Wallet --> ARB
    Wallet --> ETH
    ARB --> ARB_NS
    ETH --> ETH_NS
    ARB_NS --> ARB_GW
    ETH_NS --> ETH_GW
    ARB_GW --> ZETA_BRIDGE
    ETH_GW --> ZETA_BRIDGE
    ZETA_BRIDGE --> ZETA_GATEWAY
    ZETA_GATEWAY --> ARB_NS
    ZETA_GATEWAY --> ETH_NS
```

### 2. Cross-Chain Transfer Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant ARB_NS as Arbitrum Name Service
    participant ARB_GW as Arbitrum Gateway
    participant ZETA as ZetaChain
    participant ETH_GW as Ethereum Gateway
    participant ETH_NS as Ethereum Name Service
    
    User->>Frontend: Initiate Cross-Chain Transfer
    Frontend->>ARB_NS: crossChainTransfer(domain, recipient, targetChain)
    ARB_NS->>ARB_NS: Burn domain on source chain
    ARB_NS->>ARB_GW: gateway.call(message, revertOptions)
    ARB_GW->>ZETA: Process cross-chain message
    ZETA->>ETH_GW: Forward message to target chain
    ETH_GW->>ETH_NS: onCall(context, message)
    ETH_NS->>ETH_NS: Mint domain on target chain
    ETH_NS->>Frontend: DomainMinted event
    Frontend->>User: Transfer completed
```

### 3. Domain Registration Flow

```mermaid
flowchart TD
    A[User connects wallet] --> B[Select chain]
    B --> C{Chain selected}
    C -->|Arbitrum Sepolia| D[Register on Arbitrum]
    C -->|Ethereum Sepolia| E[Register on Ethereum]
    D --> F[Pay 0.001 ETH]
    E --> G[Pay 0.002 ETH]
    F --> H[Domain registered]
    G --> H
    H --> I[Domain available for cross-chain transfer]
```

### 4. Smart Contract Architecture

```mermaid
classDiagram
    class ZetaUniversalNameService {
        +IZetaGateway gateway
        +mapping(string => DomainRecord) nameToRecord
        +mapping(bytes32 => bool) processedMessages
        
        +register(string name, bool makeOmnichain) payable
        +crossChainTransfer(string name, address to, uint256 targetChainId)
        +onCall(MessageContext context, bytes message) payable
        +onRevert(RevertContext context) payable
        +isAvailable(string name) view returns bool
        +ownerOf(string name) view returns address
        +getDomainInfo(string name) view returns DomainRecord
    }
    
    class DomainRecord {
        +address owner
        +uint64 expiresAt
        +uint256 sourceChainId
        +bool isOmnichain
    }
    
    class MessageContext {
        +bytes sender
        +address senderEVM
        +uint256 chainID
    }
    
    class RevertContext {
        +address sender
        +address asset
        +uint256 amount
        +bytes revertMessage
    }
    
    ZetaUniversalNameService --> DomainRecord
    ZetaUniversalNameService --> MessageContext
    ZetaUniversalNameService --> RevertContext
```

### 5. Network Topology

```mermaid
graph LR
    subgraph "User Layer"
        U1[User 1]
        U2[User 2]
        U3[User 3]
    end
    
    subgraph "Frontend Layer"
        WEB[Web Interface<br/>localhost:3000]
    end
    
    subgraph "Blockchain Networks"
        subgraph "Arbitrum Sepolia"
            ARB_CONTRACT[Universal Name Service<br/>0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd]
            ARB_GATEWAY[Gateway<br/>0x0dA86Dc3F9B71F84a0E97B0e2291e50B7a5df10f]
        end
        
        subgraph "Ethereum Sepolia"
            ETH_CONTRACT[Universal Name Service<br/>0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74]
            ETH_GATEWAY[Gateway<br/>0x0c487a766110c85d301d96e33579c5b317fa4995]
        end
        
        subgraph "ZetaChain Testnet"
            ZETA_BRIDGE[Cross-Chain Bridge]
            ZETA_GATEWAY[Universal Gateway]
        end
    end
    
    U1 --> WEB
    U2 --> WEB
    U3 --> WEB
    WEB --> ARB_CONTRACT
    WEB --> ETH_CONTRACT
    ARB_CONTRACT --> ARB_GATEWAY
    ETH_CONTRACT --> ETH_GATEWAY
    ARB_GATEWAY --> ZETA_BRIDGE
    ETH_GATEWAY --> ZETA_BRIDGE
    ZETA_BRIDGE --> ZETA_GATEWAY
    ZETA_GATEWAY --> ARB_CONTRACT
    ZETA_GATEWAY --> ETH_CONTRACT
```

### 6. Data Flow Diagram

```mermaid
flowchart TD
    A[User Action] --> B{Action Type}
    B -->|Register| C[Domain Registration]
    B -->|Transfer| D[Cross-Chain Transfer]
    B -->|Query| E[Domain Query]
    
    C --> F[Pay Registration Fee]
    F --> G[Domain Stored on Chain]
    G --> H[Domain Available]
    
    D --> I[Validate Domain Ownership]
    I --> J[Burn Domain on Source]
    J --> K[Send Cross-Chain Message]
    K --> L[ZetaChain Processing]
    L --> M[Mint Domain on Target]
    M --> N[Transfer Complete]
    
    E --> O[Query Domain Info]
    O --> P[Return Domain Data]
```

## Key Components

### Frontend Layer
- **Web Interface**: React-based UI for domain management
- **Wallet Integration**: MetaMask and other wallet support
- **Cross-Chain UI**: Interface for cross-chain transfers

### Smart Contract Layer
- **Universal Name Service**: Main contract for domain management
- **Gateway Integration**: ZetaChain Gateway for cross-chain communication
- **Event System**: Real-time updates for domain operations

### Cross-Chain Infrastructure
- **ZetaChain Bridge**: Handles cross-chain message passing
- **Gateway Contracts**: Interface between chains and ZetaChain
- **Message Processing**: Secure cross-chain communication

## Security Features

1. **Domain Ownership Validation**: Only domain owners can transfer
2. **Cross-Chain Message Validation**: Prevents replay attacks
3. **Gateway Authentication**: Only authorized gateways can mint domains
4. **Gas Optimization**: Efficient cross-chain operations

## Performance Characteristics

- **Registration Time**: ~15-30 seconds
- **Cross-Chain Transfer**: 2-5 minutes
- **Query Response**: <1 second
- **Gas Costs**: Optimized for efficiency

## Supported Networks

- **Arbitrum Sepolia**: Primary network (0.001 ETH registration)
- **Ethereum Sepolia**: Secondary network (0.002 ETH registration)
- **ZetaChain Testnet**: Cross-chain infrastructure
- **Future**: BSC Testnet, Polygon Mumbai (planned)
