// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/YielderaVault.sol"; // adjust path if needed

contract DeployYieldraVault is Script {
    function run() external {
        uint256 pk;
        string memory network = vm.envString("NETWORK");
        bool isMainnet = keccak256(abi.encodePacked(network)) ==
            keccak256(abi.encodePacked("mainnet"));

        if (isMainnet) {
            pk = vm.envUint("MAINNET_PRIVATE_KEY");
            console.log("Deploying on mainnet..");

            address whbar_address = 0x0000000000000000000000000000000000163B5a;
            address whbar_helper_address = 0x000000000000000000000000000000000058A2BA;
            address saucer_nft_token = 0x00000000000000000000000000000000003dDC0B;
            address saucer_factory_address = 0x00000000000000000000000000000000003c3951;
            address nonfungible_position_manager_address = 0x00000000000000000000000000000000003DDbb9;
            address swap_router_address = 0x00000000000000000000000000000000003c437A;

            vm.startBroadcast(pk);

            // USDC-HBAR pool on mainnet saucerswap
            address pool1 = 0xC5B707348dA504E9Be1bD4E21525459830e7B11d;

            YielderaVault vault1 = new YielderaVault(
                pool1,
                whbar_address,
                whbar_helper_address,
                saucer_nft_token,
                saucer_factory_address,
                nonfungible_position_manager_address,
                swap_router_address
            );

            console.log("YielderaVault1 deployed to:", address(vault1));

            vm.stopBroadcast();
        } else {
            console.log("Deploying on testnet..");
            pk = vm.envUint("TESTNET_PRIVATE_KEY");

            address whbar_address = 0x0000000000000000000000000000000000003aD2;
            address whbar_helper_address = 0x000000000000000000000000000000000050a8a7;
            address saucer_nft_token = 0x000000000000000000000000000000000013feE4;
            address saucer_factory_address = 0x00000000000000000000000000000000001243eE;
            address nonfungible_position_manager_address = 0x000000000000000000000000000000000013F618;
            address swap_router_address = 0x0000000000000000000000000000000000159398;

            vm.startBroadcast(pk);

            // SAUCE-HBAR pool on tetsnet saucerswap
            address pool1 = 0x37814eDc1ae88cf27c0C346648721FB04e7E0AE7;

            YielderaVault vault1 = new YielderaVault(
                pool1,
                whbar_address,
                whbar_helper_address,
                saucer_nft_token,
                saucer_factory_address,
                nonfungible_position_manager_address,
                swap_router_address
            );

            console.log("YielderaVault1 deployed to:", address(vault1));

            // USDC-DAI pool on testnet saucerswap
            address pool2 = 0xb431866114B634F611774ec0d094BF11cb91c7E4;

            YielderaVault vault2 = new YielderaVault(
                pool2,
                whbar_address,
                whbar_helper_address,
                saucer_nft_token,
                saucer_factory_address,
                nonfungible_position_manager_address,
                swap_router_address
            );

            console.log("YielderaVault2 deployed to:", address(vault2));

            vm.stopBroadcast();
        }
    }
}
