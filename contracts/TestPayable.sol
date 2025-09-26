// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract TestPayable {
    event ValueReceived(uint256 value, address sender);
    event MinimumCheck(uint256 value, uint256 minimum, bool result);

    uint256 public constant MINIMUM = 0.01 ether;
    uint256 public lastValue;
    address public lastSender;

    function testPayable() external payable {
        lastValue = msg.value;
        lastSender = msg.sender;

        emit ValueReceived(msg.value, msg.sender);
        emit MinimumCheck(msg.value, MINIMUM, msg.value >= MINIMUM);

        // Remove require to see what msg.value actually is
        // require(msg.value >= MINIMUM, "Value too low");

        // If we get here, everything worked
    }

    function getLastValue() external view returns (uint256, address) {
        return (lastValue, lastSender);
    }

    receive() external payable {
        lastValue = msg.value;
        lastSender = msg.sender;
        emit ValueReceived(msg.value, msg.sender);
    }
}