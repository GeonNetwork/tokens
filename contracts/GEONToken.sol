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
import 'openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'openzeppelin-solidity/contracts/ownership/HasNoEther.sol';
import 'openzeppelin-solidity/contracts/ownership/HasNoTokens.sol';
import 'openzeppelin-solidity/contracts/ownership/CanReclaimToken.sol';
import './ERC223ReceivingContract.sol';

contract GEONToken is StandardToken, RBACMintableToken, PausableToken, BurnableToken, CanReclaimToken {
	uint256 public constant MAX_SUPPLY = 850000000 * 1e18;

	string public symbol = "GEON";
	string public name = "GEON Token";
	uint8 public decimals = 18;
	uint8 public version = 1;

	function claim(address to, uint256 amount) public {
		require(transferFrom(owner, to, amount));
	}

	// Override Mintable to limit supply. 
	function mint(address to, uint256 amount) public returns (bool) {
		require(totalSupply() + amount <= MAX_SUPPLY);
		return super.mint(to, amount);
	}

	// ERC223 transfer for tokenFallback upgrade.  
	function transfer(address to, uint256 amount) public returns (bool) {
		bool success = super.transfer(to, amount);
		if (success) {
			callTokenFallback(to, amount);
		}
		return success;
	}

	// ERC223 transferFrom for tokenFallback upgrade. 
	function transferFrom(address from, address to, uint256 amount) public returns (bool) {
		bool success = super.transferFrom(from, to, amount);
		if (success) {
			callTokenFallback(to, amount);
		}
		return success;
	}

	// ERC223 helper method. 
	function callTokenFallback(address to, uint256 amount) internal {
		uint codeLength;
		assembly {
			codeLength := extcodesize(to)
		}
		if (codeLength > 0) {
			bytes memory empty;
			ERC223ReceivingContract receiver = ERC223ReceivingContract(to);
			receiver.tokenFallback(msg.sender, amount, empty);
		}
	}
}
