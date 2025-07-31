use std::str::FromStr;

use crate::{
    config::{CONFIG, MONITOR_VAULT_INTERVAL_SECONDS},
    core::{self, vault::YielderaVault},
    helpers::{self},
    strategies,
    types::{PrepareSwapArgs, VaultDetails, VaultTokenBalances, WebAppState},
};
use alloy::primitives::{
    Address, U256,
    aliases::I24,
    utils::{format_units, parse_units},
};
use color_eyre::eyre::{Context, Result};
use tracing::{debug, error, info, warn};

pub async fn start_vault_liq_management(vault_address: &str, app_state: WebAppState) -> Result<()> {
    info!(
        "Vault liquidity management loop started for vault address: {:?}",
        vault_address
    );

    // for each MONITOR_VAULT_INTERVAL_SECONDS, check if we need to rebalance the vault
    loop {
        // Implement the logic to rebalance the vault
        match start_rebalance_strategy(vault_address, &app_state).await {
            Ok(_) => {
                info!(
                    "Start Rebalance strategy for vault {} completed successfully",
                    vault_address
                );
            }
            Err(e) => {
                error!(
                    "Start Rebalance strategy for vault {} failed with error: {:?}",
                    vault_address, e
                );

                // Init the email
                let mailer = core::email::init_mailer()
                    .await
                    .context("Failed to initialize mailer")?;

                // send an alert email
                core::email::send_email_notification(
                    "Yieldera Vault Rebalance Alert",
                    format!(
                        "Vault {} Rebalance failed to rebalance with error: \n{:?}",
                        vault_address, e
                    ),
                    &mailer,
                )
                .await?;
            }
        };

        info!(
            "Sleeping for {} seconds for vault {}",
            MONITOR_VAULT_INTERVAL_SECONDS, vault_address
        );

        tokio::time::sleep(std::time::Duration::from_secs(
            MONITOR_VAULT_INTERVAL_SECONDS,
        ))
        .await;
    }
}

async fn start_rebalance_strategy(vault_address: &str, app_state: &WebAppState) -> Result<()> {
    // 1. Check if the vault already has a position or not by checkinfg the isActive flag
    let vault_details = app_state.all_vaults.get_mut(vault_address);

    if vault_details.is_none() {
        return Err(color_eyre::eyre::eyre!(
            "Vault details not found for vault address: {}",
            vault_address
        ));
    }

    let mut vault_details = vault_details.unwrap();

    let has_a_position = vault_details.is_active;

    let vault_token_balances =
        core::vault::get_vault_tokens_balances(&app_state.evm_provider, &vault_details).await?;

    // Update the vault live data from the blockchain (tick, prices)
    core::vault::update_vault_live(&app_state.evm_provider, &mut vault_details).await?;

    if has_a_position {
        debug!(
            "Vault {} has already a position. Checking if need to rebalance...",
            vault_address
        );

        // TEST ERROR
        // return Err(color_eyre::eyre::eyre!(
        //     "Vault {} already has a position. Send TEST ERROR",
        //     vault_address
        // ));

        // Estimate balances after removing the existant liquidity by calling getCurrent position, then call the rebalance function
        let vault_contract = YielderaVault::new(
            Address::from_str(vault_details.address.as_str())?,
            &app_state.evm_provider,
        );

        let current_postion = vault_contract.getCurrentPosition().call().await?;

        let estim_balance0_u256 =
            current_postion.amount0 + vault_token_balances.token0_balance_u256;
        let estim_balance1_u256 =
            current_postion.amount1 + vault_token_balances.token1_balance_u256;
        let estim_balance0: f64 =
            format_units(estim_balance0_u256, vault_details.pool.token0.decimals)?.parse()?;
        let estim_balance1: f64 =
            format_units(estim_balance1_u256, vault_details.pool.token1.decimals)?.parse()?;

        let vault_token_balances = VaultTokenBalances {
            token0_balance: estim_balance0,
            token1_balance: estim_balance1,
            token0_balance_u256: estim_balance0_u256,
            token1_balance_u256: estim_balance1_u256,
        };

        debug!(
            "Esimated balances after removing all the liqudiity: {:?}",
            vault_token_balances
        );

        // Call the rebalance function
        rebalance_vault(&mut vault_details, &app_state, &vault_token_balances).await?;
    } else {
        debug!(
            "Vault {} does not have a position. Checking if it is possible to mint a new position...",
            vault_address
        );

        // 2. Check if the vault is eligible to mint a new position by checking if it has some token balances
        let balance0 = vault_token_balances.token0_balance;
        let balance1 = vault_token_balances.token1_balance;

        if balance0 <= f64::EPSILON && balance1 <= f64::EPSILON {
            warn!(
                "Vault {} does not have any token balances.Its balances are: {} , {} . Skipping minting liquidity.",
                vault_address, balance0, balance1
            );
            return Ok(());
        }

        // 3. Call the rebalance function
        rebalance_vault(&mut vault_details, &app_state, &vault_token_balances).await?;
    }

    // 4. Update the vault details in the app state after rebalance
    core::vault::update_vault_after_rebalance(&app_state.evm_provider, &mut vault_details).await?;

    Ok(())
}

pub async fn rebalance_vault(
    vault_details: &mut VaultDetails,
    _app_state: &WebAppState,
    vault_token_balances: &VaultTokenBalances,
) -> Result<()> {
    let balance0 = vault_token_balances.token0_balance;
    let balance1 = vault_token_balances.token1_balance;

    // 3.2 Start strategy thta will get me the best tick range to put liq on
    let _basic_tick_range = strategies::basic::get_best_range(&vault_details).await?;

    // 3.3 Start ai strategy that will get me the best tick range to put liq on
    let ai_strategy_result = strategies::ai::start(&vault_details).await?;

    if !ai_strategy_result.rebalance_required {
        warn!(
            "AI strategy does not recommend rebalance for vault {}. Skipping rebalance.",
            vault_details.address
        );
        return Ok(());
    }

    let ai_tick_range =
        strategies::ai::get_tick_range_from_ai_response(ai_strategy_result, &vault_details).await?;

    info!("AI strategy Tick range: {:?}", ai_tick_range);

    let tick_range = ai_tick_range;

    let lower_tick = tick_range.lower_tick;
    let upper_tick = tick_range.upper_tick;
    let current_tick = tick_range.curent_tick;

    if vault_details.lower_tick == lower_tick && vault_details.upper_tick == upper_tick {
        warn!(
            "Vault {} already has the best tick range. Skipping rebalance.",
            vault_details.address
        );
        return Ok(());
    }

    // DEBUG: STop here for debugging purposes
    // return Ok(());

    // 3.3 Get the appropriate amount of token0 and token1 to add liquidity
    let lower_tick_sqrt_price =
        helpers::math::uniswap_v3::tick_math::get_sqrt_ratio_at_tick(lower_tick)?;
    let upper_tick_sqrt_price =
        helpers::math::uniswap_v3::tick_math::get_sqrt_ratio_at_tick(upper_tick)?;
    let current_tick_sqrt_price =
        helpers::math::uniswap_v3::tick_math::get_sqrt_ratio_at_tick(current_tick)?;

    let balance1_token0_equivalent = balance1 * vault_details.pool.price0;
    let is_balance0_larger = balance0 > balance1_token0_equivalent;

    let liquidity = if is_balance0_larger {
        helpers::math::uniswap_v3::liquidity_math::get_liquidity_for_amount0(
            lower_tick_sqrt_price,
            upper_tick_sqrt_price,
            vault_token_balances.token0_balance_u256,
        )?
    } else {
        helpers::math::uniswap_v3::liquidity_math::get_liquidity_for_amount1(
            lower_tick_sqrt_price,
            upper_tick_sqrt_price,
            vault_token_balances.token1_balance_u256,
        )?
    };

    let (amount0, amount1) = helpers::math::uniswap_v3::liquidity_math::get_amounts_for_liquidity(
        current_tick_sqrt_price,
        lower_tick_sqrt_price,
        upper_tick_sqrt_price,
        liquidity,
    )?;

    let desired_amount0: f64 =
        format_units(amount0, vault_details.pool.token0.decimals)?.parse()?;
    let desired_amount1: f64 =
        format_units(amount1, vault_details.pool.token1.decimals)?.parse()?;

    // Prepare if need to swap token0 for token1 or teh reverse and how much to swap
    let exess0 = balance0 - desired_amount0;
    let exess1 = balance1 - desired_amount1;

    // Prepare the swap args for the negative value betwen the exess0 and exess1
    let swap_arg: PrepareSwapArgs;

    if exess0 < 0.0 {
        let exact_amount_out = exess0.abs();
        let parsed_exact_amount_out: U256 = parse_units(
            exact_amount_out.to_string().as_str(),
            vault_details.pool.token0.decimals,
        )?
        .into();
        let max_amount_in: U256 = parse_units(
            exess1.abs().to_string().as_str(),
            vault_details.pool.token1.decimals,
        )?
        .into();

        swap_arg = PrepareSwapArgs {
            exact_amount_out,
            parsed_exact_amount_out,
            token_in: vault_details.pool.token1.clone(),
            token_out: vault_details.pool.token0.clone(),
            is_swap_0_to_1: false,
            max_amount_in,
        };
    } else if exess1 < 0.0 {
        let exact_amount_out = exess1.abs();
        let parsed_exact_amount_out: U256 = parse_units(
            exact_amount_out.to_string().as_str(),
            vault_details.pool.token1.decimals,
        )?
        .into();
        let max_amount_in: U256 = parse_units(
            exess0.abs().to_string().as_str(),
            vault_details.pool.token0.decimals,
        )?
        .into();

        swap_arg = PrepareSwapArgs {
            exact_amount_out,
            parsed_exact_amount_out,
            token_in: vault_details.pool.token0.clone(),
            token_out: vault_details.pool.token1.clone(),
            is_swap_0_to_1: true,
            max_amount_in,
        };
    } else {
        // No need to swap
        swap_arg = PrepareSwapArgs {
            exact_amount_out: 0.0,
            parsed_exact_amount_out: U256::ZERO,
            token_in: vault_details.pool.token0.clone(),
            token_out: vault_details.pool.token1.clone(),
            is_swap_0_to_1: true,
            max_amount_in: U256::ZERO,
        };
    }

    let vault_address = vault_details.address.as_str();

    let is_execute = CONFIG.is_execute;

    if is_execute {
        // Reint evm provider to ensure it has teh latest nonce
        let evm_provider = core::init::init_evm_provider().await?;

        // call rebelance on the vault with new tick range and swap direction and amount
        let vault_contract = YielderaVault::new(Address::from_str(vault_address)?, &evm_provider);

        let upper_tick = I24::from_str(upper_tick.to_string().as_str())?;
        let lower_tick = I24::from_str(lower_tick.to_string().as_str())?;

        let value_to_send: U256 = parse_units("0.2", 18)?.into();

        let rebalnce_reciept = vault_contract
            .rebalance(
                lower_tick,
                upper_tick,
                swap_arg.parsed_exact_amount_out,
                swap_arg.max_amount_in,
                swap_arg.is_swap_0_to_1,
            )
            .value(value_to_send)
            .gas(15_000_000)
            .send()
            .await?
            .get_receipt()
            .await?;

        let rebalnce_tx_hash = rebalnce_reciept.transaction_hash;

        info!(
            "Rebalance TX Hash for vault {} is: {}",
            vault_address, rebalnce_tx_hash
        );

        let rebalnce_tx_status = rebalnce_reciept.status();

        if !rebalnce_tx_status {
            return Err(color_eyre::eyre::eyre!(
                "Rebalance transaction failed for vault {}. TX Hash: {},  Error: {:?}",
                vault_address,
                rebalnce_tx_hash,
                rebalnce_reciept
            ));
        } else {
            info!(
                "Rebalance transaction succeeded for vault {}. TX Hash: {}",
                vault_address, rebalnce_tx_hash
            );
        }
    } else {
        warn!(
            "Execution is disabled. Skipping rebalance for vault {}",
            vault_address
        );
    }

    Ok(())
}
