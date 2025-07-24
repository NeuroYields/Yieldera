mod config;
mod helpers;
mod strategies;
mod types;

use std::str::FromStr;

use alloy::{providers::ProviderBuilder, signers::local::PrivateKeySigner};
use color_eyre::eyre::Result;

use crate::config::{CHAIN_ID, RPC_URL};

#[tokio::main]
async fn main() -> Result<()> {
    // installs better panic hooks
    color_eyre::install()?;

    // load env vars
    dotenvy::dotenv().ok();

    let private_key = std::env::var("PRIVATE_KEY")?;

    let evm_signer = PrivateKeySigner::from_str(private_key.as_str())?;

    // Init provider with the specified rpc url in config
    let evm_provider = ProviderBuilder::new()
        .with_chain_id(CHAIN_ID)
        .wallet(evm_signer)
        .connect(RPC_URL)
        .await?;

    let contract_address = config::YIELDERA_CONTRACT_ADDRESS;

    let vault_details = helpers::vault::get_vault_details(&evm_provider, contract_address).await?;

    println!("{:#?}", vault_details);

    // helpers::vault::deposit_tokens_to_vault(&evm_provider, &vault_details, 2.0, 1000.0).await?;

    // Start strategy thta will get me the best tick range to put liq on
    let tick_range = strategies::basic::get_best_range(&vault_details).await?;

    println!("Tick range: {:#?}", tick_range);

    // println!("Trying to mint liquidity with fixed upper and lower ticks...");
    // helpers::vault::mint_liquidity(&evm_provider, &vault_details, 17100, 20100, 1.0, 700.0).await?;
    // println!("Minted liquidity with fixed upper and lower ticks.");

    Ok(())
}
