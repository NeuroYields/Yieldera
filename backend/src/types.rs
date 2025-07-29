use alloy::primitives::{Address, U256};
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Position {
    pub id: U256,
    pub token0: Address,
    pub token1: Address,
    pub fee: u32,
    pub tick_lower: i32,
    pub tick_upper: i32,
    pub liquidity: u128,
    pub fee_growth_inside0_last_x128: U256,
    pub fee_growth_inside1_last_x128: U256,
    pub tokens_owed0: u128,
    pub tokens_owed1: u128,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VaultTokenBalances {
    pub token0_balance: f64,
    pub token1_balance: f64,
    pub token0_balance_u256: U256,
    pub token1_balance_u256: U256,
}

#[derive(Debug, Clone)]
pub struct PrepareSwapArgs {
    pub exact_amount_out: f64,
    pub parsed_exact_amount_out: U256,
    pub token_in: Token,
    pub token_out: Token,
    pub is_swap_0_to_1: bool,
    pub max_amount_in: U256,
}
