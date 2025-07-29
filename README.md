# Yieldera - AI Automated Liquidity Management for Hedera

Yieldera is an AI automated liquidity management protocol built for the Hedera network. It provides intelligent vault strategies(AI) for Uniswap V3 liquidity positions, automatically rebalancing positions to optimize yield and minimize impermanent loss.

## 🏗️ Architecture

The project consists of two main components:

### Backend (Rust)
- **Liquidity Management Engine**: Automated rebalancing logic for vault positions
- **REST API**: HTTP server with Swagger documentation for vault management
- **Multi-Vault Support**: Concurrent management of multiple liquidity vaults
- **Real-time Monitoring**: Continuous monitoring and adjustment of liquidity positions

### Smart Contracts (Solidity)
- **YielderaVault**: Core vault contract for managing Uniswap V3 positions
- **Hedera Integration**: Native support for HBAR and Hedera tokens
- **Position Management**: Automated minting, burning, and rebalancing of liquidity positions

## 🚀 Features

- ✅ **Automated Rebalancing**: Intelligent position management based on market conditions
- ✅ **Multi-Token Support**: Support for HBAR and HTS tokens
- ✅ **Fee Collection**: Automatic collection and reinvestment of trading fees
- ✅ **REST API**: Complete API for vault management and monitoring
- ✅ **Swagger Documentation**: Interactive API documentation
- ✅ **Real-time Logging**: Comprehensive logging and monitoring
- ✅ **Testnet & Mainnet**: Support for both Hedera testnet and mainnet

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

### System Requirements
- **Rust** (latest stable version)
- **Foundry** (for smart contract development)

### Installation Commands

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## ⚙️ Configuration

### 1. Environment Variables

Create `.env` files in both `backend/` and `contracts/` directories:

#### Backend Environment (`backend/.env`)
```bash
# Copy from example
cp backend/.env.exemple backend/.env

# Edit the file with your values
PRIVATE_KEY="0x..." # Your private key (without 0x prefix)
NETWORK="testnet"   # or "mainnet"
ADMIN_PASSWORD="your_secure_password"
```

#### Contracts Environment (`contracts/.env`)
```bash
# Copy from example
cp contracts/.env.exemple contracts/.env

# Edit the file with your values
PRIVATE_KEY="0x..." # Your private key for deployment
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

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Build the project
cargo build --release

# Run tests
cargo test

# Start the server (development)
cargo run

# Start the server (production)
cargo run --release
```

### 3. Access the Application

Once the backend is running, you can access:

- **API Server**: http://127.0.0.1:8080
- **Swagger UI**: http://127.0.0.1:8080/swagger-ui/
- **Health Check**: http://127.0.0.1:8080/health

## 📚 API Documentation

The project provides a comprehensive REST API with the following endpoints:

### Core Endpoints
- `GET /` - Index page
- `GET /health` - Health check
- `GET /vaults` - Get all managed vaults
- `POST /admin/associate-vault-tokens` - Associate tokens to vault (admin only)

### Authentication
Admin endpoints require the `ADMIN_PASSWORD` to be provided in the request headers or body.

### Swagger Documentation
Interactive API documentation is available at http://127.0.0.1:8080/swagger-ui/ when the server is running.

## 🔧 Development

### Project Structure

```
Yieldera/
├── backend/                 # Rust backend application
│   ├── src/
│   │   ├── api/            # REST API endpoints
│   │   ├── config/         # Configuration management
│   │   ├── core/           # Core business logic
│   │   ├── helpers/        # Utility functions
│   │   ├── state/          # Application state management
│   │   ├── strategies/     # Liquidity strategies
│   │   └── types/          # Type definitions
│   ├── logs/               # Application logs
│   └── Cargo.toml          # Rust dependencies
├── contracts/              # Solidity smart contracts
│   ├── src/                # Contract source code
│   ├── script/             # Deployment scripts
│   ├── test/               # Contract tests
│   └── foundry.toml        # Foundry configuration
└── README.md
```

### Adding New Vaults

To add new vaults to the system:

1. Deploy a new `YielderaVault` contract
2. Add the contract address to the appropriate config file:
   - `backend/src/config/testnet.toml` (for testnet)
   - `backend/src/config/mainnet.toml` (for mainnet)
3. Restart the backend service

### Logging

The application uses structured logging with different levels:
- Logs are written to both console and files
- Log files are stored in `backend/logs/`
- Log level can be controlled via the `RUST_LOG` environment variable

## 🧪 Testing

### Backend Tests
```bash
cd backend
cargo test
```

### Smart Contract Tests
```bash
cd contracts
forge test
```

### Integration Tests
```bash
# Run specific test
cd backend
cargo test test_rebalance -- --nocapture
```

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

4. **Build and Run Backend**:
   ```bash
   cd backend
   cargo build --release
   ./target/release/yieldera
   ```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to version control
- **Admin Password**: Use strong passwords for admin endpoints
- **Network Security**: Consider using HTTPS in production
- **Access Control**: Implement proper access controls for admin functions
- **Monitoring**: Set up monitoring and alerting for production deployments

## 🔗 Links

- [Hedera Network](https://hedera.com/)
- [SaucerSwap](https://www.saucerswap.finance/) - Hedera's leading DEX
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Rust Documentation](https://doc.rust-lang.org/)