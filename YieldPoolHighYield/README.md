# YieldPoolHighYield

**High-Risk/High-Yield Pool for TreasuryPilot System on Arc**

## Overview

YieldPoolHighYield is a simulated high-risk DeFi yield pool designed for the TreasuryPilot autonomous treasury management system. This contract represents an aggressive lending strategy with higher returns (9% APY).

## Key Features

- **Risk Tier**: 3 (High Risk)
- **Default APY**: 9% (900 basis points)
- **Token**: USDC on Arc Network
- **Network**: Arc L1 Blockchain

## Smart Contract Details

### Core Functions

- `deposit(uint256 _amount)` - Deposit USDC into the pool
- `withdraw(uint256 _amount)` - Withdraw USDC from the pool
- `accumulateYield()` - Simulate yield accumulation over time
- `currentAPY()` - Get the current APY in basis points
- `setAPY(uint256 _newAPYBps)` - Update APY (owner only)
- `getPoolInfo()` - Get pool stats (total assets, APY, risk tier)

### Contract Addresses

- **USDC on Arc**: `0x3600000000000000000000000000000000000000`
- **Owner Wallet**: `0x594CF75585509740F8ae7F148e9e0287BeE098F9`

## Build & Deploy

### Prerequisites

```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy to Arc Testnet

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url <ARC_RPC_URL> --private-key <PRIVATE_KEY> --broadcast
```

## Integration with SafeVault

This pool is designed to work with the SafeVault (Treasury Vault) contract. The AI agent will:

1. Monitor APY across all pools
2. Compare risk/reward ratios
3. Allocate USDC from SafeVault to pools
4. Rebalance based on market conditions

## Architecture

```
SafeVault (Treasury)
    │
    ├─→ YieldPoolStable (3% APY, Low Risk)
    ├─→ YieldPoolModerate (5% APY, Medium Risk)
    └─→ YieldPoolHighYield (9% APY, High Risk)
```

## Events

- `Deposited` - Emitted when USDC is deposited
- `Withdrawn` - Emitted when USDC is withdrawn
- `YieldAccumulated` - Emitted when yield is calculated
- `APYUpdated` - Emitted when APY changes

## Security Features

- OpenZeppelin Ownable for access control
- ReentrancyGuard protection
- Balance verification on deposits/withdrawals
- Comprehensive input validation

## License

MIT License

