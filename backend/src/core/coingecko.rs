use crate::{config::CONFIG, types::{CoingeckoOhlcvRes, VaultDetails}};
use color_eyre::eyre::Result;
use reqwest::header::{ACCEPT, HeaderMap, HeaderValue};
use serde_json::Value;

pub async fn get_pool_ohlcv_data(
    pool_address: &str,
    vault_details: &VaultDetails,
) -> Result<CoingeckoOhlcvRes> {
    let network_id = "hedera-hashgraph";
    // let network_id = "sei-evm";
    let pool_address = pool_address.to_lowercase();
    let token_0_address = vault_details.pool.token0.address.as_str();

    let url = format!(
        "https://api.coingecko.com/api/v3/onchain/networks/{}/pools/{}/ohlcv/day?limit=1000&currency=token&token={}&include_empty_intervals=false",
        network_id, pool_address, token_0_address
    );

    let coingecko_api_key = &CONFIG.coingecko_api_key;

    // Set up headers
    let mut headers = HeaderMap::new();

    headers.insert(ACCEPT, HeaderValue::from_static("application/json"));
    headers.insert(
        "x-cg-demo-api-key",
        HeaderValue::from_str(&coingecko_api_key)?,
    );

    // Make request
    let client = reqwest::Client::new();

    let response = client.get(url).headers(headers).send().await?;

    let ohlcv_data_res: Value = response.json().await?;

    // println!("ohlcv_data_res: {:?}", ohlcv_data_res);

    let ohlcv_data: CoingeckoOhlcvRes = serde_json::from_value(ohlcv_data_res)?;

    Ok(ohlcv_data)
}
