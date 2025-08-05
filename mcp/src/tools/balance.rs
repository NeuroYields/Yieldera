use std::str::FromStr;

use alloy::{
    network,
    primitives::{Address, utils::format_units},
    providers::{Provider, ProviderBuilder},
    signers::local::PrivateKeySigner,
};
use color_eyre::eyre::Result;
use mcp_core::tool_text_content;
use mcp_core::types::ToolResponseContent;
use mcp_core_macros::{tool, tool_param};

#[tool(
    name = "get_native_hbar_balance",
    description = "Get the native coin balance (HBAR) of an account",
    annotations(title = "Get Native Coin Balance (HBAR)")
)]
async fn get_hbar_balance_tool(
    account_address: tool_param!(
        String,
        description = "The address of the account to get the  native coin balance (HBAR) of"
    ),
    network: tool_param!(
        String,
        description = "The network to use (testnet or mainnet)",
        default = "testnet"
    ),
) -> Result<ToolResponseContent> {
    let private_key_str = std::env::var("PRIVATE_KEY")?;
    let evm_signer = PrivateKeySigner::from_str(private_key_str.as_str())?;

    let testnet_rpc = "https://testnet.hashio.io/api";
    let mainnet_rpc = "https://mainnet.hashio.io/api";
    let testnet_chain_id = 296;
    let mainnet_chain_id = 295;

    let is_mainnet = network.to_lowercase() == "mainnet";

    let rpc_url = if is_mainnet { mainnet_rpc } else { testnet_rpc };

    let chain_id = if is_mainnet {
        mainnet_chain_id
    } else {
        testnet_chain_id
    };

    let evm_provider = ProviderBuilder::new()
        .with_chain_id(chain_id)
        .wallet(evm_signer)
        .connect(rpc_url)
        .await?;

    let parsed_balance = evm_provider
        .get_balance(Address::from_str(account_address.as_str())?)
        .await?;

    let balance = format_units(parsed_balance, 18)?;

    Ok(tool_text_content!(balance))
}
