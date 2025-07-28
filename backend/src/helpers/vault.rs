use std::str::FromStr;

use alloy::{
    primitives::{
        Address, U256,
        aliases::I24,
        utils::{format_units, parse_units},
    },
    providers::{Provider, WalletProvider},
    sol,
};
use color_eyre::eyre::Result;

use crate::{
    config::{FEE_FACTOR, HBAR_EVM_ADDRESS},
    helpers,
    types::{Pool, Token, VaultTokenBalances, Vaultdetails},
};

sol!(
    #[sol(rpc)]
    YielderaVault,
    "./src/abi/YielderaVault.json",
);

sol! {
    #[sol(rpc)]
    contract ERC20 {
        function name() view returns (string memory);
        function symbol() view returns (string memory);
        function decimals() view returns (uint8);
        function totalSupply() view returns (uint256);

        function balanceOf(address account) view returns (uint256);

        function allowance(address owner, address spender) view returns (uint256);

        function approve(address spender, uint256 value) returns (bool);
    }


    // The `rpc` attribute enables contract interaction via the provider.
    #[sol(rpc)]
    contract UniswapV3Pool {
        function token0() external view returns (address);

        function token1() external view returns (address);

        function fee() external view returns (uint24);

        function liquidity() external view returns (uint128);


        function tickSpacing() external view returns (int24);

        function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked);
    }
}

pub async fn get_vault_details<P>(provider: &P, vault_address: &str) -> Result<Vaultdetails>
where
    P: Provider + WalletProvider,
{
    let vault = YielderaVault::new(Address::from_str(vault_address)?, provider);

    let name = vault.name().call().await?;
    let symbol = vault.symbol().call().await?;
    let decimals = vault.decimals().call().await?;
    let total_supply = vault.totalSupply().call().await?;
    let pool_address = vault.pool().call().await?;
    let token0_address = vault.token0().call().await?;
    let token1_address = vault.token1().call().await?;
    let mut fee: f64 = vault.fee().call().await?.into();
    fee = fee / FEE_FACTOR;
    let tick_spacing = vault.tickSpacing().call().await?.as_i32();
    let lower_tick = vault.lowerTick().call().await?.as_i32();
    let upper_tick = vault.upperTick().call().await?.as_i32();

    // Ftehcing sqrt and tick of the pool
    let slot0 = UniswapV3Pool::new(pool_address, provider)
        .slot0()
        .call()
        .await?;
    let sqrt_price_x96 = U256::from_str(slot0.sqrtPriceX96.to_string().as_str())?;
    let current_tick = slot0.tick.as_i32();

    let total_supply: f64 = format_units(total_supply, decimals)?.parse()?;

    // Ftehc token0 and token1 details
    let token0 = ERC20::new(token0_address, provider);
    let token1 = ERC20::new(token1_address, provider);

    let token0_address = token0_address.to_string();
    let token0_name = token0.name().call().await?;
    let token0_symbol = token0.symbol().call().await?;
    let token0_decimals = token0.decimals().call().await?;
    let is_token0_native_wrapper = token0_address.to_lowercase() == HBAR_EVM_ADDRESS.to_lowercase();

    let token1_address = token1_address.to_string();
    let token1_name = token1.name().call().await?;
    let token1_symbol = token1.symbol().call().await?;
    let token1_decimals = token1.decimals().call().await?;
    let is_token1_native_wrapper = token1_address.to_lowercase() == HBAR_EVM_ADDRESS.to_lowercase();

    // Calculate the pool price1 and price0 by using the current tick
    let price1 = helpers::math::tick_to_price(current_tick, token0_decimals, token1_decimals)?;
    let price0 = 1.0 / price1;

    let position_token_id = vault.positionTokenId().call().await?;

    Ok(Vaultdetails {
        address: vault_address.to_string(),
        pool: Pool {
            address: pool_address.to_string(),
            token0: Token {
                address: token0_address,
                name: token0_name,
                symbol: token0_symbol,
                decimals: token0_decimals,
                is_native_wrapper: is_token0_native_wrapper,
            },
            token1: Token {
                address: token1_address,
                name: token1_name,
                symbol: token1_symbol,
                decimals: token1_decimals,
                is_native_wrapper: is_token1_native_wrapper,
            },
            fee,
            tick_spacing,
            current_tick,
            sqrt_price_x96,
            price1,
            price0,
        },
        name,
        symbol,
        decimals,
        total_supply,
        lower_tick,
        upper_tick,
        position_token_id,
    })
}

pub async fn update_vault_current_position_data<P>(
    provider: &P,
    vault: &mut Vaultdetails,
) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let lower_tick = vault_contract.lowerTick().call().await?;
    let upper_tick = vault_contract.upperTick().call().await?;
    let position_token_id = vault_contract.positionTokenId().call().await?;

    vault.lower_tick = lower_tick.as_i32();
    vault.upper_tick = upper_tick.as_i32();
    vault.position_token_id = position_token_id;

    Ok(())
}

pub async fn deposit_tokens_to_vault<P>(
    provider: &P,
    vault: &Vaultdetails,
    deposit0: f64,
    deposit1: f64,
) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    // We use 18 decimals cause evm relay handles nativve hbar as 18 decimals
    let custom_deposit_0: U256 = parse_units(deposit0.to_string().as_str(), 18)?.into();
    let custom_deposit_1: U256 = parse_units(deposit1.to_string().as_str(), 18)?.into();

    let deposit0: U256 =
        parse_units(deposit0.to_string().as_str(), vault.pool.token0.decimals)?.into();
    let deposit1: U256 =
        parse_units(deposit1.to_string().as_str(), vault.pool.token1.decimals)?.into();

    let token0_contract = ERC20::new(
        Address::from_str(vault.pool.token0.address.as_str())?,
        provider,
    );
    let token1_contract = ERC20::new(
        Address::from_str(vault.pool.token1.address.as_str())?,
        provider,
    );

    let mut value_to_send = U256::ZERO;

    // Check the balance of the user of token0
    if vault.pool.token0.is_native_wrapper {
        let balance = provider
            .get_balance(provider.default_signer_address())
            .await?;

        // <= because for the native balance check we need to have enough balance to pay for the gas fees
        if balance <= custom_deposit_0 {
            return Err(color_eyre::eyre::eyre!(
                "Insufficient HBAR Balance for deposit 0. curr balance : {:?}, deposit amount : {:?}",
                balance,
                custom_deposit_0
            ));
        }

        value_to_send = custom_deposit_0;
    } else {
        let balance = token0_contract
            .balanceOf(provider.default_signer_address())
            .call()
            .await?;

        if balance < deposit0 {
            return Err(color_eyre::eyre::eyre!(
                "Insufficient Token0 Balance for deposit 0"
            ));
        }

        println!("Check allownace for deposit0");
        // Check for the allownace now and approve it if needed
        let allownace0 = token0_contract
            .allowance(provider.default_signer_address(), vault_address)
            .call()
            .await?;

        if allownace0 < deposit0 {
            let approve_tx = token0_contract
                .approve(vault_address, deposit0)
                .send()
                .await?;

            let approve_receipt = approve_tx.get_receipt().await?;

            let approve_tx_hash = approve_receipt.transaction_hash;
            let approve_status = approve_receipt.status();

            println!("Approve Deposit0 transaction hash: {}", approve_tx_hash);
            println!("Approve Deposit0 transaction status: {}", approve_status);

            if !approve_status {
                return Err(color_eyre::eyre::eyre!(
                    "Approve Deposit0 transaction failed"
                ));
            }
        }
    }

    // Check the balance of the user of token1
    if vault.pool.token1.is_native_wrapper {
        let balance = provider
            .get_balance(provider.default_signer_address())
            .await?;

        // <= because for the native balance check we need to have enough balance to pay for the gas fees
        if balance <= custom_deposit_1 {
            return Err(color_eyre::eyre::eyre!(
                "Insufficient HBAR Balance for deposit 1. Curr balance : {:?}, deposit amount : {:?}",
                balance,
                custom_deposit_1
            ));
        }

        value_to_send = custom_deposit_1;
    } else {
        let balance = token1_contract
            .balanceOf(provider.default_signer_address())
            .call()
            .await?;
        if balance < deposit1 {
            return Err(color_eyre::eyre::eyre!(
                "Insufficient Token1 Balance for deposit 1"
            ));
        }
        println!("Check allownace for deposit1");
        // Check for the allownace now and approve it if needed
        let allownace1 = token1_contract
            .allowance(provider.default_signer_address(), vault_address)
            .call()
            .await?;

        println!("allownace1: {:?}", allownace1);

        if allownace1 < deposit1 {
            let approve_tx = token1_contract
                .approve(vault_address, deposit1)
                .send()
                .await?;

            let approve_receipt = approve_tx.get_receipt().await?;

            let approve_tx_hash = approve_receipt.transaction_hash;
            let approve_status = approve_receipt.status();

            println!("Approve Deposit1 transaction hash: {}", approve_tx_hash);
            println!("Approve Deposit1 transaction status: {}", approve_status);

            if !approve_status {
                return Err(color_eyre::eyre::eyre!(
                    "Approve Deposit1 transaction failed"
                ));
            }
        }
    }

    let deposit_tx = vault_contract
        .deposit(deposit0, deposit1, provider.default_signer_address())
        .value(value_to_send)
        .send()
        .await?;

    let deposit_receipt = deposit_tx.get_receipt().await?;

    let deposit_tx_hash = deposit_receipt.transaction_hash;
    let deposit_status = deposit_receipt.status();

    println!("Deposit transaction hash: {}", deposit_tx_hash);
    println!("Deposit transaction status: {}", deposit_status);

    if !deposit_status {
        return Err(color_eyre::eyre::eyre!("Deposit transaction failed"));
    }

    Ok(())
}

pub async fn mint_liquidity<P>(
    provider: &P,
    vault: &Vaultdetails,
    lower_tick: i32,
    upper_tick: i32,
    amount0_desired: f64,
    amount1_desired: f64,
) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let amount0_desired: U256 = parse_units(
        amount0_desired.to_string().as_str(),
        vault.pool.token0.decimals,
    )?
    .into();
    let amount1_desired: U256 = parse_units(
        amount1_desired.to_string().as_str(),
        vault.pool.token1.decimals,
    )?
    .into();

    let upper_tick = I24::from_str(upper_tick.to_string().as_str())?;
    let lower_tick = I24::from_str(lower_tick.to_string().as_str())?;

    let mint_tx = vault_contract
        .mintLiquidity(
            provider.default_signer_address(),
            amount0_desired,
            amount1_desired,
            lower_tick,
            upper_tick,
            U256::MAX,
        )
        .gas(15_000_000)
        .send()
        .await?;

    let mint_receipt = mint_tx.get_receipt().await?;

    let mint_tx_hash = mint_receipt.transaction_hash;
    let mint_status = mint_receipt.status();

    println!("Mint transaction hash: {}", mint_tx_hash);
    println!("Mint transaction status: {}", mint_status);

    if !mint_status {
        return Err(color_eyre::eyre::eyre!("Mint transaction failed"));
    }

    Ok(())
}

pub async fn mint_liquidity_from_amount0<P>(
    provider: &P,
    vault: &Vaultdetails,
    lower_tick: i32,
    upper_tick: i32,
    amount0_desired: f64,
) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let amount0_desired: U256 = parse_units(
        amount0_desired.to_string().as_str(),
        vault.pool.token0.decimals,
    )?
    .into();

    let amount1_desired = helpers::math::estimate_amount1_given_amount0(
        vault.pool.sqrt_price_x96,
        lower_tick,
        upper_tick,
        amount0_desired,
    )?;

    println!("Amount0 desired: {:?}", amount0_desired);
    println!("Amount1 desired: {:?}", amount1_desired);

    let upper_tick = I24::from_str(upper_tick.to_string().as_str())?;
    let lower_tick = I24::from_str(lower_tick.to_string().as_str())?;

    let mint_tx = vault_contract
        .mintLiquidity(
            vault_address,
            amount0_desired,
            amount1_desired,
            lower_tick,
            upper_tick,
            U256::MAX,
        )
        .gas(15_000_000)
        .send()
        .await?;

    let mint_receipt = mint_tx.get_receipt().await?;

    let mint_tx_hash = mint_receipt.transaction_hash;
    let mint_status = mint_receipt.status();

    println!("Mint transaction hash: {}", mint_tx_hash);
    println!("Mint transaction status: {}", mint_status);

    if !mint_status {
        return Err(color_eyre::eyre::eyre!(
            "Mint transaction failed. Error: {:?}",
            mint_receipt
        ));
    }

    Ok(())
}

pub async fn burn_all_liquidity<P>(provider: &P, vault: &Vaultdetails) -> Result<()>
where
    P: Provider + WalletProvider,
{
    if vault.position_token_id == U256::ZERO {
        println!("Skiiping burning liquidity as there is no liquidity to burn");
        return Ok(());
    }

    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let burn_tx = vault_contract.burnAllLiquidity().send().await?;

    let burn_receipt = burn_tx.get_receipt().await?;

    let burn_tx_hash = burn_receipt.transaction_hash;
    let burn_status = burn_receipt.status();

    println!("Burn transaction hash: {}", burn_tx_hash);
    println!("Burn transaction status: {}", burn_status);

    if !burn_status {
        return Err(color_eyre::eyre::eyre!("Burn transaction failed"));
    }

    Ok(())
}

pub async fn associate_vault_tokens<P>(provider: &P, vault: &Vaultdetails) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let associate_tx = vault_contract.associateVaultTokens().send().await?;

    let associate_receipt = associate_tx.get_receipt().await?;

    let associate_tx_hash = associate_receipt.transaction_hash;
    let associate_status = associate_receipt.status();

    println!("Associate transaction hash: {}", associate_tx_hash);
    println!("Associate transaction status: {}", associate_status);

    if !associate_status {
        return Err(color_eyre::eyre::eyre!("Associate transaction failed"));
    }

    Ok(())
}

pub async fn get_vault_token_balance_for_calculations<P>(
    provider: &P,
    vault: &Vaultdetails,
) -> Result<VaultTokenBalances>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let token0 = &vault.pool.token0;
    let token1 = &vault.pool.token1;

    let token0_balance: f64;
    let token1_balance: f64;
    let token0_balance_u256: U256;
    let token1_balance_u256: U256;

    if token0.is_native_wrapper {
        // Remove 1 hbar from the balance to cover the fees of minting liquidity
        let balance = provider.get_balance(vault_address).await? - U256::from(10_u64.pow(18));

        token0_balance = format_units(balance, 18)?.parse()?;
        token0_balance_u256 = balance / (U256::from(10).pow(U256::from(10)));
    } else {
        let balance = ERC20::new(Address::from_str(token0.address.as_str())?, provider)
            .balanceOf(vault_address)
            .call()
            .await?;

        token0_balance = format_units(balance, token0.decimals)?.parse()?;
        token0_balance_u256 = balance;
    }

    if token1.is_native_wrapper {
        // Remove 1 hbar from the balance to cover the fees of minting liquidity
        let balance = provider.get_balance(vault_address).await? - U256::from(10_u64.pow(18));

        token1_balance = format_units(balance, 18)?.parse()?;
        token1_balance_u256 = balance / (U256::from(10).pow(U256::from(10)));
    } else {
        let balance = ERC20::new(Address::from_str(token1.address.as_str())?, provider)
            .balanceOf(vault_address)
            .call()
            .await?;

        token1_balance = format_units(balance, token1.decimals)?.parse()?;
        token1_balance_u256 = balance;
    }

    Ok(VaultTokenBalances {
        token0_balance,
        token1_balance,
        token0_balance_u256,
        token1_balance_u256,
    })
}
