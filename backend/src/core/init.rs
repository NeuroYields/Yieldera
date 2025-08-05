use std::{
    process::{Command, Stdio},
    str::FromStr,
    time::Duration,
};

use alloy::{providers::ProviderBuilder, signers::local::PrivateKeySigner};

use color_eyre::eyre::Result;
use mcp_core::{client::ClientBuilder, transport::ClientSseTransportBuilder};
use reqwest::Client;
use rig::{
    agent::Agent,
    client::ProviderClient,
    completion::Prompt,
    providers::{self, gemini::completion::CompletionModel, gemini::completion::GEMINI_2_0_FLASH},
};
use tokio::time::sleep;
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

pub async fn init_ai_agent() -> Result<Agent<CompletionModel>> {
    // Build the mcp server first
    let mut build_mcp_child = Command::new("cargo")
        .arg("build")
        .arg("--no-default-features")
        .arg("--features")
        .arg("server")
        .current_dir("../mcp") // Adjust path as needed
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()?;

    let exit_status = build_mcp_child.wait()?;

    if !exit_status.success() {
        return Err(color_eyre::eyre::eyre!("Failed to build mcp"));
    }

    // Run the mcp server first
    let mut mcp_child = Command::new("cargo")
        .arg("run")
        .arg("--no-default-features")
        .arg("--features")
        .arg("server")
        .current_dir("../mcp") // Adjust path as needed
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()?;

    // Use a shutdown hook (like tokio's ctrl_c or Drop guard)
    tokio::spawn(async move {
        tokio::signal::ctrl_c().await.unwrap();
        println!("Shutting down MCP server...");
        let _ = mcp_child.kill();
    });

    // Wait for the server to become ready
    let client = Client::new();
    let mut retries = 0;
    let max_retries = 10;

    while retries < max_retries {
        let res = client.get("http://127.0.0.1:3001/sse").send().await;

        if let Ok(resp) = res {
            if resp.status().is_success() {
                break;
            }
        }

        retries += 1;
        sleep(Duration::from_millis(500)).await;
    }

    if retries == max_retries {
        return Err(color_eyre::eyre::eyre!("MCP server did not start in time"));
    }

    let mcp_client = ClientBuilder::new(
        ClientSseTransportBuilder::new("http://127.0.0.1:3001/sse".to_string()).build(),
    )
    .build();

    // Start the MCP client
    mcp_client
        .open()
        .await
        .map_err(|e| color_eyre::eyre::eyre!(e))?;

    let init_res = mcp_client
        .initialize()
        .await
        .map_err(|e| color_eyre::eyre::eyre!(e))?;

    println!("Initialized mcp client Successfully: {:?}", init_res);

    let tools_list_res = mcp_client
        .list_tools(None, None)
        .await
        .map_err(|e| color_eyre::eyre::eyre!(e))?;

    let completion_model = providers::gemini::Client::from_env();

    let mut agent_builder = completion_model.agent(GEMINI_2_0_FLASH);

    // Add MCP tools to the agent
    agent_builder = tools_list_res
        .tools
        .into_iter()
        .fold(agent_builder, |builder, tool| {
            builder.mcp_tool(tool, mcp_client.clone())
        });

    let agent = agent_builder
        .preamble("You Are Yieldera AI Agent, you are a helpful assistant for Yieldera platform and hedera ecosystem. You can help users with their questions and also you have access to to some tools to help them. You are not a search engine and you can't answer questions that are not related to hedera or yieldera.")
        .temperature(0.0)
        .build();

    Ok(agent)
}
