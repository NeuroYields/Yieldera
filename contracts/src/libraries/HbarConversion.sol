// SPDX-License-Identifier: MIT
pragma solidity >=0.8.12;

import "../interfaces/IExchangeRate.sol";

library HbarConversion {
    address public constant exchangeRatePrecompileAddress = address(0x168);

    function tinycentsToTinybars(
        uint256 tinycents
    ) public returns (uint256 tinybars) {
        (bool success, bytes memory result) = exchangeRatePrecompileAddress
            .call(
                abi.encodeWithSelector(
                    IExchangeRate.tinycentsToTinybars.selector,
                    tinycents
                )
            );
        require(success, "TinycentsToTinybars failed!");
        tinybars = abi.decode(result, (uint256));
    }

    function tinybarsToTinycents(
        uint256 tinybars
    ) public returns (uint256 tinycents) {
        (bool success, bytes memory result) = exchangeRatePrecompileAddress
            .call(
                abi.encodeWithSelector(
                    IExchangeRate.tinybarsToTinycents.selector,
                    tinybars
                )
            );
        require(success, "TinybarsToTinycents failed!");
        tinycents = abi.decode(result, (uint256));
    }
}
