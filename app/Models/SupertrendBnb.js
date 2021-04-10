'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SupertrendBnb extends Model {
    static get table () {
        return 'supertrend_bnbs'
      }
}

module.exports = SupertrendBnb
