use crate::types::VaultDetails;

pub struct AppState {
    pub all_vaults: dashmap::DashMap<String, VaultDetails>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            all_vaults: dashmap::DashMap::new(),
        }
    }
}
