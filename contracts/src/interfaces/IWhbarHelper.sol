// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWhbarHelper {
    /// @notice Safely unwrap whbar to msg.sender
    /// @dev This contract needs an allowance from msg.sender to transfer the whbar token
    /// @param wad The amount to unwrap
    function unwrapWhbar(uint wad) external;
}
