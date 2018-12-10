/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

const GEONToken = artifacts.require("GEONToken")
const TokenFallbackToken = artifacts.require("TokenFallbackToken")
const { captureError } = require("./utils")

contract("TokenFallbackToken", function(accounts) {
  const owner = accounts[0]
  const investor1 = accounts[1]
  const investor2 = accounts[2]

  let token1
  beforeEach(async function() {
    token1 = await GEONToken.new()
    await token1.addMinter(owner)
    await token1.mint(investor1, 1000)
    await token1.finishMinting()
  })

  let token2
  beforeEach(async function() {
    token2 = await TokenFallbackToken.new(token1.address)
  })

  it("should prevent token fallback from random accounts", async function() {
    await captureError(token2.tokenFallback(investor2, 1000, 0x0, { from: investor2 }))
  })

  it("should allow erc223 transfers", async function() {
    const upgraded = await token1.transfer(token2.address, 1000, { from: investor1 })
    assert(upgraded)
  })

  it("should revert erc223 transfers to non receivers", async function() {
    // Baby token does not implement ERC223 receiver. 
    const GEONBabyToken = artifacts.require("GEONBabyToken")
    const babyToken = await GEONBabyToken.new()  
    // So the transfer fails. 
    await captureError(token1.transfer(babyToken.address, 1000, { from: investor1 }))
    const balance = await token1.balanceOf(investor1)
    assert.equal(balance, 1000)
  })

  it("should prevent erc223 transfers that fail", async function() {
    await captureError(token1.transfer(token2.address, 2000, { from: investor1 }))
  })

  describe("after upgrade transfer", function() {
    beforeEach(async function() {
      await token1.transfer(token2.address, 1000, { from: investor1 })
    })

    it("should update balance on new token", async function() {
      const balance = await token2.balanceOf(investor1)
      assert.equal(balance, 1000)
    })

    it("should burn the transaction amount from old token", async function() {
      const tokenBalance = await token1.balanceOf(token2.address)
      assert.equal(tokenBalance, 0)
    })

    it("should decrease old token supply", async function() {
      const totalSupply = await token1.totalSupply()
      assert.equal(totalSupply, 0)
    })

    it("should increase new token supply", async function() {
      const totalSupply = await token2.totalSupply()
      assert.equal(totalSupply, 1000)
    })
  })
})
