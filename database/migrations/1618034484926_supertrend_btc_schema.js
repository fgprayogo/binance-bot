'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SupertrendBtcSchema extends Schema {
  up () {
    this.create('supertrend_btcs', (table) => {
      table.increments()
      table.double('order_id')
      table.string('symbol')
      table.double('btc_amt')
      table.double('usd_buy_amt')
      table.double('usd_sell_amt')
      table.double('gain')
      table.string('status')
      table.timestamps()
    })
  }

  down () {
    this.drop('supertrend_btcs')
  }
}

module.exports = SupertrendBtcSchema
