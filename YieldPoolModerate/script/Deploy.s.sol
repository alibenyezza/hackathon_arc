// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {YieldPoolModerate} from "../src/YieldPoolModerate.sol";

contract Deploy is Script {
    function run() external returns (address) {
        // --- Configuration for Arc Testnet ---
        address usdcAddress = 0x3600000000000000000000000000000000000000; // Arc USDC
        address initialOwner = 0x594CF75585509740F8ae7F148e9e0287BeE098F9; // Same owner as SafeVault
        uint256 apyBps = 500; // 5% APY for moderate pool

        // --- Deployment ---
        vm.startBroadcast();
        YieldPoolModerate yieldPool = new YieldPoolModerate(usdcAddress, initialOwner, apyBps);
        vm.stopBroadcast();

        console.log("YieldPoolModerate deployed to:", address(yieldPool));
        console.log("APY:", apyBps, "bps (5%)");
        console.log("Risk Tier: 2 (Medium)");
        
        return address(yieldPool);
    }
}

