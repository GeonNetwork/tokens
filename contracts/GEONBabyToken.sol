/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Claimable {
	function claim(address to, uint256 amount) public;
}

contract GEONBabyToken is StandardToken, Ownable, RBACMintableToken, PausableToken, BurnableToken {
	using SafeMath for uint256;

	string public symbol = "GEON-BABY";
	string public name = "GEON Baby Token";
	uint8 public decimals = 18;

	Claimable private newToken;
	bool public redeemable = false;
	uint public start;
	mapping(address => uint256) redemptions;
	uint public totalRedemptions;

	// Contract starts paused to prevent trading.
	constructor() public {
		pause();
	}

	// Start redemptions for the public token.
	function startRedemptions(Claimable token) public onlyOwner whenPaused returns (bool) {
		require(token != address(0));
		require(!redeemable);
		newToken = token;
		start = now;
		redeemable = true;
		return true;
	}

	// Redeem claims to receive final public tokens.
	function redeem(uint256 amount) public whenPaused returns (bool) {
		require(redeemable);
		require(amount <= redeemableBalanceOf(msg.sender));
		burn(amount);
		redemptions[msg.sender] = redemptions[msg.sender].add(amount);
		totalRedemptions = totalRedemptions.add(amount);
		newToken.claim(msg.sender, amount);
		return true;
	}

	// Total redemptions of buyer address.
	function redemptionOf(address buyer) public view returns (uint256) {
		return redemptions[buyer];
	}

	// Calculate the redeemable balance as the min of balance or limit. 
	function redeemableBalanceOf(address buyer) public view returns (uint) {
		uint balance = balanceOf(buyer);
		uint limit = redeemableLimitOf(buyer).sub(redemptionOf(buyer));
		if (balance > limit) {
			return limit;
		}
		return balance;
	}

	// Calculate the redemption limit relative to the total historical balance.
	function redeemableLimitOf(address buyer) public view returns (uint) {
		if (!redeemable) {
			return 0;
		}
		uint totalBalance = balanceOf(buyer).add(redemptionOf(buyer));
		uint q4 = 360 days;
		if (now >= start + q4) {
			return totalBalance;
		}
		uint q3 = 270 days;
		if (now >= start + q3) {
			return totalBalance.mul(80).div(100);
		}
		uint q2 = 180 days;
		if (now >= start + q2) {
			return totalBalance.mul(60).div(100);
		}
		uint q1 = 90 days;
		if (now >= start + q1) {
			return totalBalance.mul(40).div(100);
		}
		return totalBalance.mul(20).div(100);
	}

	// The owner can destroy the contract 1 year after full vesting.
	function destroy() public onlyOwner {
		require(redeemable);
		require(now >= start + 2 years);
		selfdestruct(owner);
	}
}
