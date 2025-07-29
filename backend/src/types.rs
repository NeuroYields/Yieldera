use actix_web::web;
use alloy::primitives::{Address, U256};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::state::AppState;

pub type EvmProvider = alloy::providers::fillers::FillProvider<
    alloy::providers::fillers::JoinFill<
        alloy::providers::fillers::JoinFill<
            alloy::providers::fillers::JoinFill<
                alloy::providers::Identity,
                alloy::providers::fillers::JoinFill<
                    alloy::providers::fillers::GasFiller,
                    alloy::providers::fillers::JoinFill<
                        alloy::providers::fillers::BlobGasFiller,
                        alloy::providers::fillers::JoinFill<
                            alloy::providers::fillers::NonceFiller,
                            alloy::providers::fillers::ChainIdFiller,
                        >,
                    >,
                >,
            >,
            alloy::providers::fillers::ChainIdFiller,
        >,
        alloy::providers::fillers::WalletFiller<alloy::network::EthereumWallet>,
    >,
    alloy::providers::RootProvider,
>;

pub type WebAppState = web::Data<AppState>;

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct VaultDetails {
    pub address: String,
    pub pool: Pool,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: f64,
    pub lower_tick: i32,
    pub upper_tick: i32,
    pub is_active: bool,
    pub is_vault_tokens_associated: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct Pool {
    pub address: String,
    pub token0: Token,
    pub token1: Token,
    pub fee: f64,
    pub tick_spacing: i32,
    pub current_tick: i32,
    #[schema(value_type = String)]
    pub sqrt_price_x96: U256,
    pub price1: f64,
    pub price0: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
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

/// Top-level config struct matching the TOML file structure
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TomlConfig {
    pub rpc_url: String,
    pub chain_id: u64,
    pub non_fungible_position_manager_address: String,
    pub hbar_evm_address: String,
    pub vaults: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, ToSchema)]
pub struct AdminAssociateVaultTokensRequest {
    pub vault_address: String,
}
