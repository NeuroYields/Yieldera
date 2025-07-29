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
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "./interfaces/IWhbarHelper.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/callback/IUniswapV3MintCallback.sol";

contract YielderaVault is
    ERC20,
    Ownable,
    ReentrancyGuard,
    IUniswapV3MintCallback
{
    using SafeERC20 for IERC20;
    using SafeCast for uint256;

    // Constants
    address constant NULL_ADDRESS = address(0);
    address constant WHBAR_ADDRESS =
        address(0x0000000000000000000000000000000000003aD2);
    address constant WHBAR_HELPER_ADDRESS =
        address(0x000000000000000000000000000000000050a8a7);
    address constant SAUCER_NFT_TOKEN =
        address(0x000000000000000000000000000000000013feE4);
    INonfungiblePositionManager constant NFPM =
        INonfungiblePositionManager(0x000000000000000000000000000000000013F618);
    ISwapRouter constant SWAP_ROUTER =
        ISwapRouter(0x0000000000000000000000000000000000159398);

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
    uint256 public positionTokenId;

    // Events
    event Deposit(
        address indexed sender,
        address indexed to,
        uint256 shares,
        uint256 amount0,
        uint256 amount1
    );

    event Withdraw(
        address indexed sender,
        address indexed to,
        uint256 shares,
        uint256 amount0,
        uint256 amount1
    );

    event Rebalance(
        int24 tick,
        uint256 totalAmount0,
        uint256 totalAmount1,
        uint256 feeAmount0,
        uint256 feeAmount1,
        uint256 totalSupply
    );

    event BurnAllLiquidity(
        address indexed sender,
        uint256 amount0,
        uint256 amount1
    );

    event MintLiquidity(
        address indexed sender,
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    event IncreaseLiquidity(
        address indexed sender,
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    event DecreaseLiquidity(
        address indexed sender,
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

    event AssociateToken(address indexed token);

    event CustomEvent(address indexed sender, string message);

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
        require(
            token == token0 || token == token1 || token == SAUCER_NFT_TOKEN,
            "INVALID_TOKEN"
        );

        AssociateHelper.safeAssociateToken(address(this), token);

        emit AssociateToken(token);
    }

    /// @notice Associate the 2 tokens of the vault
    function associateVaultTokens() external onlyOwner {
        associateToken(token0);
        associateToken(token1);
        associateToken(SAUCER_NFT_TOKEN);
    }

    /// @notice Unwraps the contract's WHBAR balance and sends it to recipient as hbar.
    /// @dev The amountMinimum parameter prevents malicious contracts from stealing WHBAR from users.
    function unwrapWhbar(uint256 amount) public onlyOwner {
        // Safe approve the contract to spend the whbar
        TransferHelper.safeApprove(WHBAR_ADDRESS, WHBAR_HELPER_ADDRESS, amount);
        // Unwrap vault whbar
        IWhbarHelper(WHBAR_HELPER_ADDRESS).unwrapWhbar(amount);
    }

    /// @notice Wrap the contract's whbar balance
    function wrapHbar(uint256 amount) public payable onlyOwner {
        uint256 hbarBlance = address(this).balance;

        require(hbarBlance >= amount, "NOT_ENOUGH_HBAR");

        // Wrap vault whbar
        IWhbarHelper(WHBAR_HELPER_ADDRESS).deposit{value: amount}();
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
                // Wrap the token0 amount
                wrapHbar(deposit0);
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
                wrapHbar(deposit1);
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

    /// @notice Rebelance the vault by withdrawing all liquidity and swapping it to the underlying tokens, then adding the new liquidity
    /// @param newLowerTick The new lower tick of the range
    /// @param newUpperTick The new upper tick of the range
    /// @param desiredSwapOutAmount The amount of token0 or token1 to swap out
    /// @param amountInMax The max amount of token0 or token1 to swap in
    /// @param isSwap0To1 If the swap is from token0 to token1
    function rebalance(
        int24 newLowerTick,
        int24 newUpperTick,
        uint256 desiredSwapOutAmount,
        uint256 amountInMax,
        bool isSwap0To1
    ) external onlyOwner nonReentrant {
        // Withdraw all liquidity if there is a position
        if (positionTokenId != 0) {
            burnAllLiquidity();
        }

        // Check if the swap is needed
        if (desiredSwapOutAmount > 0) {
            // Swap using the swap router contract
            if (isSwap0To1) {
                if (isToken0Native) {
                    // Wrap the token0 amount
                    wrapHbar(amountInMax);
                }

                // Aprove the swap router to spend the token0
                TransferHelper.safeApprove(
                    token0,
                    address(SWAP_ROUTER),
                    amountInMax
                );

                // Swap token0 for token1
                SWAP_ROUTER.exactOutputSingle(
                    ISwapRouter.ExactOutputSingleParams({
                        tokenIn: token0,
                        tokenOut: token1,
                        fee: fee,
                        recipient: address(this),
                        deadline: block.timestamp,
                        amountOut: desiredSwapOutAmount,
                        amountInMaximum: amountInMax,
                        sqrtPriceLimitX96: 0
                    })
                );
            } else {
                if (isToken1Native) {
                    // Wrap the token1 amount
                    wrapHbar(amountInMax);
                }

                // Aprove the swap router to spend the token1
                TransferHelper.safeApprove(
                    token1,
                    address(SWAP_ROUTER),
                    amountInMax
                );

                // Swap token1 for token0
                SWAP_ROUTER.exactOutputSingle(
                    ISwapRouter.ExactOutputSingleParams({
                        tokenIn: token1,
                        tokenOut: token0,
                        fee: fee,
                        recipient: address(this),
                        deadline: block.timestamp,
                        amountOut: desiredSwapOutAmount,
                        amountInMaximum: amountInMax,
                        sqrtPriceLimitX96: 0
                    })
                );
            }
        }

        // Fetch the new balances
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

        // Add the new liquidity
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

        // Refund any extra hbar sent
        NFPM.refundETH();

        // Update the lower and upper ticks of the vault
        lowerTick = tickLower;
        upperTick = tickUpper;
        positionTokenId = tokenId;

        emit MintLiquidity(msg.sender, tokenId, liquidity, amount0, amount1);
    }

    /// @notice Mint a new Liquidity to the pool
    /// @param amount0Max The maximum amount of token0 to deposit
    /// @param amount1Max The maximum amount of token1 to deposit
    /// @param tickLower The lower tick of the range
    /// @param tickUpper The upper tick of the range
    function mintLiquidity2(
        uint256 amount0Max,
        uint256 amount1Max,
        int24 tickLower,
        int24 tickUpper
    )
        external
        payable
        onlyOwner
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        // Ensure vault has enough balance to execute this mint
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        require(balance0 >= amount0Max, "INSUFF_TOKEN0_BAL");
        require(balance1 >= amount1Max, "INSUFF_TOKEN1_BAL");

        // Ensure ticks are valid
        require(
            tickLower % tickSpacing == 0 && tickUpper % tickSpacing == 0,
            "TICK_NO_MUL_OF_SPAC"
        );

        // 0.5 hbar fee by default
        // uint256 valueToSend = 500000000000000000;
        // 0.5 hbar fee by default with 8 decimals
        uint256 valueToSend = 50_000_000;

        require(
            msg.value >= valueToSend,
            string.concat(
                "INSUFF_SENT_HBAR: Sendet hbar ",
                Strings.toString(msg.value),
                ", required ",
                Strings.toString(valueToSend)
            )
        );

        liquidity = _liquidityForAmounts(
            tickLower,
            tickUpper,
            amount0Max,
            amount1Max
        );

        (amount0, amount1) = IUniswapV3Pool(pool).mint{value: valueToSend}(
            address(this),
            tickLower,
            tickUpper,
            liquidity,
            abi.encode(address(this))
        );

        // Refund any extra hbar sent
        NFPM.refundETH();

        // Update the lower and upper ticks of the vault
        lowerTick = tickLower;
        upperTick = tickUpper;
        positionTokenId = tokenId;

        emit MintLiquidity(msg.sender, tokenId, liquidity, amount0, amount1);
    }

    /// @notice Burn all the liquidity from the pool
    function burnAllLiquidity()
        public
        onlyOwner
        returns (uint256 amount0, uint256 amount1)
    {
        require(
            upperTick != 0 && lowerTick != 0 && positionTokenId != 0,
            "NO_LIQUIDITY"
        );

        /// Withdraw all liquidity and collect all fees from Uniswap pool
        (uint128 liquidity, uint256 fees0, uint256 fees1) = currentPosition();

        // Burn the liquidity from the pool
        (amount0, amount1) = _burnLiquidity(
            liquidity,
            address(this),
            fees0,
            fees1
        );

        // Update the lower and upper ticks of the vault to 0
        lowerTick = 0;
        upperTick = 0;
        positionTokenId = 0;

        emit BurnAllLiquidity(msg.sender, amount0, amount1);
    }

    /// @notice Returns current price tick
    /// @param tick Uniswap pool's current price tick
    function currentTick() public view returns (int24 tick) {
        (, int24 tick_, , , , , bool unlocked_) = IUniswapV3Pool(pool).slot0();
        require(unlocked_, "YV.currentTick: LOCKED_POOL");
        tick = tick_;
    }

    ///@notice function that GETS teh position of the vault
    function getCurrentPosition()
        public
        view
        returns (
            address token0_p,
            address token1_p,
            uint24 fee_p,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {
        (
            token0_p,
            token1_p,
            fee_p,
            tickLower,
            tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0,
            tokensOwed1
        ) = NFPM.positions(positionTokenId);
    }

    ///@notice function that GETS teh position by nft id
    /// @param tokenSN The serial number of the token that represents the position
    function getPositionById(
        uint256 tokenSN
    )
        public
        view
        returns (
            address token0_p,
            address token1_p,
            uint24 fee_p,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {
        (
            token0_p,
            token1_p,
            fee_p,
            tickLower,
            tickUpper,
            liquidity,
            feeGrowthInside0LastX128,
            feeGrowthInside1LastX128,
            tokensOwed0,
            tokensOwed1
        ) = NFPM.positions(tokenSN);
    }

    /*//////////////////////////////////////////////////////////////
                               INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Burn liquidity from the sender and collect tokens owed for the liquidity
    /// @param liquidity The amount of liquidity to burn
    /// @param to The address which should receive the fees collected
    /// @return amount0 The amount of fees collected in token0
    /// @return amount1 The amount of fees collected in token1
    function _burnLiquidity(
        uint128 liquidity,
        address to,
        uint256 amount0Min,
        uint256 amount1Min
    ) internal returns (uint256 amount0, uint256 amount1) {
        // First Decrease the liquidity
        NFPM.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenSN: positionTokenId,
                liquidity: liquidity,
                amount0Min: amount0Min,
                amount1Min: amount1Min,
                deadline: type(uint256).max
            })
        );

        // Collect all the fees
        (amount0, amount1) = NFPM.collect(
            INonfungiblePositionManager.CollectParams({
                tokenSN: positionTokenId,
                recipient: to,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        // If the token is hbar, unwrap it
        if (isToken0Native && amount0 > 0) {
            unwrapWhbar(amount0);
        }
        if (isToken1Native && amount1 > 0) {
            unwrapWhbar(amount1);
        }
    }

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

    /**
     @notice Returns information about the curuent liquidity position.
     @return liquidity liquidity amount
     @return tokensOwed0 amount of token0 owed to the owner of the position
     @return tokensOwed1 amount of token1 owed to the owner of the position
     */
    function currentPosition()
        public
        view
        returns (uint128 liquidity, uint128 tokensOwed0, uint128 tokensOwed1)
    {
        (, , , , , liquidity, , , tokensOwed0, tokensOwed1) = NFPM.positions(
            positionTokenId
        );
    }

    /**
     @notice Calculates amount of liquidity in a position for given token0 and token1 amounts
     @param tickLower The lower tick of the liquidity position
     @param tickUpper The upper tick of the liquidity position
     @param amount0 token0 amount
     @param amount1 token1 amount
     */
    function _liquidityForAmounts(
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0,
        uint256 amount1
    ) internal view returns (uint128) {
        (uint160 sqrtRatioX96, , , , , , ) = IUniswapV3Pool(pool).slot0();
        return
            UV3Math.getLiquidityForAmounts(
                sqrtRatioX96,
                UV3Math.getSqrtRatioAtTick(tickLower),
                UV3Math.getSqrtRatioAtTick(tickUpper),
                amount0,
                amount1
            );
    }

    /**
     @notice Callback function for mint
     @dev this is where the payer transfers required token0 and token1 amounts
     @param amount0 required amount of token0
     @param amount1 required amount of token1
     @param data encoded payer's address
     */
    function uniswapV3MintCallback(
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        uint256 balance0 = IERC20(token0).balanceOf(address(this));

        require(msg.sender == address(pool), "cb1");
        address payer = abi.decode(data, (address));

        if (payer == address(this)) {
            if (amount0 > 0) IERC20(token0).safeTransfer(msg.sender, amount0);
            if (amount1 > 0) IERC20(token1).safeTransfer(msg.sender, amount1);
        } else {
            if (amount0 > 0)
                IERC20(token0).safeTransferFrom(payer, msg.sender, amount0);
            if (amount1 > 0)
                IERC20(token1).safeTransferFrom(payer, msg.sender, amount1);
        }
    }

    ///@notice function that makes the contract accespst native transfers
    receive() external payable {}

    fallback() external payable {}
}
