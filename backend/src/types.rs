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
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Token {
    pub address: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub is_native_wrapper: bool,
}
