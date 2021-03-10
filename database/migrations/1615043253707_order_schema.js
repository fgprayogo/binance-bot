'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OrderSchema extends Schema {
  up () {
    this.create('orders', (table) => {
      table.increments()
      table.string('symbol')
      table.double('ma_55')
      table.double('ma_55_tp')
      table.double('ma_55_sl')
      table.double('ma_55_down_half_percent')
      table.double('btc_amt')
      table.string('status')
      table.timestamps()
    })
  }

  down () {
    this.drop('orders')
  }
}

module.exports = OrderSchema
