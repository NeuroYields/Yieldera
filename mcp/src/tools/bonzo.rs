use std::str::FromStr;

use alloy::{
    primitives::{
        Address, U256,
        utils::{format_units, parse_units},
    },
    providers::{ProviderBuilder, WalletProvider},
    signers::local::PrivateKeySigner,
    sol,
};
use color_eyre::eyre::Result;
use mcp_core::{
    tool_text_content,
    types::{TextContent, ToolResponseContent},
};
use mcp_core_macros::{tool, tool_param};

use crate::config::{TESTNET_CHAIN_ID, TESTNET_HBAR_ADDRESS, TESTNET_RPC_URL};

pub const LENDING_POOL_MAINNET_ADDRESS: &str = "0x236897c518996163e7b313ad21d1c9fcc7ba1afc";
pub const LENDING_POOL_TESTNET_ADDRESS: &str = "0x7710a96b01e02ed00768c3b39bfa7b4f1c128c62";

sol! {
    #[sol(rpc)]
    contract ERC20 {
        function name() view returns (string memory);
        function symbol() view returns (string memory);
        function decimals() view returns (uint8);
        function totalSupply() view returns (uint256);

        function balanceOf(address account) view returns (uint256);

        function allowance(address owner, address spender) view returns (uint256);

        function approve(address spender, uint256 value) returns (bool);
    }



    #[sol(rpc)]
    contract BonzoLendingPool {
        function deposit(
            address asset,
            uint256 amount,
            address onBehalfOf,
            uint16 referralCode
        ) external payable;

    }
}

#[tool(
    name = "supply_bonzo_token",
    description = "Supply a specific token to the bonzo (Lending and Borrowing) on hedera. This Tool will return a strcuctured json response to be returned to the frontend which will be used to execute the transaction on the blockchain.",
    annotations(title = "Supply Bonzo Token")
)]
async fn supply_bonzo_token_tool(
    token: tool_param!(
        String,
        description = "The token address to supply to the bonzo pool"
    ),
    amount: tool_param!(
        f64,
        description = "The amount of the token to supply to the bonzo pool"
    ),
    network: tool_param!(
        String,
        description = "The network to use (testnet or mainnet)",
        default = "testnet"
    ),
) -> Result<ToolResponseContent> {
    let response = format!(
        "Supplied {} of {} to the bonzo pool at address",
        amount, token,
    );

    println!("Response: {}", response);

    if network != "testnet" {
        return Err(color_eyre::eyre::eyre!(
            "Only testnet network is supported for now"
        ));
    }

    // load env vars
    dotenvy::dotenv().ok();

    let private_key = std::env::var("PRIVATE_KEY")?;

    let evm_signer = PrivateKeySigner::from_str(private_key.as_str())?;

    // Init provider with the specified rpc url in config
    let evm_provider = ProviderBuilder::new()
        .with_chain_id(TESTNET_CHAIN_ID)
        .wallet(evm_signer)
        .connect(TESTNET_RPC_URL)
        .await?;

    let bonzo_lending_pool_address = Address::from_str(LENDING_POOL_TESTNET_ADDRESS)?;

    // let token_address = Address::from_str("0x0000000000000000000000000000000000001549")?;
    let token_address = Address::from_str(&token)?;

    let is_native_token = token_address.to_string() == TESTNET_HBAR_ADDRESS;

    if is_native_token {
        todo!("Supply native token to bonzo pool not implemented yet");
    } else {
        let token_contract = ERC20::new(token_address, evm_provider.clone());
        let token_decimals = token_contract.decimals().call().await?;

        let balance = token_contract
            .balanceOf(evm_provider.default_signer_address())
            .call()
            .await?;

        let formatted_balance: f64 = format_units(balance, token_decimals)?.parse()?;
        let parsed_amount: U256 = parse_units(amount.to_string().as_str(), token_decimals)?.into();

        println!(
            "Balance of token {} is: {}",
            token_address, formatted_balance
        );

        if formatted_balance < amount {
            return Err(color_eyre::eyre::eyre!(
                "Not enough balance of token {} to supply {} to bonzo pool",
                token_address,
                amount
            ));
        }

        let allowance = token_contract
            .allowance(
                evm_provider.default_signer_address(),
                bonzo_lending_pool_address,
            )
            .call()
            .await?;

        if allowance < parsed_amount {
            // Approve the bonzo lending pool to spend the token
            let approve_tx = token_contract
                .approve(bonzo_lending_pool_address, parsed_amount)
                .send()
                .await?
                .get_receipt()
                .await?;

            println!("Approve tx Hash : {:?}", approve_tx.transaction_hash);

            let approve_tx_success = approve_tx.status();

            if !approve_tx_success {
                return Err(color_eyre::eyre::eyre!(
                    "Failed to approve token {} to bonzo lending pool",
                    token_address
                ));
            }

            println!("Approved token {} to bonzo lending pool", token_address);
        }

        println!("Parsed amount to supply: {}", parsed_amount);

        // Supply the token to the bonzo lending pool
        let bonzo_lending_pool = BonzoLendingPool::new(bonzo_lending_pool_address, &evm_provider);

        let tx = bonzo_lending_pool
            .deposit(
                token_address,
                parsed_amount,
                evm_provider.default_signer_address(),
                0,
            )
            .gas(800_000)
            .send()
            .await?
            .get_receipt()
            .await?;

        println!("Supply tx Hash : {:?}", tx.transaction_hash);

        let tx_success = tx.status();

        if !tx_success {
            return Err(color_eyre::eyre::eyre!(
                "Failed to supply token {} to bonzo lending pool",
                token_address
            ));
        }

        println!(
            "Supplied {} of token {} to bonzo lending pool",
            amount, token_address
        );
    }

    let response = SupplyBonzoTokenToolResponse {
        amount,
        token_address: token.to_string(),
    };

    let res = ToolResponseContent::Text(TextContent {
        content_type: "text".to_string(),
        text: serde_json::to_string(&response)?,
        annotations: None,
    });

    Ok(res)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SupplyBonzoTokenToolResponse {
    pub amount: f64,
    pub token_address: String,
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use alloy::{
        primitives::{
            Address, U256,
            utils::{format_units, parse_units},
        },
        providers::{ProviderBuilder, WalletProvider},
        signers::local::PrivateKeySigner,
    };

    use crate::config::{TESTNET_CHAIN_ID, TESTNET_HBAR_ADDRESS, TESTNET_RPC_URL};

    use super::*;

    #[tokio::test]
    async fn test_supply_bonzo_token() -> Result<()> {
        // load env vars
        dotenvy::dotenv().ok();

        let private_key = std::env::var("PRIVATE_KEY")?;

        let evm_signer = PrivateKeySigner::from_str(private_key.as_str())?;

        // Init provider with the specified rpc url in config
        let evm_provider = ProviderBuilder::new()
            .with_chain_id(TESTNET_CHAIN_ID)
            .wallet(evm_signer)
            .connect(TESTNET_RPC_URL)
            .await?;

        let bonzo_lending_pool_address = Address::from_str(LENDING_POOL_TESTNET_ADDRESS)?;

        let token_address = Address::from_str("0x0000000000000000000000000000000000001549")?;

        let amount = 1.0;

        let is_native_token = token_address.to_string() == TESTNET_HBAR_ADDRESS;

        if is_native_token {
            todo!("Supply native token to bonzo pool not implemented yet");
        } else {
            let token_contract = ERC20::new(token_address, evm_provider.clone());
            let token_decimals = token_contract.decimals().call().await?;

            let balance = token_contract
                .balanceOf(evm_provider.default_signer_address())
                .call()
                .await?;

            let formatted_balance: f64 = format_units(balance, token_decimals)?.parse()?;
            let parsed_amount: U256 =
                parse_units(amount.to_string().as_str(), token_decimals)?.into();

            println!(
                "Balance of token {} is: {}",
                token_address, formatted_balance
            );

            if formatted_balance < amount {
                return Err(color_eyre::eyre::eyre!(
                    "Not enough balance of token {} to supply {} to bonzo pool",
                    token_address,
                    amount
                ));
            }

            let allowance = token_contract
                .allowance(
                    evm_provider.default_signer_address(),
                    bonzo_lending_pool_address,
                )
                .call()
                .await?;

            if allowance < parsed_amount {
                // Approve the bonzo lending pool to spend the token
                let approve_tx = token_contract
                    .approve(bonzo_lending_pool_address, parsed_amount)
                    .send()
                    .await?
                    .get_receipt()
                    .await?;

                println!("Approve tx Hash : {:?}", approve_tx.transaction_hash);

                let approve_tx_success = approve_tx.status();

                if !approve_tx_success {
                    return Err(color_eyre::eyre::eyre!(
                        "Failed to approve token {} to bonzo lending pool",
                        token_address
                    ));
                }

                println!("Approved token {} to bonzo lending pool", token_address);
            }

            println!("Parsed amount to supply: {}", parsed_amount);

            // Supply the token to the bonzo lending pool
            let bonzo_lending_pool =
                BonzoLendingPool::new(bonzo_lending_pool_address, &evm_provider);

            let tx = bonzo_lending_pool
                .deposit(
                    token_address,
                    parsed_amount,
                    evm_provider.default_signer_address(),
                    0,
                )
                .gas(800_000)
                .send()
                .await?
                .get_receipt()
                .await?;

            println!("Supply tx Hash : {:?}", tx.transaction_hash);

            let tx_success = tx.status();

            if !tx_success {
                return Err(color_eyre::eyre::eyre!(
                    "Failed to supply token {} to bonzo lending pool",
                    token_address
                ));
            }

            println!(
                "Supplied {} of token {} to bonzo lending pool",
                amount, token_address
            );
        }

        Ok(())
    }
}
