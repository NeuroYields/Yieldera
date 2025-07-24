use alloy::primitives::U256;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Vaultdetails {
    pub address: String,
    pub pool: Pool,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: f64,
    pub lower_tick: i32,
    pub upper_tick: i32,
    pub position_token_id: U256,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Pool {
    pub address: String,
    pub token0: Token,
    pub token1: Token,
    pub fee: f64,
    pub tick_spacing: i32,
    pub current_tick: i32,
    pub sqrt_price_x96: U256,
    pub price1: f64,
    pub price0: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Token {
    pub address: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub is_native_wrapper: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TickRange {
    pub curent_tick: i32,
    pub lower_tick: i32,
    pub upper_tick: i32,
}
