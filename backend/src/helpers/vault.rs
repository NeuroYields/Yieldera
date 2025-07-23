use std::str::FromStr;

use alloy::{
    primitives::{
        Address, U256,
        utils::{format_units, parse_units},
    },
    providers::{Provider, WalletProvider},
    sol,
};
use color_eyre::eyre::Result;

use crate::{
    config::{FEE_FACTOR, HBAR_EVM_ADDRESS},
    types::{Pool, Token, Vaultdetails},
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
    let current_tick = vault.currentTick().call().await?.as_i32();

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
        },
        name,
        symbol,
        decimals,
        total_supply,
        lower_tick,
        upper_tick,
    })
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

    Ok(())
}
