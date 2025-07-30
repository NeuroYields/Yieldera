pub mod uniswap_v3;

use alloy::primitives::U256;
use color_eyre::eyre::Result;

use crate::helpers::math::uniswap_v3::{
    liquidity_math::{get_amount1_for_liquidity, get_liquidity_for_amount0},
    tick_math::get_sqrt_ratio_at_tick,
};

/// Convert a tick to a price.
/// It caclulate the price1 which the price of token1 per token0
pub fn tick_to_price(tick: i32, token0_decimals: u8, token1_decimals: u8) -> Result<f64> {
    let price_tick = 1.0001f64.powi(tick as i32);

    let diff_decimals = token1_decimals as i8 - token0_decimals as i8;

    let price = price_tick / 10f64.powi(diff_decimals as i32);

    Ok(price)
}

pub fn align_to_pool_tick_spacing(tick: i32, spacing: i32) -> i32 {
    tick - (tick % spacing)
}

pub fn convert_price_to_tick(
    price: f64,
    token0_decimals: u8,
    token1_decimals: u8,
    tick_spacing: i32,
) -> Result<i32> {
    let tick = price1_to_tick(price, token0_decimals, token1_decimals);

    // Align the tick to the pool tick spacing
    let aligned_tick = align_to_pool_tick_spacing(tick, tick_spacing);

    Ok(aligned_tick)
}

pub fn price1_to_tick(price: f64, token0_decimals: u8, token1_decimals: u8) -> i32 {
    let diff_decimals = token1_decimals as i8 - token0_decimals as i8;
    let adjusted_price = price * 10_f64.powi(diff_decimals as i32);

    let log_base = 1.0001_f64.ln(); // natural log of 1.0001
    (adjusted_price.ln() / log_base).floor() as i32
}

pub fn estimate_amount1_given_amount0(
    sqrt_price_x96: U256,
    tick_lower: i32,
    tick_upper: i32,
    amount0: U256,
) -> Result<U256> {
    let sqrt_lower = get_sqrt_ratio_at_tick(tick_lower).unwrap();
    let sqrt_upper = get_sqrt_ratio_at_tick(tick_upper).unwrap();

    // Estimate liquidity using amount0
    let liquidity = get_liquidity_for_amount0(sqrt_price_x96, sqrt_upper, amount0)?;

    // Estimate how much token1 is needed
    let amount1 = get_amount1_for_liquidity(sqrt_price_x96, sqrt_lower, liquidity)?;

    Ok(amount1)
}
