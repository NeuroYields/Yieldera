use std::str::FromStr;

use alloy::{
    primitives::{Address, utils::format_units},
    providers::{Provider, WalletProvider},
    sol,
};
use color_eyre::eyre::Result;

use crate::types::{Pool, Token, Vaultdetails};

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
    let token0 = vault.token0().call().await?;
    let token1 = vault.token1().call().await?;
    let fee: f64 = vault.fee().call().await?.into();
    let tick_spacing = vault.tickSpacing().call().await?.as_i32();
    let lower_tick = vault.lowerTick().call().await?.as_i32();
    let upper_tick = vault.upperTick().call().await?.as_i32();

    let total_supply: f64 = format_units(total_supply, decimals)?.parse()?;

    // Ftehc token0 and token1 details
    let token0 = ERC20::new(token0, provider);
    let token1 = ERC20::new(token1, provider);

    let token0_name = token0.name().call().await?;
    let token0_symbol = token0.symbol().call().await?;
    let token0_decimals = token0.decimals().call().await?;

    let token1_name = token1.name().call().await?;
    let token1_symbol = token1.symbol().call().await?;
    let token1_decimals = token1.decimals().call().await?;

    Ok(Vaultdetails {
        address: vault_address.to_string(),
        pool: Pool {
            address: pool_address.to_string(),
            token0: Token {
                address: token0.address().to_string(),
                name: token0_name,
                symbol: token0_symbol,
                decimals: token0_decimals,
            },
            token1: Token {
                address: token1.address().to_string(),
                name: token1_name,
                symbol: token1_symbol,
                decimals: token1_decimals,
            },
            fee,
            tick_spacing,
        },
        name,
        symbol,
        decimals,
        total_supply,
        lower_tick,
        upper_tick,
    })
}
