// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/YielderaVault.sol"; // adjust path if needed

contract DeployYieldraVault is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // SAUCE-HBAR pool on tetsnet saucerswap
        address pool1 = 0x37814eDc1ae88cf27c0C346648721FB04e7E0AE7;

        YielderaVault vault1 = new YielderaVault(pool1);

        console.log("YielderaVault1 deployed to:", address(vault1));

        // USDC-DAI pool on testnet saucerswap
        address pool2 = 0xb431866114B634F611774ec0d094BF11cb91c7E4;

        YielderaVault vault2 = new YielderaVault(pool2);

        console.log("YielderaVault2 deployed to:", address(vault2));

        vm.stopBroadcast();
    }
}
