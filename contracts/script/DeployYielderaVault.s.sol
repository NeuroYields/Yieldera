// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/YielderaVault.sol"; // adjust path if needed

contract DeployYieldraVault is Script {
    function run() external returns (address) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // SAUCE-HBAR pool on tetsnet saucerswap
        address pool = 0x37814eDc1ae88cf27c0C346648721FB04e7E0AE7;

        YielderaVault helper = new YielderaVault(pool);

        vm.stopBroadcast();
        console.log("YielderaVault deployed to:", address(helper));
        return address(helper);
    }
}
