use std::str::FromStr;

use alloy::{providers::ProviderBuilder, signers::local::PrivateKeySigner};

use color_eyre::eyre::Result;
use tracing::info;

use crate::{
    config::CONFIG,
    core,
    types::{EvmProvider, WebAppState},
};

pub async fn init_evm_provider() -> Result<EvmProvider> {
    let private_key = CONFIG.private_key.as_str();
    let chain_id = CONFIG.toml_config.chain_id;
    let rpc_url = CONFIG.toml_config.rpc_url.as_str();

    let evm_signer = PrivateKeySigner::from_str(private_key)?;

    // Init provider with the specified rpc url in config
    let evm_provider = ProviderBuilder::new()
        .with_chain_id(chain_id)
        .wallet(evm_signer)
        .connect(rpc_url)
        .await?;

    Ok(evm_provider)
}

pub async fn init_all_vaults(app_state: &WebAppState) -> Result<()> {
    let provider = &app_state.evm_provider;
    let all_vaults_addresses = CONFIG.toml_config.vaults.clone();
    let all_vaults = &app_state.all_vaults;

    // TODO: add retry mechanism for each vault fetch
    for vault_address in all_vaults_addresses {
        // Fetch vault details and store them into the app state
        info!("Fetching vault details for address: {:?}...", vault_address);

        let vault_details = core::vault::get_vault_details(provider, &vault_address).await?;

        all_vaults.insert(vault_address.clone(), vault_details);

        info!(
            "Completed fetching vault details for address: {:?}.",
            vault_address
        );
    }

    info!("Fetched {} vaults details.", all_vaults.len());

    Ok(())
}
