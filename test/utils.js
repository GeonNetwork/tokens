/*
Copyright (C) Pegasus Fintech Inc. - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
Written by AJ Ostrow <aj.ostrow@pegasusfintech.com>
*/

const timeTravel = async function(seconds) {
  await web3.currentProvider.send({
    id: 0,
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [ seconds ],
  })
  await web3.currentProvider.send({
    id: 0,
    jsonrpc: '2.0',
    method: 'evm_mine',
  })
}

const captureError = async function(promise) {
  try {
    await promise
  } catch (error) {
    return error
  }
  assert.fail('Expected to throw error.')
}

const logWatch = function(event) {
  return new Promise(function(resolve, reject) {
    event.watch(function(error, log) {
      event.stopWatching()
      if (error) {
        reject(error)
      } else {
        resolve(log)
      }
    })
  })
}

module.exports = {
  timeTravel,
  captureError,
  logWatch,
}
