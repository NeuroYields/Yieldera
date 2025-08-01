use std::str::FromStr;

use alloy::{
    primitives::{Address, U256, utils::format_units},
    providers::{Provider, WalletProvider},
    sol,
};
use color_eyre::eyre::Result;

use crate::{
    config::{CONFIG, FEE_FACTOR},
    helpers,
    types::{Pool, Token, VaultDetails, VaultTokenBalances},
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

pub async fn get_vault_details<P>(provider: &P, vault_address: &str) -> Result<VaultDetails>
where
    P: Provider + WalletProvider,
{
    let vault = YielderaVault::new(Address::from_str(vault_address)?, provider);

    let hbar_evm_address = &CONFIG.toml_config.hbar_evm_address;

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
    let is_active = vault.isActive().call().await?;
    let is_vault_tokens_associated = vault.isVaultTokensAssociated().call().await?;

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
    let is_token0_native_wrapper = token0_address.to_lowercase() == hbar_evm_address.to_lowercase();

    let token1_address = token1_address.to_string();
    let token1_name = token1.name().call().await?;
    let token1_symbol = token1.symbol().call().await?;
    let token1_decimals = token1.decimals().call().await?;
    let is_token1_native_wrapper = token1_address.to_lowercase() == hbar_evm_address.to_lowercase();

    // Calculate the pool price1 and price0 by using the current tick
    let price1 = helpers::math::tick_to_price(current_tick, token0_decimals, token1_decimals)?;
    let price0 = 1.0 / price1;

    Ok(VaultDetails {
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
        is_active,
        is_vault_tokens_associated,
    })
}

pub async fn get_vault_tokens_balances<P>(
    provider: &P,
    vault: &VaultDetails,
) -> Result<VaultTokenBalances>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let token0 = &vault.pool.token0;
    let token1 = &vault.pool.token1;

    let token0_balance: f64;
    let token1_balance: f64;
    let token0_balance_u256: U256;
    let token1_balance_u256: U256;

    let balance = ERC20::new(Address::from_str(token0.address.as_str())?, provider)
        .balanceOf(vault_address)
        .call()
        .await?;

    token0_balance_u256 = balance;
    token0_balance = format_units(balance, token0.decimals)?.parse()?;

    let balance = ERC20::new(Address::from_str(token1.address.as_str())?, provider)
        .balanceOf(vault_address)
        .call()
        .await?;

    token1_balance_u256 = balance;
    token1_balance = format_units(balance, token1.decimals)?.parse()?;

    Ok(VaultTokenBalances {
        token0_balance,
        token1_balance,
        token0_balance_u256,
        token1_balance_u256,
    })
}

pub async fn update_vault_current_tick<P>(provider: &P, vault: &mut VaultDetails) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let current_tick = vault_contract.currentTick().call().await?;

    vault.pool.current_tick = current_tick.as_i32();

    Ok(())
}

pub async fn update_vault_live<P>(provider: &P, vault: &mut VaultDetails) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let current_tick = vault_contract.currentTick().call().await?.as_i32();

    // Calculate the pool price1 and price0 by using the current tick
    let price1 = helpers::math::tick_to_price(
        current_tick,
        vault.pool.token0.decimals,
        vault.pool.token1.decimals,
    )?;
    let price0 = 1.0 / price1;

    vault.pool.current_tick = current_tick;
    vault.pool.price1 = price1;
    vault.pool.price0 = price0;

    Ok(())
}

pub async fn update_vault_after_rebalance<P>(provider: &P, vault: &mut VaultDetails) -> Result<()>
where
    P: Provider + WalletProvider,
{
    let vault_address = Address::from_str(vault.address.as_str())?;

    let vault_contract = YielderaVault::new(vault_address, provider);

    let current_tick = vault_contract.currentTick().call().await?.as_i32();
    let lower_tick = vault_contract.lowerTick().call().await?;
    let upper_tick = vault_contract.upperTick().call().await?;
    let is_active = vault_contract.isActive().call().await?;

    // Calculate the pool price1 and price0 by using the current tick
    let price1 = helpers::math::tick_to_price(
        current_tick,
        vault.pool.token0.decimals,
        vault.pool.token1.decimals,
    )?;
    let price0 = 1.0 / price1;

    vault.pool.current_tick = current_tick;
    vault.pool.price1 = price1;
    vault.pool.price0 = price0;
    vault.lower_tick = lower_tick.as_i32();
    vault.upper_tick = upper_tick.as_i32();
    vault.is_active = is_active;

    Ok(())
}
