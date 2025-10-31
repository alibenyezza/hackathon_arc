// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SafeVault
 * @author Your Name
 * @notice A secure vault for depositing and withdrawing USDC to earn a simulated yield.
 * This contract is the on-chain component of the Treasury Autopilot system for the Arc Hackathon.
 * It is designed to hold USDC and simulate a yield for demonstration purposes.
 *
 * The contract accepts USDC deposits, allows the owner (the AI agent/backend) to withdraw funds,
 * and emits events for all significant actions. Access is restricted to an owner to ensure
 * that only the authorized AI agent can manage the funds.
 */
contract SafeVault is Ownable, ReentrancyGuard {
    /// @notice The ERC20 token contract that this vault will interact with (USDC).
    IERC20 public immutable usdcToken;

    /// @notice A simulated annual percentage yield (APY) rate, represented in basis points.
    /// For example, 400 represents a 4.00% APY.
    uint256 public yieldRateBps;

    /// @notice The total amount of USDC currently held by this contract.
    uint256 public totalUsdcBalance;

    /// @dev Emitted when funds are deposited into the vault.
    event Deposit(address indexed depositor, uint256 amount);

    /// @dev Emitted when funds are withdrawn from the vault.
    event Withdraw(address indexed withdrawer, address indexed recipient, uint256 amount);
    
    /// @dev Emitted when a critical alert is triggered by the Sentinel Agent.
    event AlertTriggered(string reason);

    /**
     * @param _usdcAddress The contract address of the USDC token on the Arc network.
     * @param _initialOwner The address of the contract owner (e.g., the deployer or AI agent's wallet).
     * @param _initialYieldRateBps The initial simulated yield rate in basis points (e.g., 400 for 4%).
     */
    constructor(
        address _usdcAddress,
        address _initialOwner,
        uint256 _initialYieldRateBps
    ) Ownable(_initialOwner) { // <-- LA CORRECTION EST ICI
        require(_usdcAddress != address(0), "SafeVault: USDC address cannot be zero");
        usdcToken = IERC20(_usdcAddress);
        yieldRateBps = _initialYieldRateBps;
    }

    /**
     * @notice Deposits a specified amount of USDC into the vault.
     * @dev This function can be called by anyone, but requires prior approval of the USDC token.
     * It updates the total balance and emits a Deposit event.
     * @param _amount The amount of USDC to deposit.
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "SafeVault: Deposit amount must be greater than zero");
        
        uint256 beforeBalance = usdcToken.balanceOf(address(this));
        usdcToken.transferFrom(msg.sender, address(this), _amount);
        uint256 afterBalance = usdcToken.balanceOf(address(this));

        require(afterBalance == beforeBalance + _amount, "SafeVault: Deposit transfer failed");

        totalUsdcBalance += _amount;
        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice Withdraws a specified amount of USDC from the vault to a recipient.
     * @dev This is an owner-only function to ensure only the AI agent can move funds.
     * It prevents withdrawing more funds than are available and emits a Withdraw event.
     * @param _amount The amount of USDC to withdraw.
     * @param _recipient The address to send the withdrawn USDC to.
     */
    function withdraw(uint256 _amount, address _recipient) external onlyOwner nonReentrant {
        require(_amount > 0, "SafeVault: Withdraw amount must be greater than zero");
        require(totalUsdcBalance >= _amount, "SafeVault: Insufficient funds in vault");
        require(_recipient != address(0), "SafeVault: Recipient address cannot be zero");

        totalUsdcBalance -= _amount;
        
        bool success = usdcToken.transfer(_recipient, _amount);
        require(success, "SafeVault: Withdrawal transfer failed");

        emit Withdraw(msg.sender, _recipient, _amount);
    }
    
    /**
     * @notice Gets the vault's key financial metrics.
     * @return _totalUsdcBalance The total USDC balance held in the vault.
     * @return _yieldRateBps The current simulated APY in basis points.
     */
    function getBalances() external view returns (uint256 _totalUsdcBalance, uint256 _yieldRateBps) {
        return (totalUsdcBalance, yieldRateBps);
    }

    /**
     * @notice Gets the current simulated yield rate.
     * @return The yield rate in basis points.
     */
    function getYieldRate() external view returns (uint256) {
        return yieldRateBps;
    }

    /**
     * @notice Updates the simulated yield rate.
     * @dev This is an owner-only function for administrative control.
     * @param _newYieldRateBps The new yield rate in basis points.
     */
    function setYieldRate(uint256 _newYieldRateBps) external onlyOwner {
        yieldRateBps = _newYieldRateBps;
    }

    /**
     * @notice A function for the Sentinel Agent to trigger an on-chain alert.
     * @dev This is an owner-only function that emits an event for off-chain listeners to act upon.
     * @param _reason A string describing the reason for the alert.
     */
    function triggerAlert(string calldata _reason) external onlyOwner {
        emit AlertTriggered(_reason);
    }
}