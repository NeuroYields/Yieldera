use chrono::{DateTime, Utc};
use once_cell::sync::Lazy;

use crate::{
    core::init::init_evm_provider,
    types::{EvmProvider, VaultDetails},
};

pub struct AppState {
    pub evm_provider: EvmProvider,
    pub all_vaults: dashmap::DashMap<String, VaultDetails>,
}

impl AppState {
    pub async fn new() -> Self {
        // Init evm provider
        let evm_provider = init_evm_provider().await.unwrap();

        Self {
            evm_provider,
            all_vaults: dashmap::DashMap::new(),
        }
    }
}

// Global static that holds the UTC timestamp at program start
pub static START_TIMESTAMP: Lazy<DateTime<Utc>> = Lazy::new(|| Utc::now());
