use alloy::primitives::U256;

// pub mod bit_math;
pub mod error;
pub mod full_math;
pub mod liquidity_math;
pub mod sqrt_price_math;
// pub mod swap_math;
// pub mod tick;
// pub mod tick_bitmap;
pub mod tick_math;
pub mod unsafe_math;

pub const U256_1: U256 = U256::from_limbs([1, 0, 0, 0]);
pub const U256_2: U256 = U256::from_limbs([2, 0, 0, 0]);
pub const U256_3: U256 = U256::from_limbs([3, 0, 0, 0]);
pub const U256_4: U256 = U256::from_limbs([4, 0, 0, 0]);
pub const U256_5: U256 = U256::from_limbs([5, 0, 0, 0]);
pub const U256_6: U256 = U256::from_limbs([6, 0, 0, 0]);
pub const U256_7: U256 = U256::from_limbs([7, 0, 0, 0]);
pub const U256_8: U256 = U256::from_limbs([8, 0, 0, 0]);
pub const U256_15: U256 = U256::from_limbs([15, 0, 0, 0]);
pub const U256_16: U256 = U256::from_limbs([16, 0, 0, 0]);
pub const U256_32: U256 = U256::from_limbs([32, 0, 0, 0]);
pub const U256_64: U256 = U256::from_limbs([64, 0, 0, 0]);
pub const U256_127: U256 = U256::from_limbs([127, 0, 0, 0]);
pub const U256_128: U256 = U256::from_limbs([128, 0, 0, 0]);
pub const U256_255: U256 = U256::from_limbs([255, 0, 0, 0]);

pub const U256_256: U256 = U256::from_limbs([256, 0, 0, 0]);
pub const U256_512: U256 = U256::from_limbs([512, 0, 0, 0]);
pub const U256_1024: U256 = U256::from_limbs([1024, 0, 0, 0]);
pub const U256_2048: U256 = U256::from_limbs([2048, 0, 0, 0]);
pub const U256_4096: U256 = U256::from_limbs([4096, 0, 0, 0]);
pub const U256_8192: U256 = U256::from_limbs([8192, 0, 0, 0]);
pub const U256_16384: U256 = U256::from_limbs([16384, 0, 0, 0]);
pub const U256_32768: U256 = U256::from_limbs([32768, 0, 0, 0]);
pub const U256_65536: U256 = U256::from_limbs([65536, 0, 0, 0]);
pub const U256_131072: U256 = U256::from_limbs([131072, 0, 0, 0]);
pub const U256_262144: U256 = U256::from_limbs([262144, 0, 0, 0]);
pub const U256_524288: U256 = U256::from_limbs([524288, 0, 0, 0]);

pub const U256_MAX_TICK: U256 = U256::from_limbs([887272, 0, 0, 0]);
