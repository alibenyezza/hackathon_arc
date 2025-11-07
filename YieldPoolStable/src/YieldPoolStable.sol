// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldPoolStable
 * @author TreasuryPilot Team
 * @notice A simulated low-risk yield pool for the TreasuryPilot system on Arc.
 * This pool represents a conservative DeFi lending strategy with stable returns.
 * 
 * @dev This contract simulates a 3% APY yield pool. The SafeVault (treasury) can
 * deposit USDC into this pool to earn simulated yields. This is designed for
 * demonstration purposes on Arc testnet where real DeFi protocols may not exist.
 */
contract YieldPoolStable is Ownable, ReentrancyGuard {
    /// @notice The USDC token contract on Arc network
    IERC20 public immutable usdcToken;

    /// @notice Annual Percentage Yield in basis points (300 = 3.00%)
    uint256 public apyBps;

    /// @notice Total USDC assets deposited in this pool
    uint256 public totalAssets;

    /// @notice Timestamp of last yield accumulation
    uint256 public lastYieldUpdate;

    /// @notice Mapping of depositor addresses to their deposited amounts
    mapping(address => uint256) public deposits;

    /// @notice Risk tier of this pool (1 = Low, 2 = Medium, 3 = High)
    uint8 public constant RISK_TIER = 1;

    /// @dev Emitted when USDC is deposited into the pool
    event Deposited(address indexed depositor, uint256 amount, uint256 newTotal);

    /// @dev Emitted when USDC is withdrawn from the pool
    event Withdrawn(address indexed withdrawer, uint256 amount, uint256 newTotal);

    /// @dev Emitted when the APY is updated
    event APYUpdated(uint256 oldAPY, uint256 newAPY);

    /// @dev Emitted when yield is accumulated
    event YieldAccumulated(uint256 yieldAmount, uint256 newTotal);

    /**
     * @param _usdcAddress The contract address of USDC on Arc network
     * @param _initialOwner The address that will own this contract (same as SafeVault owner)
     * @param _initialAPYBps The initial APY in basis points (e.g., 300 for 3%)
     */
    constructor(
        address _usdcAddress,
        address _initialOwner,
        uint256 _initialAPYBps
    ) Ownable(_initialOwner) {
        require(_usdcAddress != address(0), "YieldPoolStable: USDC address cannot be zero");
        require(_initialAPYBps > 0, "YieldPoolStable: APY must be greater than zero");
        
        usdcToken = IERC20(_usdcAddress);
        apyBps = _initialAPYBps;
        lastYieldUpdate = block.timestamp;
    }

    /**
     * @notice Deposits USDC into the yield pool
     * @dev Callable by anyone (typically SafeVault). Requires prior USDC approval.
     * @param _amount The amount of USDC to deposit
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "YieldPoolStable: Deposit amount must be greater than zero");
        
        uint256 beforeBalance = usdcToken.balanceOf(address(this));
        usdcToken.transferFrom(msg.sender, address(this), _amount);
        uint256 afterBalance = usdcToken.balanceOf(address(this));

        require(afterBalance == beforeBalance + _amount, "YieldPoolStable: Deposit transfer failed");

        deposits[msg.sender] += _amount;
        totalAssets += _amount;

        emit Deposited(msg.sender, _amount, totalAssets);
    }

    /**
     * @notice Withdraws USDC from the yield pool
     * @dev Only the depositor can withdraw their own funds
     * @param _amount The amount of USDC to withdraw
     */
    function withdraw(uint256 _amount) external nonReentrant {
        require(_amount > 0, "YieldPoolStable: Withdraw amount must be greater than zero");
        require(deposits[msg.sender] >= _amount, "YieldPoolStable: Insufficient deposit balance");
        require(totalAssets >= _amount, "YieldPoolStable: Insufficient pool liquidity");

        deposits[msg.sender] -= _amount;
        totalAssets -= _amount;

        bool success = usdcToken.transfer(msg.sender, _amount);
        require(success, "YieldPoolStable: Withdrawal transfer failed");

        emit Withdrawn(msg.sender, _amount, totalAssets);
    }

    /**
     * @notice Simulates yield accumulation based on time elapsed and APY
     * @dev This function can be called by anyone to update the pool's yield.
     * In production, this would be called by the AI agent periodically.
     */
    function accumulateYield() external {
        uint256 timeElapsed = block.timestamp - lastYieldUpdate;
        
        if (timeElapsed == 0 || totalAssets == 0) {
            return;
        }

        // Calculate yield: (totalAssets * APY * timeElapsed) / (365 days * 10000)
        // APY is in basis points (300 = 3%), so we divide by 10000
        uint256 yieldAmount = (totalAssets * apyBps * timeElapsed) / (365 days * 10000);
        
        totalAssets += yieldAmount;
        lastYieldUpdate = block.timestamp;

        emit YieldAccumulated(yieldAmount, totalAssets);
    }

    /**
     * @notice Returns the current APY of this pool
     * @return The APY in basis points
     */
    function currentAPY() external view returns (uint256) {
        return apyBps;
    }

    /**
     * @notice Updates the APY rate
     * @dev Owner-only function to adjust yields for demonstration purposes
     * @param _newAPYBps The new APY in basis points
     */
    function setAPY(uint256 _newAPYBps) external onlyOwner {
        require(_newAPYBps > 0, "YieldPoolStable: APY must be greater than zero");
        
        uint256 oldAPY = apyBps;
        apyBps = _newAPYBps;

        emit APYUpdated(oldAPY, _newAPYBps);
    }

    /**
     * @notice Returns the deposited amount for a specific address
     * @param _depositor The address to check
     * @return The amount deposited by the address
     */
    function getDeposit(address _depositor) external view returns (uint256) {
        return deposits[_depositor];
    }

    /**
     * @notice Returns pool information
     * @return _totalAssets Total USDC in pool
     * @return _apyBps Current APY in basis points
     * @return _riskTier Risk tier (1 = Low)
     */
    function getPoolInfo() external view returns (
        uint256 _totalAssets,
        uint256 _apyBps,
        uint8 _riskTier
    ) {
        return (totalAssets, apyBps, RISK_TIER);
    }
}

