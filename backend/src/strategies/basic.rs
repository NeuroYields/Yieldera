/*
    This Strategy will be very simple calculation that will always put a range of -1% at the left of the price and 1% at the right of the price
*/

use crate::{
    helpers,
    types::{TickRange, VaultDetails},
};
use color_eyre::eyre::Result;
use tracing::info;

pub async fn get_best_range(vault: &VaultDetails) -> Result<TickRange> {
    let current_price = vault.pool.price1;
    let pool_tick_spacing = vault.pool.tick_spacing;

    // Low = current price - 1%
    let low_price = current_price - current_price * 0.01;
    // High = current price + 1%
    let high_price = current_price + current_price * 0.01;

    info!("Basic Strategy Low price: {}", low_price);
    info!("Basic Strategy High price: {}", high_price);

    let token0_decimals = vault.pool.token0.decimals;
    let token1_decimals = vault.pool.token1.decimals;

    let lower_tick = helpers::math::convert_price_to_tick(
        low_price,
        token0_decimals,
        token1_decimals,
        pool_tick_spacing,
    )?;
    let upper_tick = helpers::math::convert_price_to_tick(
        high_price,
        token0_decimals,
        token1_decimals,
        pool_tick_spacing,
    )?;

    Ok(TickRange {
        curent_tick: vault.pool.current_tick,
        lower_tick,
        upper_tick,
    })
}
