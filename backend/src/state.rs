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
