use mcp_core::tool_text_content;
use mcp_core::types::ClientCapabilities;
use mcp_core::types::Implementation;
use mcp_core::types::ToolResponseContent;
use mcp_core::{
    client::ClientBuilder, server::Server, transport::ServerSseTransport, types::ServerCapabilities,
};
use mcp_core_macros::{tool, tool_param};
use serde_json::json;

use color_eyre::eyre::Result;
use rig::{
    completion::Prompt,
    providers::{self},
};

#[tool(
    name = "echo",
    description = "Echo back the message you send",
    annotations(title = "Echo Tool", read_only_hint = true, destructive_hint = false)
)]
async fn echo_tool(
    message: tool_param!(String, description = "The message to echo back"),
) -> Result<ToolResponseContent> {
    Ok(tool_text_content!(message))
}

#[tool(
    name = "Add",
    description = "Add 2nd number to 1st",
    annotations(title = "Add Tool")
)]
async fn add_tool(a: f64, b: f64) -> Result<ToolResponseContent> {
    Ok(tool_text_content!((a + b).to_string()))
}

#[tool(
    name = "Sub",
    description = "Subtract 2nd number from 1st",
    annotations(read_only_hint = true)
)]
async fn sub_tool(a: f64, b: f64) -> Result<ToolResponseContent> {
    Ok(tool_text_content!((a - b).to_string()))
}
