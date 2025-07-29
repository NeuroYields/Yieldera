mod api;
mod config;
mod core;
mod helpers;
mod state;
mod strategies;
mod types;

use actix_web::{App, HttpServer, web};

use tracing::{error, info};
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};
use utoipa_actix_web::AppExt;
use utoipa_swagger_ui::SwaggerUi;

use crate::{config::CONFIG, core::init::init_all_vaults, state::AppState};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    color_eyre::install().expect("Failed to install color_eyre");

    // Initialize the logger logic
    let file_appender = tracing_appender::rolling::daily("./logs", "yieldera.log");
    let (file_writer, _guard) = tracing_appender::non_blocking(file_appender);

    // Console writer (stdout)
    let console_layer = fmt::layer().pretty(); // Optional: makes console output prettier

    // File layer
    let file_layer = fmt::layer().with_writer(file_writer).with_ansi(false); // don't add colors to the file logs

    // 🔥 Only accept logs that match your crate
    let filter = EnvFilter::new("yieldera=debug");

    // Combine both
    tracing_subscriber::registry()
        .with(filter)
        .with(console_layer)
        .with(file_layer)
        .init();

    info!("Logger initialized Successfully");

    // Initalize empty state
    let app_state = web::Data::new(AppState::new().await);

    info!("Config: {:?}", *CONFIG);

    // Init all vaults and store them in the app state
    init_all_vaults(&app_state).await.unwrap();

    let all_vaults_addresses = &CONFIG.toml_config.vaults;

    //  Open a tokio thread for each vault stored in the app state, and start the liquidity management loop
    for address in all_vaults_addresses {
        let cloned_app_state = app_state.clone();
        tokio::spawn(async move {
            match core::vault_spawn::start_vault_liq_management(address, cloned_app_state).await {
                Ok(_) => {}
                Err(e) => {
                    error!(
                        "Failed on start vault liq management for address: {:?}",
                        address
                    );
                    error!("Error: {:?}", e);
                }
            };
        });
    }

    // Start the http server
    info!("Starting Http Server at http://127.0.0.1:8080");
    info!("Starting SWAGGER Server at http://127.0.0.1:8080/swagger-ui/");

    HttpServer::new(move || {
        let (app, app_api) = App::new()
            .into_utoipa_app()
            .app_data(web::Data::clone(&app_state))
            .service(api::get_index_service)
            .service(api::get_health_service)
            .service(api::handle_get_all_vaults)
            .service(api::handle_admin_associate_vault_tokens)
            .split_for_parts();

        app.service(SwaggerUi::new("/swagger-ui/{_:.*}").url("/api-docs/openapi.json", app_api))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}

#[cfg(test)]
mod test {

    use alloy::{
        primitives::{
            Address,
            aliases::I24,
            utils::{format_units, parse_units},
        },
        providers::WalletProvider,
    };
    use std::str::FromStr;

    use crate::{
        config::{CHAIN_ID, IS_NEW_CONTRACT, RPC_URL},
        helpers::vault::YielderaVault,
        types::PrepareSwapArgs,
    };

    use super::*;
    use alloy::{primitives::U256, providers::ProviderBuilder, signers::local::PrivateKeySigner};

    use color_eyre::eyre::Result;

    #[tokio::test]
    async fn test_mint_burn_without_native_coin() -> Result<()> {
        // load env vars
        dotenvy::dotenv().ok();

        let private_key = std::env::var("PRIVATE_KEY")?;

        let evm_signer = PrivateKeySigner::from_str(private_key.as_str())?;

        // Init provider with the specified rpc url in config
        let evm_provider = ProviderBuilder::new()
            .with_chain_id(CHAIN_ID)
            .wallet(evm_signer)
            .connect(RPC_URL)
            .await?;

        let contract_address = config::YIELDERA_CONTRACT_ADDRESS;

        let mut vault_details =
            helpers::vault::get_vault_details(&evm_provider, contract_address).await?;

        println!("{:#?}", vault_details);

        if IS_NEW_CONTRACT {
            println!("Associating vault tokens...");
            helpers::vault::associate_vault_tokens(&evm_provider, &mut vault_details).await?;
            println!("Associated vault tokens.");
            helpers::vault::deposit_tokens_to_vault(&evm_provider, &vault_details, 2.0, 1000.0)
                .await?;
        }

        // Start strategy thta will get me the best tick range to put liq on
        let tick_range = strategies::basic::get_best_range(&vault_details).await?;

        println!("Tick range: {:#?}", tick_range);

        // Estimate how much needed of token1 based on the provided amount0
        let amount0 = 0.3;

        println!("Trying to mint liquidity with Recommended tick range...");
        helpers::vault::mint_liquidity_from_amount0(
            &evm_provider,
            &vault_details,
            tick_range.lower_tick,
            tick_range.upper_tick,
            amount0,
        )
        .await?;
        println!("Minted liquidity with fixed approciate tick range.");

        helpers::vault::update_vault_current_position_data(&evm_provider, &mut vault_details)
            .await?;

        println!("Updated Vault : {:#?}", vault_details);

        // try to burn all the liqudity of the vault
        helpers::vault::burn_all_liquidity(&evm_provider, &vault_details).await?;

        // Update the vault details
        helpers::vault::update_vault_current_position_data(&evm_provider, &mut vault_details)
            .await?;

        println!("Updated Vault after burn liquidity : {:#?}", vault_details);
        Ok(())
    }

    #[tokio::test]
    async fn test_rebalance() -> Result<()> {
        // load env vars
        dotenvy::dotenv().ok();

        let private_key = std::env::var("PRIVATE_KEY")?;

        let evm_signer = PrivateKeySigner::from_str(private_key.as_str())?;

        // Init provider with the specified rpc url in config
        let evm_provider = ProviderBuilder::new()
            .with_chain_id(CHAIN_ID)
            .wallet(evm_signer)
            .connect(RPC_URL)
            .await?;

        let contract_address = config::YIELDERA_CONTRACT_ADDRESS;

        let mut vault_details =
            helpers::vault::get_vault_details(&evm_provider, contract_address).await?;

        println!("{:#?}", vault_details);

        if IS_NEW_CONTRACT {
            println!("Associating vault tokens...");
            helpers::vault::associate_vault_tokens(&evm_provider, &mut vault_details).await?;
            println!("Associated vault tokens.");

            // Deposit only native hbar tokens
            helpers::vault::deposit_tokens_to_vault(&evm_provider, &vault_details, 4.0, 0.0)
                .await?;
        }

        // Start strategy thta will get me the best tick range to put liq on
        let tick_range = strategies::basic::get_best_range(&vault_details).await?;

        println!("Tick range: {:#?}", tick_range);

        let lower_tick = tick_range.lower_tick;
        let upper_tick = tick_range.upper_tick;
        let current_tick = tick_range.curent_tick;

        // Get the ratio fo miniting liquidity
        let lower_tick_sqrt_price =
            helpers::math::uniswap_v3::tick_math::get_sqrt_ratio_at_tick(lower_tick)?;
        let upper_tick_sqrt_price =
            helpers::math::uniswap_v3::tick_math::get_sqrt_ratio_at_tick(upper_tick)?;
        let current_tick_sqrt_price =
            helpers::math::uniswap_v3::tick_math::get_sqrt_ratio_at_tick(current_tick)?;

        println!("Lower tick sqrt price: {:#?}", lower_tick_sqrt_price);
        println!("Upper tick sqrt price: {:#?}", upper_tick_sqrt_price);
        println!("Current tick sqrt price: {:#?}", current_tick_sqrt_price);

        // Check current ratio of the pool
        let vault_token_balances =
            helpers::vault::get_vault_token_balance_for_calculations(&evm_provider, &vault_details)
                .await?;

        let balance_token0 = vault_token_balances.token0_balance;
        let balance_token1 = vault_token_balances.token1_balance;
        let balance_token0_u256 = vault_token_balances.token0_balance_u256;
        let balance_token1_u256 = vault_token_balances.token1_balance_u256;

        println!("Balance token0: {:#?}", balance_token0);
        println!("Balance token1: {:#?}", balance_token1);

        // Another way to get the needed amoutns to swp
        let balance1_token0_equivalent = balance_token1 * vault_details.pool.price0;

        println!(
            "Balance1_token0_equivalent: {:#?}",
            balance1_token0_equivalent
        );

        let is_balance0_larger = balance_token0 > balance1_token0_equivalent;

        println!("Is balance0 larger: {:#?}", is_balance0_larger);

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

        println!("Liquidity: {:#?}", liquidity);

        let (amount0, amount1) =
            helpers::math::uniswap_v3::liquidity_math::get_amounts_for_liquidity(
                current_tick_sqrt_price,
                lower_tick_sqrt_price,
                upper_tick_sqrt_price,
                liquidity,
            )?;

        println!("Amount0: {:#?}", amount0);
        println!("Token0 U256 Balance: {:#?}", balance_token0_u256);
        println!("Amount1: {:#?}", amount1);
        println!("Token1 U256 Balance: {:#?}", balance_token1_u256);

        let desired_amount0: f64 =
            format_units(amount0, vault_details.pool.token0.decimals)?.parse()?;
        let desired_amount1: f64 =
            format_units(amount1, vault_details.pool.token1.decimals)?.parse()?;

        println!("Desired Amount0: {:#?}", desired_amount0);
        println!("Desired Amount1: {:#?}", desired_amount1);

        // Prepare if need to swap token0 for token1 or teh reverse and how much to swap
        let exess0 = balance_token0 - desired_amount0;
        let exess1 = balance_token1 - desired_amount1;

        println!("Exess0: {:#?}", exess0);
        println!("Exess1: {:#?}", exess1);

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
                token_in: vault_details.pool.token1,
                token_out: vault_details.pool.token0,
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
                token_in: vault_details.pool.token0,
                token_out: vault_details.pool.token1,
                is_swap_0_to_1: true,
                max_amount_in,
            };
        } else {
            // No need to swap
            swap_arg = PrepareSwapArgs {
                exact_amount_out: 0.0,
                parsed_exact_amount_out: U256::ZERO,
                token_in: vault_details.pool.token0,
                token_out: vault_details.pool.token1,
                is_swap_0_to_1: true,
                max_amount_in: U256::ZERO,
            };
        }

        println!("Swap arg: {:#?}", swap_arg);

        // call rebelance on the vault with new tick range and swap direction and amount
        let vault_contract = YielderaVault::new(Address::from_str(contract_address)?, evm_provider);

        let upper_tick = I24::from_str(upper_tick.to_string().as_str())?;
        let lower_tick = I24::from_str(lower_tick.to_string().as_str())?;

        let value_to_send: U256 = parse_units("1", 18)?.into();

        let rebalnce_reciept = vault_contract
            .rebalance(
                lower_tick,
                upper_tick,
                swap_arg.parsed_exact_amount_out,
                swap_arg.max_amount_in,
                swap_arg.is_swap_0_to_1,
            )
            .value(value_to_send)
            .send()
            .await?
            .get_receipt()
            .await?;

        println!("Rebalance reciept: {:#?}", rebalnce_reciept);

        Ok(())
    }

    #[tokio::test]
    async fn test_deposit_withdraw_shares() -> Result<()> {
        // load env vars
        dotenvy::dotenv().ok();

        let private_key = std::env::var("PRIVATE_KEY")?;

        let evm_signer = PrivateKeySigner::from_str(private_key.as_str())?;

        // Init provider with the specified rpc url in config
        let evm_provider = ProviderBuilder::new()
            .with_chain_id(CHAIN_ID)
            .wallet(evm_signer)
            .connect(RPC_URL)
            .await?;

        let contract_address = config::YIELDERA_CONTRACT_ADDRESS;

        let mut vault_details =
            helpers::vault::get_vault_details(&evm_provider, contract_address).await?;

        println!("{:#?}", vault_details);

        if IS_NEW_CONTRACT {
            println!("Associating vault tokens...");
            helpers::vault::associate_vault_tokens(&evm_provider, &mut vault_details).await?;
            println!("Associated vault tokens.");
        }

        // Deposit tokens to vault
        let deposit_reciept =
            helpers::vault::deposit_tokens_to_vault(&evm_provider, &vault_details, 1.0, 0.0)
                .await?;

        // let deposit_logs = deposit_reciept.logs();

        // for log in deposit_logs {
        //     let log_data = log.data();
        //     let data = log_data.data.clone();

        //     // decode the log data
        //     let decoded_log = log.log_decode()?;
        // }

        // Get my vault shares
        let (vault_shares_u256, vault_shares) = helpers::vault::get_vault_shares_by_address(
            &evm_provider,
            &vault_details,
            evm_provider.default_signer_address().to_string().as_str(),
        )
        .await?;

        println!("My vault shares: {:#?}", vault_shares);
        println!("My vault shares u256: {:#?}", vault_shares_u256);

        // Withdraw shares from vault
        helpers::vault::withdraw_shares_from_vault(
            &evm_provider,
            &vault_details,
            vault_shares_u256,
            evm_provider.default_signer_address(),
        )
        .await?;

        // Get vault shares after withdraw
        let (vault_shares_after_u256, vault_shares_after) =
            helpers::vault::get_vault_shares_by_address(
                &evm_provider,
                &vault_details,
                evm_provider.default_signer_address().to_string().as_str(),
            )
            .await?;

        println!("Vault shares after withdraw: {:?}", vault_shares_after);
        println!(
            "Vault shares after withdraw u256: {:?}",
            vault_shares_after_u256
        );

        // Check if vault shares are 0 after withdraw
        assert_eq!(vault_shares_after, 0.0);
        assert_eq!(vault_shares_after_u256, U256::ZERO);

        Ok(())
    }
}
