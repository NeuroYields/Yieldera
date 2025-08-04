use mcp_core::tool_text_content;
use mcp_core::types::ToolResponseContent;
use mcp_core_macros::{tool};
use color_eyre::eyre::Result;

#[tool(
    name = "add_numbers",
    description = "Add 2nd number to 1st",
    annotations(title = "Add Tool")
)]
async fn add_tool(a: f64, b: f64) -> Result<ToolResponseContent> {
    Ok(tool_text_content!((a + b).to_string()))
}

#[tool(
    name = "sub_numbers",
    description = "Subtract 2nd number from 1st",
    annotations(read_only_hint = true)
)]
async fn sub_tool(a: f64, b: f64) -> Result<ToolResponseContent> {
    Ok(tool_text_content!((a - b).to_string()))
}
