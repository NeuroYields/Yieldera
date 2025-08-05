# Yieldera - AI Automated Liquidity Management for Hedera

Yieldera is an AI-powered automated liquidity management protocol built for the Hedera network. It provides intelligent vault strategies using AI agents for SaucerSwap (Uniswap V3) liquidity positions and Bonzo lending protocols, automatically rebalancing positions to optimize yield and minimize impermanent loss.

## 🏗️ Architecture

The project consists of four main components:

### Backend (Rust)
- **Liquidity Management Engine**: Automated rebalancing logic for vault positions
- **REST API**: HTTP server with Swagger documentation for vault management
- **AI Agent Integration**: Gemini-powered AI agent with MCP (Model Context Protocol) tools
- **Multi-Vault Support**: Concurrent management of multiple liquidity vaults across SaucerSwap and Bonzo
- **Real-time Monitoring**: Continuous monitoring and adjustment of liquidity positions

### Frontend (React/TypeScript)
- **Modern Web Interface**: React-based dashboard with cyberpunk-themed UI
- **Wallet Integration**: Support for HashPack, Blade, Kabila, and MetaMask wallets
- **Real-time Chat**: AI agent interaction through chat interface
- **Vault Management**: Deposit, withdraw, and monitor vault positions
- **Token Balance Tracking**: Real-time display of user token balances

### Smart Contracts (Solidity)
- **YielderaVault**: Core vault contract for managing SaucerSwap positions
- **Hedera Integration**: Native support for HBAR and HTS tokens
- **Position Management**: Automated minting, burning, and rebalancing of liquidity positions

### MCP Server (Rust)
- **AI Tool Server**: Model Context Protocol server providing blockchain tools to AI agents
- **Hedera Tools**: Native HBAR balance checking, Bonzo lending operations
- **Token Management**: Support for USDC, SAUCE, and other Hedera tokens

## 🚀 Features

### Core Features
- ✅ **AI-Powered Management**: Gemini AI agent with blockchain-specific tools via MCP
- ✅ **Automated Rebalancing**: Intelligent position management based on market conditions
- ✅ **Multi-Protocol Support**: SaucerSwap liquidity pools and Bonzo lending integration
- ✅ **Multi-Token Support**: Support for HBAR, USDC, SAUCE, and other HTS tokens
- ✅ **Fee Collection**: Automatic collection and reinvestment of trading fees

### Technical Features
- ✅ **Modern Web Interface**: React/TypeScript frontend with cyberpunk UI
- ✅ **Multi-Wallet Support**: HashPack, Blade, Kabila, and MetaMask integration
- ✅ **REST API**: Complete API for vault management and monitoring
- ✅ **AI Chat Interface**: Natural language interaction with AI agent
- ✅ **MCP Integration**: Model Context Protocol for AI tool extensibility
- ✅ **Real-time Updates**: Live token balances and vault status
- ✅ **Swagger Documentation**: Interactive API documentation
- ✅ **Comprehensive Logging**: Structured logging and monitoring
- ✅ **Testnet & Mainnet**: Support for both Hedera testnet and mainnet

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

### System Requirements
- **Rust** (latest stable version)
- **Node.js** (v16 or higher)
- **npm** or **yarn** (for frontend dependencies)
- **Foundry** (for smart contract development)

### Installation Commands

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## ⚙️ Configuration

### 1. Environment Variables

Create `.env` files in `backend/`, `contracts/`, `frontend/`, and `mcp/` directories:

#### Backend Environment (`backend/.env`)
```bash
# Copy from example
cp backend/.env.exemple backend/.env

# Edit the file with your values
PRIVATE_KEY="0x..." # Your private key (without 0x prefix)
NETWORK="testnet"   # or "mainnet"
ADMIN_PASSWORD="your_secure_password"
GEMINI_API_KEY="your_gemini_api_key" # For AI agent functionality
```

#### Contracts Environment (`contracts/.env`)
```bash
# Copy from example
cp contracts/.env.exemple contracts/.env

# Edit the file with your values
PRIVATE_KEY="0x..." # Your private key for deployment
```

#### Frontend Environment (`frontend/.env`)
```bash
# Create frontend environment file
REACT_APP_API_BASE_URL="http://127.0.0.1:8090"
REACT_APP_NETWORK="testnet" # or "mainnet"
```

#### MCP Environment (`mcp/.env`)
```bash
# Create MCP environment file
PRIVATE_KEY="0x..." # Your private key for blockchain operations
GEMINI_API_KEY="your_gemini_api_key" # For AI agent functionality
```

### 2. Network Configuration

The project supports both testnet and mainnet configurations:

- **Testnet**: Uses Hedera testnet (Chain ID: 296)
- **Mainnet**: Uses Hedera mainnet (Chain ID: 295)

Network-specific configurations are stored in:
- `backend/src/config/testnet.toml`
- `backend/src/config/mainnet.toml`

## 🏃‍♂️ Running the Project

### 1. Smart Contracts Setup

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Deploy contracts (testnet)
forge script script/DeployYielderaVault.s.sol --rpc-url hedera_testnet --broadcast --verify --verifier sourcify --verifier-url https://server-verify.hashscan.io

# Deploy contracts (mainnet)
forge script script/DeployYielderaVault.s.sol --rpc-url https://mainnet.hashio.io/api --broadcast --verify --verifier sourcify --verifier-url https://server-verify.hashscan.io
```

### 2. MCP Server Setup

```bash
# Navigate to MCP directory
cd mcp

# Build the MCP server
cargo build --release

# Run MCP server (for AI agent tools)
cargo run --no-default-features --features server

# Or run MCP client (for testing)
cargo run --no-default-features --features client
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Build the project
cargo build --release

# Run tests
cargo test

# Start the server (development) - This will automatically start MCP server
cargo run

# Start the server (production)
cargo run --release
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install

# Start development server
npm start
# or
yarn start

# Build for production
npm run build
# or
yarn build
```

### 5. Access the Application

Once all components are running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8090
- **Swagger UI**: http://127.0.0.1:8090/swagger-ui/
- **Health Check**: http://127.0.0.1:8090/health
- **MCP Server**: http://127.0.0.1:3001 (internal use)

## 📚 API Documentation

The project provides a comprehensive REST API with the following endpoints:

### Core Endpoints
- `GET /` - Index page
- `GET /health` - Health check
- `GET /vaults` - Get all managed vaults
- `POST /admin/associate-vault-tokens` - Associate tokens to vault (admin only)
- `POST /chat` - Chat with AI agent for liquidity management

### Frontend Routes
- `/` - Landing page with project information
- `/app` - Main application dashboard with AI chat
- `/deposit/:vaultAddress` - Deposit tokens into specific vault
- `/withdraw/:vaultAddress` - Withdraw tokens from specific vault

### Authentication
Admin endpoints require the `ADMIN_PASSWORD` to be provided in the request headers or body.

### AI Agent Features
The AI agent supports natural language commands for:
- Checking token balances
- Managing liquidity positions
- Supplying tokens to Bonzo lending protocol
- Analyzing market conditions
- Providing yield optimization recommendations

### Swagger Documentation
Interactive API documentation is available at http://127.0.0.1:8090/swagger-ui/ when the server is running.

## 🔧 Development

### Project Structure

```
Yieldera/
├── backend/                 # Rust backend application
│   ├── src/
│   │   ├── api/            # REST API endpoints
│   │   ├── config/         # Configuration management
│   │   ├── core/           # Core business logic & AI agent
│   │   ├── helpers/        # Utility functions
│   │   ├── state/          # Application state management
│   │   ├── strategies/     # Liquidity strategies
│   │   └── types/          # Type definitions
│   ├── logs/               # Application logs
│   └── Cargo.toml          # Rust dependencies
├── frontend/               # React/TypeScript frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services & wallet integration
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── tailwind.config.js  # Tailwind CSS configuration
├── contracts/              # Solidity smart contracts
│   ├── src/                # Contract source code
│   ├── script/             # Deployment scripts
│   ├── test/               # Contract tests
│   └── foundry.toml        # Foundry configuration
├── mcp/                    # Model Context Protocol server
│   ├── src/
│   │   ├── tools/          # AI agent tools (balance, bonzo, calculator)
│   │   ├── helpers.rs      # Helper functions
│   │   ├── tokens.json     # Token configuration
│   │   └── main.rs         # MCP server/client
│   └── Cargo.toml          # Rust dependencies
└── README.md
```

### Adding New Vaults

To add new vaults to the system:

1. Deploy a new `YielderaVault` contract
2. Add the contract address to the appropriate config file:
   - `backend/src/config/testnet.toml` (for testnet)
   - `backend/src/config/mainnet.toml` (for mainnet)
3. Restart the backend service

### AI Agent & MCP Integration

The project features a sophisticated AI agent powered by Google Gemini and Model Context Protocol (MCP):

#### AI Agent Capabilities
- **Natural Language Processing**: Understands user queries about liquidity management
- **Blockchain Operations**: Can check balances, supply tokens, and analyze positions
- **Market Analysis**: Provides insights on yield optimization and risk management
- **Real-time Interaction**: Chat-based interface for seamless user experience

#### MCP Tools Available
- **Balance Checker**: Get native HBAR balance for any account
- **Bonzo Integration**: Supply tokens to Bonzo lending protocol
- **Calculator Tools**: Mathematical operations for yield calculations
- **Token Management**: Support for USDC, SAUCE, and other Hedera tokens

#### Usage Examples
```bash
# Chat with AI agent through frontend or API
"Check my HBAR balance"
"Supply 0.1 HBAR to Bonzo"
"What's the best yield strategy for my portfolio?"
"Analyze current market conditions"
```

### Logging

The application uses structured logging with different levels:
- Logs are written to both console and files
- Log files are stored in `backend/logs/`
- Log level can be controlled via the `RUST_LOG` environment variable
- AI agent interactions are logged for debugging and analysis

## 🧪 Testing

### Backend Tests
```bash
cd backend
cargo test
```

### Frontend Tests
```bash
cd frontend
npm test
# or
yarn test
```

### Smart Contract Tests
```bash
cd contracts
forge test
```

### MCP Server Tests
```bash
cd mcp
cargo test
```

### Integration Tests
```bash
# Run specific backend test
cd backend
cargo test test_rebalance -- --nocapture

# Test AI agent functionality
cd mcp
cargo run --no-default-features --features client
```

### End-to-End Testing
1. Start all services (MCP, Backend, Frontend)
2. Connect wallet in frontend
3. Test AI chat functionality
4. Test vault deposit/withdraw operations

## 🚀 Deployment

### Production Deployment

1. **Prepare Environment**:
   ```bash
   # Set production environment variables
   export NETWORK="mainnet"
   export PRIVATE_KEY="your_mainnet_private_key"
   export ADMIN_PASSWORD="secure_production_password"
   ```

2. **Deploy Contracts**:
   ```bash
   cd contracts
   forge script script/DeployYielderaVault.s.sol --rpc-url https://mainnet.hashio.io/api --broadcast --verify
   ```

3. **Update Configuration**:
   - Update `backend/src/config/mainnet.toml` with deployed contract addresses
   - Ensure all vault addresses are correct

4. **Build and Run All Components**:
   ```bash
   # Build and run MCP server
   cd mcp
   cargo build --release
   cargo run --no-default-features --features server &

   # Build and run backend (will connect to MCP)
   cd ../backend
   cargo build --release
   ./target/release/yieldera &

   # Build and run frontend
   cd ../frontend
   npm run build
   npm install -g serve
   serve -s build -l 3000
   ```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to version control
- **API Keys**: Secure Gemini API keys for AI functionality
- **Admin Password**: Use strong passwords for admin endpoints
- **Network Security**: Consider using HTTPS in production
- **Wallet Security**: Frontend supports secure wallet connections
- **Access Control**: Implement proper access controls for admin functions
- **MCP Security**: MCP server runs locally and doesn't expose sensitive data
- **Environment Variables**: Use proper environment variable management
- **Monitoring**: Set up monitoring and alerting for production deployments

## 🔗 Links

### Hedera Ecosystem
- [Hedera Network](https://hedera.com/)
- [SaucerSwap](https://www.saucerswap.finance/) - Hedera's leading DEX
- [Bonzo Finance](https://bonzo.finance/) - Hedera lending protocol

### Development Tools
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### AI & MCP
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Google Gemini API](https://ai.google.dev/)
- [Rig Framework](https://github.com/0xPlaygrounds/rig)
