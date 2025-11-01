// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {SafeVault} from "../src/SafeVault.sol";

contract Deploy is Script {
    function run() external returns (address) {
        // --- Hardcoded Variables ---
        address usdcAddress = 0x3600000000000000000000000000000000000000;
        address initialOwner = 0x594CF75585509740F8ae7F148e9e0287BeE098F9; // <-- ADRESSE CORRIGÉE
        uint256 yieldRateBps = 400; // 4%

        // --- Deployment ---
        vm.startBroadcast();
        SafeVault safeVault = new SafeVault(usdcAddress, initialOwner, yieldRateBps);
        vm.stopBroadcast();

        console.log("SafeVault deployed to:", address(safeVault));
        
        return address(safeVault);
    }
}
