use mcp_core::{
    client::ClientBuilder,
    server::Server,
    transport::ServerSseTransport,
    types::{ServerCapabilities, ToolCapabilities},
};

mod config;
mod tools;

use color_eyre::eyre::Result;

use crate::tools::calculator::{AddTool, SubTool};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize error handling
    color_eyre::install().expect("Failed to install color_eyre");

    dotenvy::dotenv().ok();

    start().await.expect("Failed to start MCP server/client");

    Ok(())
}

#[cfg(feature = "server")]
async fn start() -> Result<()> {
    // Start calculator server

    use crate::tools::{balance::GetHbarBalanceTool, bonzo::SupplyBonzoTokenTool};
    let mcp_server_protocol = Server::builder(
        "hedera_mcp".to_string(),
        "1.0".to_string(),
        mcp_core::types::ProtocolVersion::V2025_03_26,
    )
    .set_capabilities(ServerCapabilities {
        tools: Some(ToolCapabilities {
            list_changed: Some(false),
        }),
        ..Default::default()
    })
    .register_tool(AddTool::tool(), AddTool::call())
    .register_tool(SubTool::tool(), SubTool::call())
    .register_tool(GetHbarBalanceTool::tool(), GetHbarBalanceTool::call())
    .register_tool(SupplyBonzoTokenTool::tool(), SupplyBonzoTokenTool::call())
    .build();

    let mcp_server_transport =
        ServerSseTransport::new("127.0.0.1".to_string(), 3001, mcp_server_protocol);

    Server::start(mcp_server_transport.clone())
        .await
        .map_err(|e| color_eyre::eyre::eyre!(e))
}

#[cfg(feature = "client")]
async fn start() -> Result<()> {
    // Create the MCP client

    use mcp_core::transport::ClientSseTransportBuilder;
    use rig::{
        client::ProviderClient,
        completion::Prompt,
        providers::{self, gemini::completion::GEMINI_2_0_FLASH},
    };
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

    println!("Initialized: {:?}", init_res);

    let tools_list_res = mcp_client
        .list_tools(None, None)
        .await
        .map_err(|e| color_eyre::eyre::eyre!(e))?;
    println!("Tools: {:?}", tools_list_res);

    let completion_model = providers::gemini::Client::from_env();

    let mut agent_builder = completion_model.agent(GEMINI_2_0_FLASH);

    // Add MCP tools to the agent
    agent_builder = tools_list_res
        .tools
        .into_iter()
        .fold(agent_builder, |builder, tool| {
            builder.mcp_tool(tool, mcp_client.clone())
        });

    let agent = agent_builder.build();

    // let add_response = agent.prompt("Add 10 + 10").await?;

    // println!("Add Response: {:?}", add_response);

    // let sub_response = agent.prompt("Subtract 10 - 5").await?;
    // println!("Sub Response: {:?}", sub_response);

    // let hbar_balance_response = agent
    //     .prompt("Get native coin balance (HBAR) of 0x79dAa774769334aF120f6CAA57E828FBBF56b39a")
    //     .await?;
    // println!("Hbar Balance Response: {:?}", hbar_balance_response);

    let supply_bonzo_token_response = agent
        .prompt("I want to Supply 0.1 of HBAR token to bonzo.")
        .await?;

    println!(
        "Supply Bonzo Token Response: {:?}",
        supply_bonzo_token_response
    );

    Ok(())
}
