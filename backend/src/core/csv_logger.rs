use std::fs::{OpenOptions, metadata};

use csv::WriterBuilder;
use serde::{Deserialize, Serialize};

use color_eyre::eyre::Result;

use crate::state::START_TIMESTAMP;

#[derive(Serialize)]
pub struct RebalanceLogEntry {
    pub timestamp: String,
    pub vault_address: String,
    pub transaction_hash: String,
    pub transaction_status: String,
    pub tvl0: f64,
    pub tvl1: f64,
    pub fees0_bef: f64,
    pub fees1_bef: f64,
    pub current_tick: i32,
    pub lower_tick_bef: i32,
    pub upper_tick_bef: i32,
    pub lower_tick_aft: i32,
    pub upper_tick_aft: i32,
    pub amount0_bef: f64,
    pub amount1_bef: f64,
    pub liquidity_bef: u128,
    pub swap_amount_out: f64,
    pub swap_max_amount_in: f64,
    pub is_swap_0_to_1: bool,
}

pub fn log_rebalance_result_to_csv(entry: RebalanceLogEntry) -> Result<()> {
    let file_path = format!("reb_history/arb_{}.csv", START_TIMESTAMP.timestamp());

    // Create a directory if it doesn't exist
    std::fs::create_dir_all("reb_history")?;

    // Check if file exists
    let file_exists = metadata(&file_path).is_ok();

    let file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(file_path)?;

    let mut writer = WriterBuilder::new()
        .has_headers(!file_exists) // write headers if file doesn't exist
        .from_writer(file);

    writer.serialize(entry)?;
    writer.flush()?;

    Ok(())
}
