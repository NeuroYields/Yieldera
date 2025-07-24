// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IUniswapV3Pool.sol";
import "./libraries/UV3Math.sol";
import "./libraries/AssociateHelper.sol";
import "./libraries/TransferHelper.sol";
import "./interfaces/INonfungiblePositionManager.sol";

contract YielderaVault is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    address constant NULL_ADDRESS = address(0);
    address constant WHBAR_ADDRESS =
        address(0x0000000000000000000000000000000000003aD2);
    INonfungiblePositionManager constant NFPM =
        INonfungiblePositionManager(0x000000000000000000000000000000000013F618);

    // Immutable state variables
    address public immutable pool;
    address public immutable token0;
    address public immutable token1;
    uint24 public immutable fee;
    int24 public immutable tickSpacing;
    bool public immutable isToken0Native;
    bool public immutable isToken1Native;

    // State variables
    int24 public upperTick;
    int24 public lowerTick;

    constructor(
        address _pool
    ) ERC20("Yieldera Vault Hbar", "YHbar") Ownable(msg.sender) {
        require(_pool != NULL_ADDRESS, "NULL_POOL");

        pool = _pool;
        token0 = IUniswapV3Pool(_pool).token0();
        token1 = IUniswapV3Pool(_pool).token1();
        fee = IUniswapV3Pool(_pool).fee();
        tickSpacing = IUniswapV3Pool(_pool).tickSpacing();

        isToken0Native = token0 == WHBAR_ADDRESS;
        isToken1Native = token1 == WHBAR_ADDRESS;
    }

    /// @notice Associate a hedera token to the vault
    /// @param token The hedera token address to associate
    function associateToken(address token) public onlyOwner {
        require(token != NULL_ADDRESS, "NULL_TOKEN");
        require(token == token0 || token == token1, "INVALID_TOKEN");

        AssociateHelper.safeAssociateToken(address(this), token);
    }

    /// @notice Associate the 2 tokens of the vault
    function associateVaultTokens() external onlyOwner {
        if (!isToken0Native) associateToken(token0);
        if (!isToken1Native) associateToken(token1);
    }

    /// @notice Deposit tokens into the vault
    /// @param deposit0 The amount of token0 to deposit
    /// @param deposit1 The amount of token1 to deposit
    /// @param to The address to receive the vault shares tokens
    function deposit(
        uint256 deposit0,
        uint256 deposit1,
        address to
    ) external payable nonReentrant returns (uint256 shares) {
        // Ensure oen of the deposits is larger than 0
        require(deposit0 > 0 || deposit1 > 0, "ZERO_DEPOSIT");

        // Ensure to is valdi address
        require(to != NULL_ADDRESS, "NULL_TO");

        // Get the current spot price
        uint256 spotPrice = _fetchPoolSpotPrice(
            token0,
            token1,
            currentTick(),
            deposit0
        );

        // Transfer the tokens to the vault
        if (deposit0 > 0) {
            if (isToken0Native) {
                // Ensure msg.value is equal to deposit0
                require(msg.value == deposit0, "INSUFF_HBAR");
            } else {
                TransferHelper.safeTransferFrom(
                    token0,
                    msg.sender,
                    address(this),
                    deposit0
                );
            }
        }

        if (deposit1 > 0) {
            if (isToken1Native) {
                // Ensure msg.value is equal  to deposit1
                require(msg.value == deposit1, "INSUFF_HBAR");
            } else {
                TransferHelper.safeTransferFrom(
                    token1,
                    msg.sender,
                    address(this),
                    deposit1
                );
            }
        }

        shares = 0;
    }

    /// @notice allow the owner to withdraw tokens from the vault
    /// @param token The token to withdraw
    /// @param amount The amount to withdraw
    /// @param to The address to receive the tokens
    function withdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        require(token == token0 || token == token1, "INVALID_TOKEN");
        require(to != NULL_ADDRESS, "NULL_TO");

        if (token == WHBAR_ADDRESS) {
            TransferHelper.safeTransferHBAR(to, amount);
        } else {
            TransferHelper.safeTransfer(token, to, amount);
        }
    }

    /// @notice Mint a new Liquidity to the pool
    /// @param to The address to receive the NFT
    /// @param amount0Max The maximum amount of token0 to deposit
    /// @param amount1Max The maximum amount of token1 to deposit
    /// @param tickLower The lower tick of the range
    /// @param tickUpper The upper tick of the range
    /// @param deadline The deadline for the transaction
    function mintLiquidity(
        address to,
        uint256 amount0Max,
        uint256 amount1Max,
        int24 tickLower,
        int24 tickUpper,
        uint256 deadline
    )
        external
        onlyOwner
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        // Ensure vault has enough balance to execute this mint
        uint256 balance0;
        uint256 balance1;

        if (isToken0Native) {
            balance0 = address(this).balance;
        } else {
            balance0 = IERC20(token0).balanceOf(address(this));
        }

        if (isToken1Native) {
            balance1 = address(this).balance;
        } else {
            balance1 = IERC20(token1).balanceOf(address(this));
        }

        require(balance0 >= amount0Max, "INSUFF_TOKEN0_BAL");
        require(balance1 >= amount1Max, "INSUFF_TOKEN1_BAL");

        // Ensure ticks are valid
        require(
            tickLower % tickSpacing == 0 && tickUpper % tickSpacing == 0,
            "TICK_NO_MUL_OF_SPAC"
        );

        // Do the needed approves
        if (!isToken0Native) {
            TransferHelper.safeApprove(token0, address(NFPM), amount0Max);
        }

        if (!isToken1Native) {
            TransferHelper.safeApprove(token1, address(NFPM), amount1Max);
        }

        // Mint the liquidity
        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amount0Max,
                amount1Desired: amount1Max,
                amount0Min: 0,
                amount1Min: 0,
                recipient: to,
                deadline: deadline
            });

        // 0.5 hbar fee by default
        // uint256 valueToSend = 500000000000000000;
        // 0.5 hbar fee by default with 8 decimals
        uint256 valueToSend = 50_000_000;

        if (token0 == WHBAR_ADDRESS) {
            valueToSend += amount0Max;
            // Check if the balance of the contract is enough to cover the amount of HBAR to be sent
            require(
                address(this).balance >= valueToSend,
                string.concat(
                    "HBAR_BALANCE_LESS: balance ",
                    Strings.toString(address(this).balance),
                    ", required ",
                    Strings.toString(valueToSend)
                )
            );
        } else if (token1 == WHBAR_ADDRESS) {
            valueToSend += amount1Max;
            // Check if the balance of the contract is enough to cover the amount of HBAR to be sent
            require(
                address(this).balance >= valueToSend,
                string.concat(
                    "HBAR_BALANCE_LESS: balance ",
                    Strings.toString(address(this).balance),
                    ", required ",
                    Strings.toString(valueToSend)
                )
            );
        }

        (tokenId, liquidity, amount0, amount1) = NFPM.mint{value: valueToSend}(
            params
        );
    }

    /// @notice Returns current price tick
    /// @param tick Uniswap pool's current price tick
    function currentTick() public view returns (int24 tick) {
        (, int24 tick_, , , , , bool unlocked_) = IUniswapV3Pool(pool).slot0();
        require(unlocked_, "YV.currentTick: LOCKED_POOL");
        tick = tick_;
    }

    /*//////////////////////////////////////////////////////////////
                               INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice returns equivalent _tokenOut for _amountIn, _tokenIn using spot price
    /// @param _tokenIn  token the input amount is in
    /// @param _tokenOut  token for the output amount
    /// @param _tick tick for the spot price
    /// @param _amountIn The amount of tokenIn
    /// @return amountOut Equivalent amount of tokenOut
    function _fetchPoolSpotPrice(
        address _tokenIn,
        address _tokenOut,
        int24 _tick,
        uint256 _amountIn
    ) internal pure returns (uint256) {
        return
            UV3Math.getQuoteAtTick(
                _tick,
                UV3Math.toUint128(_amountIn),
                _tokenIn,
                _tokenOut
            );
    }
}
