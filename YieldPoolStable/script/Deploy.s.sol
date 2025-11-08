// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {YieldPoolStable} from "../src/YieldPoolStable.sol";

contract Deploy is Script {
    function run() external returns (address) {
        // --- Configuration for Arc Testnet ---
        address usdcAddress = 0x3600000000000000000000000000000000000000; // Arc USDC
        address initialOwner = 0x594CF75585509740F8ae7F148e9e0287BeE098F9; // Same owner as SafeVault
        uint256 apyBps = 300; // 3% APY for stable pool

        // --- Deployment ---
        vm.startBroadcast();
        YieldPoolStable yieldPool = new YieldPoolStable(usdcAddress, initialOwner, apyBps);
        vm.stopBroadcast();

        console.log("YieldPoolStable deployed to:", address(yieldPool));
        console.log("APY:", apyBps, "bps (3%)");
        console.log("Risk Tier: 1 (Low)");
        
        return address(yieldPool);
    }
}

