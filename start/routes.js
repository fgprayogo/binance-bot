'use strict'

const { RouteGroup } = require('@adonisjs/framework/src/Route/Manager')

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')


// TEST CONNECTION
Route.get('/', 'AnalyticController.testConnection')

// REAL TRADING
Route.get('/buy', 'AnalyticController.buy')
Route.get('/sell', 'AnalyticController.sell')

// TESTING ONLY
Route.get('/read', 'AnalyticController.read')
Route.get('/write', 'AnalyticController.write')
Route.get('/buy-test', 'AnalyticController.buyTest')
Route.get('/sell-test', 'AnalyticController.sellTest')

