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
import "./libraries/HbarConversion.sol";
import "./interfaces/IUniswapV3Factory.sol";

contract YielderaVault is
    ERC20,
    Ownable,
    ReentrancyGuard,
    IUniswapV3MintCallback
{
    using SafeERC20 for IERC20;
    using SafeCast for uint256;

    // Constants
    uint256 public constant PRECISION = 10 ** 18;
    uint256 constant PERCENT = 100;
    address constant NULL_ADDRESS = address(0);
    address constant WHBAR_ADDRESS =
        address(0x0000000000000000000000000000000000003aD2);
    address constant WHBAR_HELPER_ADDRESS =
        address(0x000000000000000000000000000000000050a8a7);
    address constant SAUCER_NFT_TOKEN =
        address(0x000000000000000000000000000000000013feE4);
    address constant SAUCER_FACTORY_ADDRESS =
        address(0x00000000000000000000000000000000001243eE);
    INonfungiblePositionManager constant NFPM =
        INonfungiblePositionManager(0x000000000000000000000000000000000013F618);
    ISwapRouter constant SWAP_ROUTER =
        ISwapRouter(0x0000000000000000000000000000000000159398);

    // Immutable state variables
    address public immutable pool;
    IUniswapV3Pool public immutable poolContract;
    address public immutable token0;
    address public immutable token1;
    uint24 public immutable fee;
    int24 public immutable tickSpacing;
    bool public immutable isToken0Native;
    bool public immutable isToken1Native;

    // State variables
    int24 public upperTick;
    int24 public lowerTick;
    bool public isActive;
    uint24 public performanceFee = 10;
    uint256 public vaultFees0 = 0;
    uint256 public vaultFees1 = 0;

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

    event CollectFees(address indexed sender, uint256 fees0, uint256 fees1);

    event AssociateToken(address indexed token);

    event CustomEvent(address indexed sender, string message);

    constructor(
        address _pool
    ) ERC20("Yieldera Vault Hbar", "YHbar") Ownable(msg.sender) {
        require(_pool != NULL_ADDRESS, "NULL_POOL");

        pool = _pool;
        poolContract = IUniswapV3Pool(_pool);

        token0 = poolContract.token0();
        token1 = poolContract.token1();
        fee = poolContract.fee();
        tickSpacing = poolContract.tickSpacing();

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

    /**
     @notice Calculates total quantity of token0 and token1 in the current position (and unused in the ICHIVault)
     @param total0 Quantity of token0 in current position (and unused in the ICHIVault)
     @param total1 Quantity of token1 in current position (and unused in the ICHIVault)
     */
    function getTotalAmounts()
        public
        view
        returns (uint256 total0, uint256 total1)
    {
        (, uint256 pos0, uint256 pos1) = getCurrentPosition();

        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        total0 = balance0 + pos0;
        total1 = balance1 + pos1;
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

        // Collect vault fees of current position
        _collectPositionFees();

        // Get the current spot price
        uint256 spotPrice = _fetchPoolSpotPrice(
            token0,
            token1,
            currentTick(),
            PRECISION
        );

        (uint256 pool0, uint256 pool1) = getTotalAmounts();

        // aggregated deposit
        uint256 deposit0PricedInToken1 = (deposit0 * spotPrice) / PRECISION;

        // shares = deposit1 + deposit0PricedInToken1
        shares = deposit1 + deposit0PricedInToken1;

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

        uint256 totalSupply = totalSupply();

        if (totalSupply != 0) {
            uint256 pool0PricedInToken1 = (pool0 * spotPrice) / PRECISION;
            shares = (shares * totalSupply) / (pool0PricedInToken1 + pool1);
        }

        // mint shares to the depositor
        _mint(to, shares);

        // Emit deposit event
        emit Deposit(msg.sender, to, shares, deposit0, deposit1);
    }

    /// @notice allow a user to withdraw its shares
    /// @param shares The amount of shares to withdraw
    /// @param to The address to receive the shares
    function withdraw(
        uint256 shares,
        address to
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(shares > 0, "ZERO_SHARES");
        require(to != NULL_ADDRESS, "NULL_TO");

        uint256 senderShareBalance = balanceOf(msg.sender);

        require(senderShareBalance >= shares, "INSUFF_SHARES_BAL");

        // Withdraw the user liquiidity shares friom the current position and burn them
        (uint256 pos0, uint256 pos1) = _burnLiquidity(
            lowerTick,
            upperTick,
            _liquidityForShares(lowerTick, upperTick, shares),
            to,
            false
        );

        // Push tokens proportional to unused balances
        uint256 _totalSupply = totalSupply();

        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        uint256 unused0 = (balance0 * shares) / _totalSupply;
        uint256 unused1 = (balance1 * shares) / _totalSupply;

        // Transfer unused tokens to the user
        if (unused0 > 0) {
            IERC20(token0).safeTransfer(to, unused0);
        }

        if (unused1 > 0) {
            IERC20(token1).safeTransfer(to, unused1);
        }

        amount0 = unused0 + pos0;
        amount1 = unused1 + pos1;

        // Burn the shares from the total supply
        _burn(msg.sender, shares);

        emit Withdraw(msg.sender, to, shares, amount0, amount1);
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
    )
        external
        payable
        onlyOwner
        nonReentrant
        returns (uint256 amount0, uint256 amount1, uint128 liquidity)
    {
        // Withdraw all liquidity if there is a position
        if (isActive) {
            burnAllLiquidity();
        }

        // Check if the swap is needed
        if (desiredSwapOutAmount > 0) {
            // Swap using the swap router contract
            if (isSwap0To1) {
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
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        // Add the new liquidity with the new balances
        liquidity = _liquidityForAmounts(
            newLowerTick,
            newUpperTick,
            balance0,
            balance1
        );

        (amount0, amount1) = _mintLiquidity(
            newLowerTick,
            newUpperTick,
            liquidity
        );

        // Refund any extra hbar sent
        NFPM.refundETH();

        // Update the lower and upper ticks of the vault
        lowerTick = newLowerTick;
        upperTick = newUpperTick;
        isActive = true;

        emit MintLiquidity(msg.sender, 0, liquidity, amount0, amount1);
    }

    /// @notice Mint a new Liquidity to the pool
    /// @param amount0Max The maximum amount of token0 to deposit
    /// @param amount1Max The maximum amount of token1 to deposit
    /// @param tickLower The lower tick of the range
    /// @param tickUpper The upper tick of the range
    function mintLiquidity(
        uint256 amount0Max,
        uint256 amount1Max,
        int24 tickLower,
        int24 tickUpper
    )
        external
        payable
        onlyOwner
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        // Ensure vault has enough balance to execute this mint
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));

        require(balance0 >= amount0Max, "INSUFF_TOKEN0_BAL");
        require(balance1 >= amount1Max, "INSUFF_TOKEN1_BAL");

        liquidity = _liquidityForAmounts(
            tickLower,
            tickUpper,
            amount0Max,
            amount1Max
        );

        (amount0, amount1) = _mintLiquidity(tickLower, tickUpper, liquidity);

        // Refund any extra hbar sent
        NFPM.refundETH();

        // Update the lower and upper ticks of the vault
        lowerTick = tickLower;
        upperTick = tickUpper;
        isActive = true;

        emit MintLiquidity(msg.sender, 0, liquidity, amount0, amount1);
    }

    /// @notice Burn all the liquidity from the pool
    function burnAllLiquidity()
        public
        onlyOwner
        returns (uint256 amount0, uint256 amount1)
    {
        require(upperTick != 0 && lowerTick != 0, "NO_LIQUIDITY");

        (uint128 liquidity, , ) = _position(lowerTick, upperTick);

        _burnLiquidity(lowerTick, upperTick, liquidity, address(this), true);

        // Update the lower and upper ticks of the vault to 0
        lowerTick = 0;
        upperTick = 0;
        isActive = false;

        emit BurnAllLiquidity(msg.sender, amount0, amount1);
    }

    /// @notice allow the owner to withdraw Native Coin from the vault
    /// @param amount The amount to withdraw
    /// @param to The address to receive the tokens
    function withdrawNative(uint256 amount, address to) external onlyOwner {
        require(to != NULL_ADDRESS, "NULL_TO");

        // withdraw native token
        if (amount > 0) {
            uint256 balance = address(this).balance;
            require(balance >= amount, "WITHDRAW_NATIVE: INSUFF_BAL");
            TransferHelper.safeTransferHBAR(to, amount);
        }
    }

    /**
     * @dev Allows the owner to transfer out any tokens from the contract except
     * for the vault tokens i.e. token0 and token1.
     *
     * This function is intended to be used for retrieving tokens mistakenly sent to
     * the contract or for managing other tokens(i.e. rewards) held by the contract.
     *
     * Requirements:
     * - Only the contract owner can call this function.
     * - The 'token' parameter must not be equal to 'token0' or 'token1'.
     *
     * @param token The address of the ERC20 token to be swept.
     * @param to The address where the tokens should be transferred.
     */
    function sweep(address token, address to) external onlyOwner {
        // Do not allow sweeping of either vault token
        require(token != token0 && token != token1, "SWEEP: VT_NOT_ALLOWED");
        uint256 amount = IERC20(token).balanceOf(address(this));

        if (amount > 0) {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /// @notice Set a new peroformence fee
    /// @param _performanceFee The new performance fee
    function setPerformanceFee(uint24 _performanceFee) external onlyOwner {
        performanceFee = _performanceFee;
    }

    /*////////////////////////////////////////////////// 
                    Fetchers 
    ///////////////////////////////////////////////////
    */

    /**
     @notice Calculates amount of total liquidity in the base position
     @param liquidity Amount of total liquidity in the base position
     @param amount0 Estimated amount of token0 that could be collected by burning the base position
     @param amount1 Estimated amount of token1 that could be collected by burning the base position
     */
    function getCurrentPosition()
        public
        view
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        (
            uint128 positionLiquidity,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        ) = _position(lowerTick, upperTick);
        (amount0, amount1) = _amountsForLiquidity(
            lowerTick,
            upperTick,
            positionLiquidity
        );
        liquidity = positionLiquidity;
        amount0 = amount0 + uint256(tokensOwed0);
        amount1 = amount1 + uint256(tokensOwed1);
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

    /// @notice Update vault fees by collecting fees of the positions
    function _collectPositionFees() internal returns (uint128 liquidity) {
        // Get current position
        (liquidity, , ) = _position(lowerTick, upperTick);
        // Check if there is any liquidity in the position.
        // If so, call burn with amount = 0 to realize and update uncollected fees.
        // This does NOT remove any liquidity, but updates fee growth for the position
        // so that the correct amount can be collected via `collect()`.
        if (liquidity > 0) {
            poolContract.burn(lowerTick, upperTick, 0);
            // Collect fees owed of the position
            (uint256 owed0, uint256 owed1) = poolContract.collect(
                address(this),
                lowerTick,
                upperTick,
                type(uint128).max,
                type(uint128).max
            );

            // Update vault fees
            vaultFees0 += owed0;
            vaultFees1 += owed1;
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

    /**
     @notice uint128Safe function
     @param x input value
     */
    function _uint128Safe(uint256 x) internal pure returns (uint128) {
        require(x <= type(uint128).max, "IV.128_OF");
        return uint128(x);
    }

    /**
     @notice Mint liquidity in Uniswap V3 pool.
     @param tickLower The lower tick of the liquidity position
     @param tickUpper The upper tick of the liquidity position
     @param liquidity Amount of liquidity to mint
     @param amount0 Used amount of token0
     @param amount1 Used amount of token1
     */
    function _mintLiquidity(
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    ) internal returns (uint256 amount0, uint256 amount1) {
        // Ensure ticks are valid
        require(
            tickLower % tickSpacing == 0 && tickUpper % tickSpacing == 0,
            "TICK_NO_MUL_OF_SPAC"
        );

        uint256 mintFee = IUniswapV3Factory(SAUCER_FACTORY_ADDRESS).mintFee();
        uint256 hbarMintFee;

        if (mintFee > 0) {
            hbarMintFee = HbarConversion.tinycentsToTinybars(mintFee);

            // Slop for conversion rounding
            hbarMintFee += 1;
            require(address(this).balance >= hbarMintFee, "MF");
        }

        if (liquidity > 0) {
            (amount0, amount1) = IUniswapV3Pool(pool).mint{value: hbarMintFee}(
                address(this),
                tickLower,
                tickUpper,
                liquidity,
                abi.encode(address(this))
            );
        }
    }

    /**
     @notice Burn liquidity in a Uniswap V3 pool.
    @param tickLower Lower tick of the liquidity position.
    @param tickUpper Upper tick of the liquidity position.
    @param liquidity Amount of liquidity to burn.
    @param to Account to receive token0 and token1 amounts.
    @param collectAll Flag indicating if all token0 and token1 tokens should
                    be collected, or only those released during this burn.
    @param amount0 Released amount of token0.
    @param amount1 Released amount of token1.
    */
    function _burnLiquidity(
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        address to,
        bool collectAll
    ) internal returns (uint256 amount0, uint256 amount1) {
        if (liquidity > 0) {
            return
                _burnAnyLiquidity(
                    tickLower,
                    tickUpper,
                    liquidity,
                    to,
                    collectAll
                );
        }
    }

    /**
     @notice Burn liquidity in Uniswap V3 pool. If liquidity equals to zero, only collect fees
     @param tickLower The lower tick of the liquidity position
     @param tickUpper The upper tick of the liquidity position
     @param liquidity amount of liquidity to burn. Could be zero
     @param to The account to receive token0 and token1 amounts
     @param collectAll Flag that indicates whether all token0 and token1 tokens should be collected or only the ones released during this burn
     @return amount0 released amount of token0
     @return amount1 released amount of token1
     */
    function _burnAnyLiquidity(
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity,
        address to,
        bool collectAll
    ) internal returns (uint256 amount0, uint256 amount1) {
        // Burn liquidity
        (uint256 owed0, uint256 owed1) = IUniswapV3Pool(pool).burn(
            tickLower,
            tickUpper,
            liquidity
        );

        // Collect amount owed
        uint128 collect0 = collectAll ? type(uint128).max : _uint128Safe(owed0);
        uint128 collect1 = collectAll ? type(uint128).max : _uint128Safe(owed1);
        if (collect0 > 0 || collect1 > 0) {
            (amount0, amount1) = IUniswapV3Pool(pool).collect(
                to,
                tickLower,
                tickUpper,
                collect0,
                collect1
            );
        }
    }

    /**
     @notice Calculates liquidity amount for the given shares.
     @param tickLower The lower tick of the liquidity position
     @param tickUpper The upper tick of the liquidity position
     @param shares number of shares
     */
    function _liquidityForShares(
        int24 tickLower,
        int24 tickUpper,
        uint256 shares
    ) internal view returns (uint128) {
        (uint128 position, , ) = _position(tickLower, tickUpper);
        return _uint128Safe((uint256(position) * shares) / totalSupply());
    }

    /**
     @notice Calculates token0 and token1 amounts for liquidity in a position
     @param tickLower The lower tick of the liquidity position
     @param tickUpper The upper tick of the liquidity position
     @param liquidity Amount of liquidity in the position
     */
    function _amountsForLiquidity(
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    ) internal view returns (uint256, uint256) {
        (uint160 sqrtRatioX96, , , , , , ) = IUniswapV3Pool(pool).slot0();
        return
            UV3Math.getAmountsForLiquidity(
                sqrtRatioX96,
                UV3Math.getSqrtRatioAtTick(tickLower),
                UV3Math.getSqrtRatioAtTick(tickUpper),
                liquidity
            );
    }

    /**
     @notice Returns information about the liquidity position.
     @param tickLower The lower tick of the liquidity position
     @param tickUpper The upper tick of the liquidity position
     @param liquidity liquidity amount
     @param tokensOwed0 amount of token0 owed to the owner of the position
     @param tokensOwed1 amount of token1 owed to the owner of the position
     */
    function _position(
        int24 tickLower,
        int24 tickUpper
    )
        internal
        view
        returns (uint128 liquidity, uint128 tokensOwed0, uint128 tokensOwed1)
    {
        bytes32 positionKey = keccak256(
            abi.encodePacked(address(this), tickLower, tickUpper)
        );
        (liquidity, , , tokensOwed0, tokensOwed1) = IUniswapV3Pool(pool)
            .positions(positionKey);
    }

    ///@notice function that makes the contract accespst native transfers
    receive() external payable {}

    fallback() external payable {}
}
