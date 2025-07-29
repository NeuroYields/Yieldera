use crate::types::WebAppState;
use color_eyre::eyre::Result;
use tracing::info;

pub async fn start_vault_liq_management(
    vault_address: &str,
    _app_state: WebAppState,
) -> Result<(), std::io::Error> {
    info!(
        "Vault liquidity management loop started for vault address: {:?}",
        vault_address
    );
    Ok(())
}
