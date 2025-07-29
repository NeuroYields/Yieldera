use std::str::FromStr;

use alloy::{
    primitives::Address,
    providers::{Provider, WalletProvider},
    sol,
};
use color_eyre::eyre::Result;

use crate::{
    config::NON_FUNGIBLE_POSITION_MANAGER_ADDRESS,
    types::{Position, VaultDetails},
};

sol!(
    #[sol(rpc)]
    contract INonfungiblePositionManager {
    /// @notice Returns the position information associated with a given token ID.
    /// @dev Throws if the token serial number is not valid.
    /// @param tokenSN The serial number of the token that represents the position
    /// @return token0 The address of the token0 for a specific pool
    /// @return token1 The address of the token1 for a specific pool
    /// @return fee The fee associated with the pool
    /// @return tickLower The lower end of the tick range for the position
    /// @return tickUpper The higher end of the tick range for the position
    /// @return liquidity The liquidity of the position
    /// @return feeGrowthInside0LastX128 The fee growth of token0 as of the last action on the individual position
    /// @return feeGrowthInside1LastX128 The fee growth of token1 as of the last action on the individual position
    /// @return tokensOwed0 The uncollected amount of token0 owed to the position as of the last computation
    /// @return tokensOwed1 The uncollected amount of token1 owed to the position as of the last computation
    function positions(uint256 tokenSN)
        external
        view
        returns (
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );
    }
);
