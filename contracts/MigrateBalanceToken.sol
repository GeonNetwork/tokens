/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract MigrateBalanceToken is StandardToken {
	event Upgrade(address indexed to, uint256 amount);

	ERC20 private lastVersion;
	mapping(address => bool) private migratedBalances;

	constructor(ERC20 token) public {
		require(address(token) != address(0));
		lastVersion = token;

		// Mint the last version supply. 
		uint256 lastVersionSupply = lastVersion.totalSupply();
		totalSupply_ = totalSupply_.add(lastVersionSupply);
		balances[lastVersion] = lastVersionSupply;
		emit Transfer(address(0), lastVersion, lastVersionSupply);
	}

	function migrated(address account) public view returns (bool) {
		return migratedBalances[account];
	}

	function migrate(address account) public returns (bool) {
		require(account != address(0));
		if (!migrated(account)) {
			migratedBalances[account] = true;
			uint256 lastBalance = lastVersion.balanceOf(account);
			balances[lastVersion] = balances[lastVersion].sub(lastBalance);
			balances[account] = balances[account].add(lastBalance);
			emit Upgrade(account, lastBalance);
			emit Transfer(lastVersion, account, lastBalance);
			return true;
		}
		return false;
	}

	function batchMigrate(address[] accounts) public {
		for (uint i = 0; i < accounts.length; i++) {
			migrate(accounts[i]);
		}
	}

	function balanceOf(address account) public view returns (uint256) {
		if (!migrated(account)) {
			return lastVersion.balanceOf(account).add(balances[account]);
		}
		return balances[account];
	}

	function transfer(address to, uint256 amount) public returns (bool) {
		migrate(msg.sender);
		super.transfer(to, amount);
	}

	function approve(address spender, uint256 tokens) public returns (bool) {
		migrate(msg.sender);
		return super.approve(spender, tokens);
	}
}
