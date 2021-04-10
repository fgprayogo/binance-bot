'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SupertrendBtc extends Model {
    static get table () {
        return 'supertrend_btcs'
      }
}

module.exports = SupertrendBtc
