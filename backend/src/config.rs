use dotenvy::dotenv;
use once_cell::sync::Lazy;

pub const RPC_URL: &str = "https://testnet.hashio.io/api";
pub const CHAIN_ID: u64 = 296;
pub const HBAR_EVM_ADDRESS: &str = "0x0000000000000000000000000000000000003ad2";
pub const FEE_FACTOR: f64 = 10_000.0;
pub const NON_FUNGIBLE_POSITION_MANAGER_ADDRESS: &str =
    "0x000000000000000000000000000000000013f618";
pub const YIELDERA_CONTRACT_ADDRESS: &str = "0xF022E0BC858E3D3aFE60fcEBc91A9fc80f7D29E8";
pub const IS_NEW_CONTRACT: bool = false;

#[derive(Debug, Clone)]
pub struct Config {
    pub private_key: String,
    pub is_mainnet: bool,
}

impl Config {
    pub fn load() -> Self {
        dotenv().ok(); // Load environment variables

        let private_key = std::env::var("PRIVATE_KEY").expect("PRIVATE_KEY is not set");
        let is_mainnet = std::env::var("IS_MAINNET").unwrap_or(String::from("false")) == "true";

        Self {
            private_key,
            is_mainnet,
        }
    }
}

// Define a globally accessible static Config instance
pub static CONFIG: Lazy<Config> = Lazy::new(Config::load);
