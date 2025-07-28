use std::str::FromStr;

use alloy::{
    primitives::Address,
    providers::{Provider, WalletProvider},
    sol,
};
use color_eyre::eyre::Result;

use crate::{
    config::NON_FUNGIBLE_POSITION_MANAGER_ADDRESS,
    types::{Position, Vaultdetails},
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

pub async fn get_position_by_id<P>(provider: &P, vault: &Vaultdetails) -> Result<Position>
where
    P: Provider + WalletProvider,
{
    let nfmp_address = Address::from_str(NON_FUNGIBLE_POSITION_MANAGER_ADDRESS)?;

    let nfmp = INonfungiblePositionManager::new(nfmp_address, provider);

    let position = nfmp.positions(vault.position_token_id).call().await?;

    let fee: f64 = position.fee.into();

    Ok(Position {
        id: vault.position_token_id,
        token0: position.token0,
        token1: position.token1,
        fee: fee as u32,
        tick_lower: position.tickLower.as_i32(),
        tick_upper: position.tickUpper.as_i32(),
        liquidity: position.liquidity,
        fee_growth_inside0_last_x128: position.feeGrowthInside0LastX128,
        fee_growth_inside1_last_x128: position.feeGrowthInside1LastX128,
        tokens_owed0: position.tokensOwed0,
        tokens_owed1: position.tokensOwed1,
    })
}
