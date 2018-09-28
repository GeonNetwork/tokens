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

contract GEONToken is StandardToken, RBACMintableToken, PausableToken {
	string public symbol = "GEON";
	string public name = "GEON Token";
	uint8 public decimals = 18;

	function claim(address to, uint256 amount) public {
		require(transferFrom(owner, to, amount));
	}

	function recoverLost(ERC20 token, address loser) public onlyOwner {
	    token.transfer(loser, token.balanceOf(this));
	}
}
