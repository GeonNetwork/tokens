/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

const GEONTokenV1 = artifacts.require("GEONTokenV1")
const GEONTokenV2 = artifacts.require("GEONTokenV2")

contract("GEONTokenV2", function(accounts) {
  const owner = accounts[0]
  const investor1 = accounts[1]
  const investor2 = accounts[2]

  let token1
  beforeEach(async function() {
    token1 = await GEONTokenV1.new()
    await token1.addMinter(owner)
    await token1.mint(investor1, 1000)
    await token1.finishMinting()
  })

  let token2
  beforeEach(async function() {
    await token1.pause()
    token2 = await GEONTokenV2.new(token1.address)
  })

  it("should add total supply from last version", async function() {
    const totalSupply = await token2.totalSupply()
    assert.equal(totalSupply, 1000)
  })

  it("should add balance from last version", async function() {
    const balance = await token2.balanceOf(investor1)
    assert.equal(balance, 1000)
  })

  it("should allow transfer", async function() {
    await token2.transfer(investor2, 1000, { from: investor1 })
    const balance1 = await token2.balanceOf(investor1)
    assert.equal(balance1, 0)
    const balance2 = await token2.balanceOf(investor2)
    assert.equal(balance2, 1000)
  })

  it("should allow approve and transfer from", async function() {
    await token2.approve(investor2, 1000, { from: investor1 })
    await token2.transferFrom(investor1, investor2, 1000, { from: investor2 })
    const balance1 = await token2.balanceOf(investor1)
    assert.equal(balance1, 0)
    const balance2 = await token2.balanceOf(investor2)
    assert.equal(balance2, 1000)
  })
})
