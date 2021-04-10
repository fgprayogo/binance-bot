'use strict'

const Task = use('Task')
const axios = use('axios')

class Trading extends Task {
  static get schedule () {
    return '0 0/1 * * * *'
  }

  async handle () {
    const buyBTC = await axios.get('http://127.0.0.1:3333/buyBTC')
    const sellBTC = await axios.get('http://127.0.0.1:3333/sellBTC')
    const buyBNB = await axios.get('http://127.0.0.1:3333/buyBNB')
    const sellBNB = await axios.get('http://127.0.0.1:3333/sellBNB')
    
    console.log(buyBTC.data, sellBTC.data, buyBNB.data, sellBNB.data)
  }
}

module.exports = Trading
