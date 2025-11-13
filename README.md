# ZetaChain Universal Name Service

ZETACHAIN VIBEATHON WINNER!

A cross-chain domain name service powered by ZetaChain's Universal App pattern. Register, transfer, and manage .zeta domains across multiple blockchain networks with seamless cross-chain functionality, beautiful modern interface, and comprehensive marketplace features.

## 🌉 Cross-Chain Features

### **Universal App Pattern**
- **Cross-Chain Domains**: Register domains on Arbitrum Sepolia and Ethereum Sepolia
- **Seamless Transfers**: Transfer domains between chains using ZetaChain Gateway
- **Universal Ownership**: Domains work across all supported networks
- **ZetaChain Integration**: Powered by ZetaChain's Universal App infrastructure

### **Multi-Chain Support**
- **Arbitrum Sepolia**: Primary network (0.001 ETH registration)
- **Ethereum Sepolia**: Secondary network (0.002 ETH registration)
- **ZetaChain Testnet**: Cross-chain infrastructure and processing
- **Future Networks**: BSC Testnet, Polygon Mumbai (planned)

### **Cross-Chain Transfer System**
- **Burn & Mint**: Domains are burned on source chain and minted on target chain
- **Gateway Integration**: Uses ZetaChain Gateway for secure cross-chain communication
- **Real-time Processing**: 2-5 minute cross-chain transfer completion
- **Event Tracking**: Complete transfer history and status monitoring

## 🌟 Features

### **Domain Registration System**
- **.zeta Domains**: Register unique domains with .zeta extension
- **Instant Registration**: 0.001 ETH for 1-year domain registration
- **Availability Check**: Real-time domain availability verification
- **Blockchain Integration**: Secure registration via smart contracts on Arbitrum Sepolia

### **Domain Marketplace**
- **List Domains**: List your domains for sale with fixed pricing
- **Buy Domains**: Purchase domains directly from other users
- **Listing Fees**: 0.0001 ETH fee to list domains on marketplace
- **Secure Transactions**: Smart contract-based escrow system
- **Search & Filter**: Find domains by name or seller address
- **Navigation System**: Browse listings with smooth pagination

### **Domain Transfer System**
- **Direct Transfer**: Instantly transfer domains to another wallet (0.0001 ETH fee)
- **Marketplace Integration**: Automatic marketplace listing ownership updates
- **Cross-Wallet Support**: Transfer between different wallet types
- **Secure Transactions**: Blockchain-verified ownership transfers

### **Wallet Integration**
- **RainbowKit Integration**: Modern wallet connection with multiple wallet support
- **Arbitrum Sepolia**: Automatic network detection and validation
- **Connection Status**: Real-time wallet connection feedback
- **Network Validation**: Ensures users are on Arbitrum Sepolia (Chain ID: 421614)

### **Modern UI/UX**
- **Glassmorphism Design**: Frosted glass effects with backdrop blur
- **Dynamic Background**: Animated wave effects using HTML Canvas
- **Responsive Design**: Perfect performance on all screen sizes
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Loading System**: Professional loading screens and state management
- **Navigation Controls**: Arrow-based navigation for large lists

### **Profile Management**
- **Domain Portfolio**: View all owned domains with status indicators
- **Listing Status**: See which domains are listed on marketplace
- **Transfer History**: Complete history of sent and received transfers
- **Compact Views**: Optimized display with pagination for large collections

## 🛠️ Technologies

### **Frontend Framework**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Full type safety and development experience
- **Styled Components**: Component-scoped CSS-in-JS styling
- **React Icons**: Beautiful icon library

### **Blockchain Integration**
- **ZetaChain Universal App**: Cross-chain domain management using Universal App pattern
- **Arbitrum Sepolia**: Primary network (Chain ID: 421614)
- **Ethereum Sepolia**: Secondary network (Chain ID: 11155111)
- **ZetaChain Gateway**: Cross-chain communication infrastructure
- **Hardhat**: Smart contract development and deployment
- **Ethers.js v6**: Latest Ethereum library for blockchain interactions
- **Smart Contracts**: Solidity-based Universal Name Service contracts
- **Wagmi**: React hooks for Ethereum integration

### **Database & Backend**
- **Supabase**: PostgreSQL database with real-time features
- **Row Level Security**: Database-level security policies
- **Real-time Sync**: Live updates between frontend and database

### **Wallet Support**
- **RainbowKit**: Modern wallet connection library
- **MetaMask**: Browser extension wallet
- **WalletConnect**: Mobile and desktop wallet connectivity
- **Multiple Wallets**: Support for 50+ wallet providers

### **Design & Animation**
- **HTML Canvas**: Dynamic background wave animation
- **Simplex Noise**: Procedural wave generation algorithm
- **Glassmorphism**: Modern frosted glass UI effects
- **Custom Notifications**: Beautiful toast notification system

### **Development Tools**
- **Hardhat**: Smart contract compilation and deployment
- **ESLint**: Code quality and consistency
- **Git**: Version control with proper .gitignore setup

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with RainbowKit providers
│   ├── page.tsx           # Main application with all features
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ConfirmationModal.tsx    # Confirmation dialogs
│   ├── DomainTransfer.tsx       # Domain transfer modal
│   ├── CreateListingModal.tsx   # Marketplace listing creation
│   ├── MarketplaceListings.tsx  # Marketplace display component
│   └── Notification.tsx         # Toast notification system
├── contexts/              # React Context providers
│   └── WalletContext.tsx  # Legacy wallet state management
└── lib/                   # Utility libraries
    ├── contract.ts        # Domain registry contract interactions
    ├── marketplaceContract.ts # Marketplace contract interactions
    ├── marketplace.ts     # Marketplace service layer
    └── supabase.ts        # Database service layer

contracts/                 # Smart contracts
├── ZetaUniversalNameServiceFixed.sol  # Universal App domain service
├── ZetaUniversalNameService.sol       # Legacy Universal App contract
├── ZetaOmnichainNameService.sol       # Legacy omnichain contract
├── ZetaNameService.sol                # Legacy single-chain contract
└── ZetaNameMarketplace.sol            # Marketplace contract for domain trading

scripts/                   # Deployment and utility scripts
├── deploy-fixed-universal.js    # Deploy Universal App contracts
├── test-final-crosschain.js     # Test cross-chain transfers
├── test-frontend-transfer.js    # Test frontend functionality
├── check-transfer-result.js     # Check cross-chain transfer results
├── deploy-credit.js             # Deploy legacy contracts
├── check-contract-balance.js    # Check contract balances and earnings
├── withdraw-funds.js            # Withdraw accumulated fees
├── sync-marketplace-ownership.js # Fix marketplace ownership issues
└── debug-marketplace.js         # Debug marketplace configuration

public/
├── Logo2.png             # Application logo
└── favicon.ico           # Browser favicon
```

## 🎨 Design System

### **Color Palette**
- **Primary**: Green gradients (#22c55e, #065f46)
- **Background**: Dark theme with animated wave effects
- **Text**: White and light gray for readability
- **Status Colors**: Green for active/available, red for expired/taken, blue for listed

### **Typography**
- **Headers**: Bold, gradient text effects
- **Body Text**: Clean, readable fonts
- **Interactive Elements**: Highlighted with color and weight

### **Components**
- **Glass Cards**: Frosted glass with backdrop blur
- **Search Box**: Focused input with domain extension
- **Buttons**: Gradient backgrounds with hover animations
- **Navigation**: Bottom tab navigation

## 🚀 Installation

### **Prerequisites**
- Node.js 18 or higher
- npm or yarn package manager
- Web3 wallet (MetaMask, OKX, or WalletConnect compatible)
- Supabase account (for backend database)

### **Installation Steps**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd umi-name-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` file:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   # Wallet Configuration
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   
   # Contract Addresses (FIXED Universal App)
   NEXT_PUBLIC_ARB_NAME_SERVICE_ADDRESS=0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd
   NEXT_PUBLIC_ETH_NAME_SERVICE_ADDRESS=0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74
   
   # Gateway Addresses (ZetaChain)
   NEXT_PUBLIC_ARB_GATEWAY_ADDRESS=0x0dA86Dc3F9B71F84a0E97B0e2291e50B7a5df10f
   NEXT_PUBLIC_ETH_GATEWAY_ADDRESS=0x0c487a766110c85d301d96e33579c5b317fa4995
   
   # RPC Endpoints
   NEXT_PUBLIC_ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
   NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL=https://1rpc.io/sepolia
   
   # Deployment
   PRIVATE_KEY=your_wallet_private_key_for_deployment
   CONTRACT_OWNER_ADDRESS=your_contract_owner_address
   ```

4. **Set up Supabase database**
   - Create a new project in Supabase dashboard
   - Run SQL commands from `docs/supabase-schema.sql`
   - Enable RLS (Row Level Security) policies

5. **Deploy smart contracts (optional)**
   ```bash
   # Compile contracts
   npx hardhat compile
   
   # Deploy Universal App contracts
   npx hardhat run scripts/deploy-fixed-universal.js --network arbitrumSepolia
   npx hardhat run scripts/deploy-fixed-universal.js --network ethereumSepolia
   
   # Test cross-chain functionality
   npx hardhat run scripts/test-final-crosschain.js --network arbitrumSepolia
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

### **Supabase Setup**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get project URL and anon key

2. **Set up Database Schema**
   - Open Supabase SQL Editor
   - Copy content from `docs/supabase-schema.sql`
   - Execute the SQL commands

3. **Verify RLS Policies**
   - Check policies in Authentication > Policies section
   - Add policies manually if needed

## 🔧 Configuration

### **Wallet Setup**
1. Install a compatible Web3 wallet (MetaMask recommended)
2. Add Arbitrum Sepolia to your wallet:
   - **Network Name**: Arbitrum Sepolia
   - **RPC URL**: https://sepolia-rollup.arbitrum.io/rpc
   - **Chain ID**: 421614
   - **Currency Symbol**: ETH
   - **Block Explorer**: https://sepolia.arbiscan.io

### **Network Requirements**
- **Arbitrum Sepolia**: Primary network (Chain ID: 421614) - 0.001 ETH registration
- **Ethereum Sepolia**: Secondary network (Chain ID: 11155111) - 0.002 ETH registration
- **ZetaChain Testnet**: Cross-chain infrastructure (Chain ID: 7001)
- RainbowKit handles network switching automatically
- Users will be prompted to switch if on wrong network

### **Smart Contracts**
- **Universal Name Service**: Cross-chain domain registration and management
- **ZetaChain Gateway**: Cross-chain communication infrastructure
- **Marketplace**: Domain trading and listings (legacy)
- **Registration Fees**: 0.001 ETH (Arbitrum), 0.002 ETH (Ethereum)
- **Transfer Fee**: 0.0001 ETH per transfer
- **Cross-Chain Transfer**: Burn on source, mint on target chain
- **Owner**: Contract owner can withdraw accumulated fees

## 📱 Usage

### **Registering a Domain**
1. **Connect Wallet**: Use RainbowKit to connect your preferred wallet
2. **Select Network**: Choose Arbitrum Sepolia or Ethereum Sepolia
3. **Search Domain**: Enter your desired domain name in the search box
4. **Check Availability**: Click "Search" to check if the domain is available
5. **Register**: If available, click "Register Domain" and confirm the transaction
6. **Pay Fee**: Pay 0.001 ETH (Arbitrum) or 0.002 ETH (Ethereum) for 1 year registration
7. **Enable Omnichain**: Check "Make Omnichain" to enable cross-chain transfers

### **Managing Domains**
1. **View Profile**: Click the "Profile" tab in bottom navigation
2. **Domain List**: See all your registered domains with navigation controls
3. **Transfer Domains**: Click transfer button to send domains to other wallets (0.0001 ETH fee)
4. **List for Sale**: Click list button to put domains on marketplace (0.0001 ETH fee)
5. **Status Check**: Monitor active/expired and listing status

### **Cross-Chain Domain Transfer**
1. **Select Domain**: Choose omnichain-enabled domain from your profile
2. **Select Target Chain**: Choose destination network (Arbitrum ↔ Ethereum)
3. **Enter Recipient**: Input recipient wallet address
4. **Pay Fee**: Transfer requires 0.0001 ETH fee
5. **Sign Transfer**: Sign the cross-chain transfer transaction
6. **Wait for Processing**: Cross-chain transfer takes 2-5 minutes
7. **Domain Burned**: Domain is burned on source chain
8. **Domain Minted**: Domain is minted on target chain
9. **Transfer Complete**: Recipient owns domain on target chain

### **Same-Chain Domain Transfer**
1. **Select Domain**: Choose domain from your profile
2. **Enter Recipient**: Input recipient wallet address
3. **Pay Fee**: Transfer requires 0.0001 ETH fee
4. **Sign Transfer**: Sign the transfer transaction
5. **Instant Transfer**: Domain ownership updates immediately

### **Marketplace Trading**
1. **Browse Market**: Click "Market" tab to see available domains
2. **Search Domains**: Use search to find specific domains or sellers
3. **Buy Domains**: Click "Buy Now" to purchase listed domains
4. **Your Listings**: See "Your Listing" for domains you've listed

### **Transfer History**
1. **View History**: Click "History" tab to see all transfers
2. **Sent/Received**: See transfers you've sent and received with navigation
3. **Transaction Links**: Click to view on blockchain explorer
4. **Status Tracking**: Monitor transfer completion status

### **Wallet Connection**
1. **Multiple Options**: Choose from MetaMask, OKX Wallet, or WalletConnect
2. **Network Check**: App automatically verifies Umi Devnet connection
3. **Auto Switch**: Prompts to switch to Umi Devnet if needed
4. **Disconnect**: Easy wallet disconnection from profile

## 🌟 Key Features

### **Domain System**
- **.zeta Extension**: All domains end with .zeta
- **1 Year Registration**: Domains are registered for 1 year periods
- **0.001 ETH Fee**: Fixed registration fee in ETH
- **Transfer Fee**: 0.0001 ETH for domain transfers
- **Instant Search**: Real-time availability checking

### **User Interface**
- **Clean Design**: Minimalist, focused interface
- **Visual Feedback**: Clear status indicators and animations
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessibility**: Keyboard navigation and screen reader support

### **Blockchain Integration**
- **Arbitrum Sepolia**: Native integration with Arbitrum Sepolia
- **Smart Contracts**: Decentralized domain registry and marketplace
- **RainbowKit**: Modern wallet connectivity
- **Transaction Handling**: Smooth transaction flow with proper error handling

## 🔮 Future Enhancements

### **Planned Features**
- **Domain Renewal**: Extend domain registration periods
- **Auction System**: Auction-based domain sales
- **Subdomain Support**: Create subdomains for registered domains
- **Bulk Registration**: Register multiple domains at once
- **Domain Analytics**: Usage statistics and insights
- **Offer System**: Make offers on unlisted domains

### **Technical Improvements**
- **IPFS Integration**: Decentralized content hosting
- **Cross-chain Support**: Multi-network domain resolution
- **Mobile App**: React Native mobile application
- **Advanced Filtering**: Filter by price, age, length
- **Gas Optimization**: Reduce transaction costs
- **Real-time Updates**: WebSocket-based live updates

### **UI/UX Enhancements**
- **Theme Switching**: Dark/Light mode toggle
- **Internationalization**: Multi-language support
- **Advanced Animations**: More sophisticated transitions
- **Customization**: Personalized user preferences
- **Improved Notifications**: Enhanced notification system

## 🤝 Contributing

We welcome contributions to Umi Name Service! Here's how you can help:

1. **Fork the Repository**: Create your own fork
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or fix
4. **Add Tests**: Ensure your changes are tested
5. **Commit Changes**: `git commit -m 'Add amazing feature'`
6. **Push to Branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**: Submit your changes for review

### **Development Guidelines**
- Follow TypeScript best practices
- Use styled-components for styling
- Maintain component reusability
- Add proper documentation and comments
- Test on multiple browsers and devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zeta Omnichain**: Future-ready omnichain approach
- **RainbowKit**: Modern wallet connection library
- **WalletConnect**: Multi-wallet connectivity protocol
- **Next.js Team**: Amazing React framework
- **Styled Components**: CSS-in-JS styling solution
- **Supabase**: Backend-as-a-Service platform

## 📞 Support

For support, questions, or feedback:

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-repo/issues)
- **Arbitrum Docs**: [https://docs.arbitrum.io](https://docs.arbitrum.io)
- **Community**: Join our Discord or Telegram communities

## 🌐 Links

### **Blockchain Explorers**
- **Arbitrum Sepolia**: [https://sepolia.arbiscan.io](https://sepolia.arbiscan.io)
- **Ethereum Sepolia**: [https://sepolia.etherscan.io](https://sepolia.etherscan.io)
- **ZetaChain Testnet**: [https://athens.explorer.zetachain.com](https://athens.explorer.zetachain.com)

### **RPC Endpoints**
- **Arbitrum Sepolia**: [https://sepolia-rollup.arbitrum.io/rpc](https://sepolia-rollup.arbitrum.io/rpc)
- **Ethereum Sepolia**: [https://1rpc.io/sepolia](https://1rpc.io/sepolia)
- **ZetaChain Testnet**: [https://zetachain-athens-evm.blockpi.network/v1/rpc/public](https://zetachain-athens-evm.blockpi.network/v1/rpc/public)

### **Contract Addresses**
- **Arbitrum Name Service**: `0x813F8CfB8897F46bF0fD21914Cb76a21FD3a97Dd`
- **Ethereum Name Service**: `0x7Dd728c2AF6553801DDc2Be4906f09AcB33C2A74`
- **Arbitrum Gateway**: `0x0dA86Dc3F9B71F84a0E97B0e2291e50B7a5df10f`
- **Ethereum Gateway**: `0x0c487a766110c85d301d96e33579c5b317fa4995`

## 📊 Project Status

- ✅ **Universal App Contracts**: Deployed on Arbitrum Sepolia & Ethereum Sepolia
- ✅ **ZetaChain Integration**: Gateway addresses configured and working
- ✅ **Cross-Chain Transfers**: Burn & mint functionality working
- ✅ **Frontend**: Complete with cross-chain features
- ✅ **Database**: Supabase integration with RLS policies
- ✅ **Wallet Integration**: RainbowKit with 50+ wallet support
- ✅ **Domain Registration**: Multi-chain registration (Arbitrum & Ethereum)
- ✅ **Cross-Chain Transfer**: Seamless chain-to-chain transfers
- ✅ **Domain Burning**: Source chain domain burning working
- ✅ **Domain Minting**: Target chain domain minting working
- ✅ **Gateway Communication**: ZetaChain Gateway integration working
- ✅ **Transfer History**: View all transfer activity with navigation
- ✅ **Profile Management**: Multi-chain domain management
- ✅ **Search & Navigation**: Advanced search and pagination systems
- ✅ **Security**: No hardcoded private keys, environment-based configuration

---

**Built with ❤️ for the ZetaChain Universal App ecosystem**

*Register your .zeta domain today and transfer it seamlessly across chains!*

## 📋 System Architecture

For detailed system architecture diagrams and technical documentation, see:
- [System Architecture Documentation](docs/system-architecture.md)
- [Cross-Chain Transfer Flow](docs/system-architecture.md#cross-chain-transfer-flow)
- [Smart Contract Architecture](docs/system-architecture.md#smart-contract-architecture)
