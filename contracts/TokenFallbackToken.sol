/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import './ERC223ReceivingContract.sol';

contract TokenFallbackToken is StandardToken, ERC223ReceivingContract {
	event Upgrade(address indexed to, uint256 amount);

	BurnableToken private lastVersion;

	constructor(BurnableToken token) public {
		require(address(token) != address(0));
		lastVersion = token;
	}

	function tokenFallback(address from, uint256 amount, bytes extra) external {
		require(msg.sender == address(lastVersion));
		extra; // ignore compiler warnings
		balances[from] = balances[from].add(amount);
		totalSupply_ = totalSupply_.add(amount);
		emit Upgrade(from, amount);
		emit Transfer(address(0), from, amount);
		lastVersion.burn(amount);
	}
}
