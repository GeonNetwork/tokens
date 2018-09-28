/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

const GEONBabyToken = artifacts.require("GEONBabyToken");
const GEONToken = artifacts.require("GEONToken");
const { timeTravel, captureError } = require("./utils")

contract("GEONBabyToken", function(accounts) {
  const owner = accounts[0];
  const investor1 = accounts[1];
  const investor2 = accounts[2];

  let babyToken;

  beforeEach(async function() {
    babyToken = await GEONBabyToken.new();
    await babyToken.addMinter(owner);
  })

  it("should have 18 decimals", async function() {
    const decimals = await babyToken.decimals()
    assert.equal(decimals, 18)
  })

  it("should have the ability to mint tokens", async function() {
    await babyToken.mint(investor1, 5000)
    const balance = await babyToken.balanceOf(investor1);
    assert.equal(balance, 5000)
  })

  it("should start paused to prevent transfers", async function() {
    await babyToken.mint(investor1, 5000)
    await captureError(babyToken.transfer(investor2, 5000, { from: investor1 }))
  })

  it("should have the ability to un-pause trading", async function() {
    await babyToken.mint(investor1, 5000)
    await babyToken.unpause()
    await babyToken.transfer(investor2, 5000, { from: investor1 })
    await babyToken.approve(investor1, 5000, { from: investor2 })
    await babyToken.transferFrom(investor2, investor1, 5000, { from: investor1 })
  })

  it("should allow burning tokens", async function() {
    await babyToken.mint(investor1, 5000)
    await babyToken.burn(5000, { from: investor1 })
  })

  it("should allow setting a public token for redemptions", async function() {
    const pubToken = await GEONToken.new()
    let redeemable = await babyToken.redeemable()
    assert(!redeemable)
    await babyToken.startRedemptions(pubToken.address)
    redeemable = await babyToken.redeemable()
    assert(redeemable)
  })

  it("should allow redemptions", async function() {
    // Set up pre-sale token.
    await babyToken.mint(investor1, 10000)
    
    // Set up public-sale token.
    const pubToken = await GEONToken.new()
    await pubToken.addMinter(owner)
    await pubToken.mint(owner, 10000)
    await pubToken.approve(babyToken.address, 10000)
    await babyToken.startRedemptions(pubToken.address)

    // Wait a full year.
    const day = 60*60*24
    const year = day * 365
    await timeTravel(year + day)

    // Redeem full amount.
    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 10000)
    await babyToken.redeem(amount, { from: investor1 })
    
    const balance = await babyToken.balanceOf(investor1)
    assert.equal(balance, 0)
    
    const redeemableBalance = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(redeemableBalance, 0)
  })

  it("should prevent redeeming tokens above the max amount", async function() {
    // Set up pre-sale token.
    await babyToken.mint(investor1, 10000)
    
    // Set up public-sale token.
    const pubToken = await GEONToken.new()
    await pubToken.addMinter(owner)
    await pubToken.mint(owner, 10000)
    await pubToken.approve(babyToken.address, 10000)
    await babyToken.startRedemptions(pubToken.address)

    // Try to redeem too many at start.
    await captureError(babyToken.redeem(8000, { from: investor1 }))
  })

  it("should not have vested balance before starting redemptions", async function() {
    await babyToken.mint(investor1, 10000)
    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 0)
  })

  it("should vest 20% on the 1st day", async function() {
    await babyToken.mint(investor1, 10000)

    const pubToken = await GEONToken.new()
    await babyToken.startRedemptions(pubToken.address)
    
    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 2000)
  })

  it("should vest 40% after 90 days", async function() {
    await babyToken.mint(investor1, 10000)

    const pubToken = await GEONToken.new()
    await babyToken.startRedemptions(pubToken.address)
    
    const day = 60*60*24
    await timeTravel(91 * day)

    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 4000)
  })

  it("should vest 60% after 180 days", async function() {
    await babyToken.mint(investor1, 10000)

    const pubToken = await GEONToken.new()
    await babyToken.startRedemptions(pubToken.address)
    
    const day = 60*60*24
    await timeTravel(181 * day)

    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 6000)
  })

  it("should vest 80% after 270 days", async function() {
    await babyToken.mint(investor1, 10000)

    const pubToken = await GEONToken.new()
    await babyToken.startRedemptions(pubToken.address)
    
    const day = 60*60*24
    await timeTravel(271 * day)

    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 8000)
  })

  it("should vest 100% after 360 days", async function() {
    await babyToken.mint(investor1, 10000)

    const pubToken = await GEONToken.new()
    await babyToken.startRedemptions(pubToken.address)
    
    const day = 60*60*24
    await timeTravel(361 * day)

    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 10000)
  })

  it("should allow the owner to destroy the contract", async function() {
    await captureError(babyToken.destroy())
    const pubToken = await GEONToken.new()
    await babyToken.startRedemptions(pubToken.address)
    const day = 60*60*24
    const year = 365*day
    await timeTravel(2*year + day)
    await babyToken.destroy()
  })

  it("should prevent double redeeming", async function() {
    await babyToken.mint(investor1, 10000)

    const pubToken = await GEONToken.new()
    await pubToken.addMinter(owner)
    await pubToken.mint(owner, 10000)
    await pubToken.approve(babyToken.address, 10000)
    await babyToken.startRedemptions(pubToken.address)

    const amount = await babyToken.redeemableBalanceOf(investor1)
    assert.equal(amount, 2000)

    await babyToken.redeem(2000, { from: investor1 })
    await captureError(babyToken.redeem(1, { from: investor1 }))

    const day = 60*60*24
    await timeTravel(91 * day)
    await captureError(babyToken.redeem(2001, { from: investor1 }))

    await timeTravel(90 * day)
    await captureError(babyToken.redeem(4001, { from: investor1 }))
    await babyToken.redeem(2000, { from: investor1 })
    await captureError(babyToken.redeem(2001, { from: investor1 }))
  })
})
