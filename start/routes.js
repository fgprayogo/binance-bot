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
Route.get('/', 'AnalyticController.accountInfo')
Route.get('/test', 'AnalyticController.testConnection')

// REAL TRADING
Route.get('/buyBTC', 'AnalyticController.buyBTC')
Route.get('/sellBTC', 'AnalyticController.sellBTC')
Route.get('/buyBNB', 'AnalyticController.buyBNB')
Route.get('/sellBNB', 'AnalyticController.sellBNB')

// GET DETAIL ORDER
Route.get('/detail-order', 'AnalyticController.getDetailOrder')

// TESTING ONLY
Route.get('/read', 'AnalyticController.read')
Route.get('/write', 'AnalyticController.write')
Route.get('/buy-test', 'AnalyticController.buyTest')
Route.get('/sell-test', 'AnalyticController.sellTest')

// TEST SEND EMAIL
Route.get('/email', 'AnalyticController.sendEmail')

// TEST SUPERTREND

Route.get('/supertrend', 'AnalyticController.supertrend')
Route.get('/macd', 'AnalyticController.macd')


