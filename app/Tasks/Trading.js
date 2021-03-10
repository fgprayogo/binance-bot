'use strict'

const Task = use('Task')
const axios = use('axios')

class Trading extends Task {
  static get schedule () {
    return '0 0/1 * * * *'
  }

  async handle () {
    const buy = await axios.get('http://127.0.0.1:3333/buy')
    const sell = await axios.get('http://127.0.0.1:3333/sell')
    console.log(buy.data, sell.data)
  }
}

module.exports = Trading
