/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

const GEONToken = artifacts.require("GEONToken")
const { captureError } = require("./utils")

contract("GEONToken", function(accounts) {
  const owner = accounts[0]
  const investor1 = accounts[1]

  let token
  beforeEach(async function() {
    token = await GEONToken.new()
    await token.addMinter(owner)
  })

  it("should have GEON symbol", async function() {
    const symbol = await token.symbol()
    assert.equal(symbol, "GEON")
  })

  it("should have 18 decimals", async function() {
    const decimals = await token.decimals()
    assert.equal(decimals, 18)
  })

  it("should have the ability to mint tokens", async function() {
    await token.mint(owner, 5000)
    const balance = await token.balanceOf(owner)
    assert.equal(balance, 5000)
  })

  it("should pause", async function() {
    await token.pause()
    const paused = await token.paused()
    assert(paused)
  })

  it("should prevent transfers when paused", async function() {
    await token.mint(owner, 1000)
    await token.pause()
    await captureError(token.transfer(investor1, 1000))
  })

  it("should hard cap supply at 850 million", async function() {
    await token.mint(owner, 850 * 1e6 * 1e18);
    await captureError(token.mint(owner, 1));
  })
})
