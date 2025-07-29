use std::fs;

use dotenvy::dotenv;
use once_cell::sync::Lazy;

use crate::types::TomlConfig;

pub const RPC_URL: &str = "https://testnet.hashio.io/api";
pub const CHAIN_ID: u64 = 296;
pub const HBAR_EVM_ADDRESS: &str = "0x0000000000000000000000000000000000003ad2";
pub const NON_FUNGIBLE_POSITION_MANAGER_ADDRESS: &str =
    "0x000000000000000000000000000000000013f618";
pub const YIELDERA_CONTRACT_ADDRESS: &str = "0xF022E0BC858E3D3aFE60fcEBc91A9fc80f7D29E8";
pub const IS_NEW_CONTRACT: bool = false;

#[derive(Debug, Clone)]
pub struct Config {
    pub private_key: String,
    pub is_mainnet: bool,
    pub toml_config: TomlConfig,
    pub admin_password: String,
}

impl Config {
    pub fn load() -> Self {
        dotenv().ok(); // Load environment variables

        let private_key = std::env::var("PRIVATE_KEY").expect("PRIVATE_KEY is not set");
        let is_mainnet = std::env::var("NETWORK")
            .unwrap_or("testnet".to_string())
            .to_lowercase()
            == "mainnet";

        let admin_password = std::env::var("ADMIN_PASSWORD").expect("ADMIN_PASSWORD is not set");

        // Load config from toml file based on the environment (mainnet or testnet)
        let toml_config_file_path = if is_mainnet {
            "./src/config/mainnet.toml"
        } else {
            "./src/config/testnet.toml"
        };

        let raw =
            fs::read_to_string(toml_config_file_path).expect("Failed to read config toml file");

        let toml_config: TomlConfig = toml::from_str(&raw).expect("Failed to parse config.toml");

        Self {
            private_key,
            is_mainnet,
            toml_config,
            admin_password,
        }
    }
}

// Define a globally accessible static Config instance
pub static CONFIG: Lazy<Config> = Lazy::new(Config::load);

// Other constants
pub const FEE_FACTOR: f64 = 10_000.0;
pub const MONITOR_VAULT_INTERVAL_SECONDS: u64 = 60 * 60; // 1 hour in seconds
