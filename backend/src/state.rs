use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;
use rig::{agent::Agent, providers::gemini::completion::CompletionModel};

use crate::{
    core::init::{init_ai_agent, init_evm_provider},
    types::{EvmProvider, VaultDetails},
};

pub struct AppState {
    pub evm_provider: EvmProvider,
    pub all_vaults: dashmap::DashMap<String, VaultDetails>,
    pub ai_agent: Agent<CompletionModel>,
}

impl AppState {
    pub async fn new() -> Self {
        // Init evm provider
        let evm_provider = init_evm_provider().await.unwrap();
        // Initialize the AI agent
        let ai_agent = init_ai_agent()
            .await
            .expect("Failed to initialize AI agent");

        Self {
            ai_agent,
            evm_provider,
            all_vaults: dashmap::DashMap::new(),
        }
    }
}

// Global static that holds the UTC timestamp at program start
pub static START_TIMESTAMP: Lazy<DateTime<Utc>> = Lazy::new(|| Utc::now());
