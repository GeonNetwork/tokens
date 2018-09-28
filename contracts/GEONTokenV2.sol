/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/RBACMintableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './GEONTokenV1.sol';

contract GEONTokenV2 is StandardToken, RBACMintableToken, PausableToken {
	string public symbol = "GEON";
	string public name = "GEON Token";
	uint8 public decimals = 18;
	uint8 public version = 2;

	ERC20 private lastVersion;
	mapping(address => bool) private migratedBalances;
	uint256 private migratedSupply = 0;

	constructor(GEONTokenV1 token) public {
		require(address(token) != address(0));
		require(token.paused());
		require(token.mintingFinished());
		lastVersion = token;
	}

	function migrate() public {
		if (!migratedBalances[msg.sender]) {
			uint256 lastBalance = lastVersion.balanceOf(msg.sender);
			migratedBalances[msg.sender] = true;
			migratedSupply = migratedSupply.add(lastBalance);
			balances[msg.sender] = balances[msg.sender].add(lastBalance);
		}
	}

	function totalSupply() public view returns (uint256) {
		return super.totalSupply().add(lastVersion.totalSupply().sub(migratedSupply));
	}

	function balanceOf(address account) public view returns (uint256) {
		if (!migratedBalances[account]) {
			return lastVersion.balanceOf(account).add(balances[account]);
		}
		return balances[account];
	}

	function transfer(address to, uint256 amount) public returns (bool) {
		migrate();
		super.transfer(to, amount);
	}

	function approve(address spender, uint256 tokens) public returns (bool) {
		migrate();
		return super.approve(spender, tokens);
	}

	function recoverLost(ERC20 token, address loser) public onlyOwner {
	    token.transfer(loser, token.balanceOf(this));
	}
}
