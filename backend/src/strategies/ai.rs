/*
   This Strategy is not supported on testnet cause it relies on coingecko pools data which is not available for testnet pools
*/

use crate::{
    core, helpers,
    types::{AiStrategyResponse, CoingeckoOhlcvRes, TickRange, VaultDetails},
};
use color_eyre::eyre::Result;

use rig::{client::ProviderClient, completion::Prompt, providers::gemini};
use serde_json::json;
use tokio::time::Instant;
use tracing::{debug, info};

pub async fn get_best_range(_vault: &VaultDetails) -> Result<TickRange> {
    Ok(TickRange {
        curent_tick: 0,
        lower_tick: 0,
        upper_tick: 0,
    })
}

pub async fn start(vault_details: &VaultDetails) -> Result<AiStrategyResponse> {
    debug!("Start AI strategy...");
    // 1. Fetch historical OHLCV price data from coingecko
    let pool_gecko_data: CoingeckoOhlcvRes =
        core::coingecko::get_pool_ohlcv_data(&vault_details.pool.address, vault_details).await?;

    debug!("Fetched historical OHLCV price data from coingecko");

    let current_price = vault_details.pool.price1;
    // Convert tick lower and upper to price
    let current_lower_price: f64;
    let current_upper_price: f64;

    if vault_details.is_active {
        let current_lower_tick = vault_details.lower_tick;
        let current_upper_tick = vault_details.upper_tick;

        current_lower_price = helpers::math::tick_to_price(
            current_lower_tick,
            vault_details.pool.token0.decimals,
            vault_details.pool.token1.decimals,
        )?;

        current_upper_price = helpers::math::tick_to_price(
            current_upper_tick,
            vault_details.pool.token0.decimals,
            vault_details.pool.token1.decimals,
        )?;
    } else {
        current_lower_price = 0.0;
        current_upper_price = 0.0;
    }

    let ai_instruction_prompt = r#"
### 🧠 AI Strategist Optimal Liquidity Price Range (Uniswap V3-style ALM)

**Role:**
You are an advanced strategist for an automated liquidity manager. Your job is to **analyze market conditions** using the given historical OHLCV price data, current price, and active range, then decide:

* Whether the current liquidity position needs rebalancing.
* PLease if the current position prices are good even if it is not very optimal, Don't rebalance the position and just keep it as it is to avoid uneessary fees.
* If yes, what is the **optimal price range** (in terms of **actual price values**, not ticks) to maximize fee income, maintain capital efficiency, and minimize risk.
* If current position is very approach to the best range, don't rebalance the position and just keep it as it is to avoid unecessary fees.

---

### 📥 Inputs

* **Current Liquidity Position (price-based)**:

  * `current_lower_price`: $[value] 
  * `current_upper_price`: $\[value]
  * `current_price`: $\[value]
  Note: If the vault does not have a position, the upper price and lower price will be passed both as 0

* **Historical Price Data (OHLCV)**:

  * Format: `[timestamp, open, high, low, close, volume]`
  * Source: CoinGecko or similar

* **Vault Info**:
  
  * Tick spacing: `tick_spacing`
  * Pool fee tier: `0.05% | 0.3% | 1%`
  * Typical rebalance frequency: Every 1 day if the estimated earnings are very positive(cause rebalances on hedera are not that cheap so we want to rebalance only when we have a profit that is worth more than the rebalance fees and the gas fees).
  * Strategic goal: Maximize earning fees with very narrow ranges if the market is not very volatile.

---

### 🧠 Tasks

1. **Rebalance Decision**

   * Analyze recent price volatility and trend
   * Compare the current active range with recent price action
   * Decide: should the position be rebalanced now?

2. **Suggest New Price Range**

   * If rebalancing is needed, suggest a new price range:

     * `new_lower_price`
     * `new_upper_price`
    
   * Consider volatility, mean-reversion vs trending behavior, volume structure and any other factors that may affect the price range.

3. **Justify Your Decision**

   * Explain why you chose that price range in brief but helpful. 

4. **Optional Forecast**

   * Predict the most likely price movement pattern for the next 3 days
   * Include a confidence score or volatility metric

---

### 📤 Output Format (example)

* Always return a JSON object following this exmple format:
* If rebelance is not needed, the lower and upper prices will be 0.0 not null. 

```json
{
  "rebalance_required": true,
  "new_price_range": {
    "lower_price":  0.0,
    "upper_price": 0.0
    },
  "analysis": "Recent consolidation suggests a mean-reverting regime between 0.9 and 1.1. Current price sits near the lower edge of the old range, making it inefficient. The new range better captures the most probable price path while slightly skewing for upward momentum. ....",
  "market_outlook": "Will be bullish in the near future based on those factors: ...",
  "confidence_score": 0.81
    }
```
"#;

    let ai_client = gemini::Client::from_env();

    let ai_agent = ai_client
        .agent("gemini-2.0-flash")
        .preamble(ai_instruction_prompt)
        .temperature(0.0)
        .additional_params(json!({
            "thinkingConfig": {
                "thinkingBudget": 0,
            }
        }))
        .build();

    let vault_tick_spacing = vault_details.pool.tick_spacing;
    let vault_fee = vault_details.pool.fee;

    let prompt = format!(
        r#"
Recommend the best pool liquidity range for the following pool by returning the json object following format provided on the instruction:
    **Current Liquidity Position (price-based)**
      - Current price: {current_price}
      - Current lower price: {current_lower_price}
      - Current upper price: {current_upper_price}
    **Vault Info**
      - Tick spacing: {vault_tick_spacing}
      - Pool fee tier: {vault_fee}
    **Historical Price Data (OHLCV) of the last 6 months From Coingecko**
    {pool_gecko_data:#?}  
        "#,
    );

    debug!("Starting waiting  for AI strategy response...");
    let start_time = Instant::now();
    let response = ai_agent.prompt(prompt).await?;
    let elapsed = start_time.elapsed();

    debug!(
        "AI strategy response received in {} seconds",
        elapsed.as_secs_f64()
    );

    debug!("response: {:?}", response);

    let json_response = extract_json_from_markdown(&response);

    let ai_strategy_response: AiStrategyResponse = serde_json::from_str(&json_response)?;

    debug!("ai_strategy_response: {:?}", ai_strategy_response);

    info!(
        "AI Strategy Low price: {}",
        ai_strategy_response.new_price_range.lower_price
    );
    info!(
        "AI Strategy High price: {}",
        ai_strategy_response.new_price_range.upper_price
    );

    Ok(ai_strategy_response)
}

pub fn extract_json_from_markdown(md: &str) -> String {
    let json_block = md.replace("```json", "").replace("```", "");
    json_block.trim().to_string()
}

pub async fn get_tick_range_from_ai_response(
    response: AiStrategyResponse,
    vault_details: &VaultDetails,
) -> Result<TickRange> {
    let lower_price = response.new_price_range.lower_price;
    let upper_price = response.new_price_range.upper_price;

    let lower_tick = helpers::math::convert_price_to_tick(
        lower_price,
        vault_details.pool.token0.decimals,
        vault_details.pool.token1.decimals,
        vault_details.pool.tick_spacing,
    )?;

    let upper_tick = helpers::math::convert_price_to_tick(
        upper_price,
        vault_details.pool.token0.decimals,
        vault_details.pool.token1.decimals,
        vault_details.pool.tick_spacing,
    )?;

    Ok(TickRange {
        curent_tick: vault_details.pool.current_tick,
        lower_tick,
        upper_tick,
    })
}
