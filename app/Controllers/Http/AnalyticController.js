'use strict'

const BinanceB = require('binance-api-node').default
const client = BinanceB({
    apiKey: 'oGsNh0qQriS2co5nIeOY2Tt1ecTAJWPQpa6VfHHvyab4ZrMzRIRIBXpdjkACs3cG',
    apiSecret: '3icT1xvrJW32kSLCbmhARIfOADdYVnP9ONQm8TYMY6zu2fXJRoZMQLXmFrNSUXCV',
    getTime: () => Date.now(),
})
// var buy_order = []
const moment = use('moment')
const Order = use('App/Models/Order')
const SupertrendBtc = use('App/Models/SupertrendBtc')
const SupertrendBnb = use('App/Models/SupertrendBnb')
const Database = use('Database')
const Mail = use('Mail');
const Stock = require("stock-technical-indicators")
const Indicator = Stock.Indicator
const { Supertrend } = require("stock-technical-indicators/study/Supertrend")

var MACD = require('technicalindicators').MACD;

class AnalyticController {
    async testConnection({ request, view, response, auth }) {
        // const msg = await client.ping()
        // console.log("msg", msg)
        // const symbol = await client.accountInfo()
        // var data = []
        // for (let i = 0; i < symbol.balances.length; i++) {
        //     if (symbol.balances[i].free > 0) {
        //         data.push(symbol.balances[i])
        //     }
        // }
        // // console.log(symbol.balances.asset)
        // console.log(data)

        // return response.json({ msg: msg})

        const gain_btc = await Database.from('supertrend_btcs').sum('gain as gain')
        const gain_bnb = await Database.from('supertrend_bnbs').sum('gain as gain')
        const data2 = JSON.stringify(data)
        console.log(data[0].gain)


    }
    async accountInfo({ request, view, response, auth }) {
        // const msg = await client.ping()
        // console.log("msg", msg)
        const symbol = await client.accountInfo()
        var balance = []
        for (let i = 0; i < symbol.balances.length; i++) {
            if (symbol.balances[i].free > 0) {
                balance.push(symbol.balances[i])
            }
        }
        let bnb_obj = await SupertrendBnb.all()
        let btc_obj = await SupertrendBtc.all()
        // console.log(bnb_obj[0])
        let bnb = bnb_obj.toJSON()
        let btc = btc_obj.toJSON()
        // console.log(btc)

        // const btc = btc_obj[0]

        const gain_btc = await Database.from('supertrend_btcs').sum('gain as gain')
        const gain_bnb = await Database.from('supertrend_bnbs').sum('gain as gain')

        const total_gain = gain_btc[0].gain + gain_bnb[0].gain
        const stake = 126.3
        const stake_galih = 59.1
        const stake_hansu = 67.2
        const persentase_gain = (total_gain / stake) * 100
        const gain_galih = ((stake_galih / stake) * 100) * total_gain
        const gain_hansu = ((stake_hansu / stake) * 100) * total_gain

        return view.render('account_info', { balance, btc, bnb, stake, total_gain, stake_galih, stake_hansu, persentase_gain, gain_galih, gain_hansu })

    }

    // STRATEGY USING MA ONLY
    async buyOld({ request, view, response, auth }) {
        //new algo

        //check data in database, if no data go to buy conditions
        const ob = await Database.table('orders').where('status', 'OPEN')
        //end of check data in database, if no data go to buy conditions

        //sending params to binance server
        var symbol = 'BTCUSDT'
        var side = 'BUY'
        var btc_amt = 0.0003
        var type = 'MARKET'
        //end of sending params to binance server

        //request and calc current 55 ma
        async function getNewMA() {
            const price_history = await client.candles({ symbol: 'BTCUSDT', interval: '5m', limit: '57' })

            //b section newer
            let close_price_history = []
            for (let i = 1; i < 56; i++) {
                close_price_history.push(parseFloat(price_history[i].close))
            }
            close_price_history.reverse()

            let limalima_avg = 0
            let limalima_sum = 0
            for (let i = 0; i < 55; i++) {
                limalima_sum += close_price_history[i]
            }
            limalima_avg = limalima_sum / 55

            let ma_55 = limalima_avg
            const get_new_ma = { "ma_55": ma_55, "close_price_history": close_price_history }
            return get_new_ma
        }
        //end of request and calc current 55 ma

        //trading algo
        if (ob.length === 0) {
            var price_history = await getNewMA()
            var { ma_55, close_price_history } = price_history
            var status = 'IDLE'
            if (close_price_history[0] > ma_55 && close_price_history[1] < ma_55) {
                const close_trade_percentage = ma_55 * 1 / 100
                const ma_55_tp = ma_55 + close_trade_percentage
                const ma_55_sl = ma_55 - close_trade_percentage
                const buy_again_percentage = ma_55 * 0.5 / 100
                const ma_55_down_half_percent = ma_55 - buy_again_percentage

                try {
                    console.log("i'm called before buy")
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    const buy = await client.order({
                        symbol: symbol,
                        side: side,
                        quantity: String(btc_amt),
                        type: type
                    })
                    console.log("i called after buy")
                    console.log('BUY', buy)
                    console.log('BUY qty', buy.cummulativeQuoteQty)

                    status = 'OPEN'
                    var order = await Order.create({ symbol, ma_55, ma_55_tp, ma_55_sl, ma_55_down_half_percent, btc_amt, status })

                } catch (error) {
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    console.log(error)
                }
            }
            if (status === "IDLE") {
                console.log("No Order")
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                return response.json({ msg: "No Order" })
            } else if (status === "OPEN") {
                console.log(order)
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                return response.json({ order })
            }
        } else if (ob.length === 1) {
            var price_history = await getNewMA()
            var { ma_55, close_price_history } = price_history
            var status = 'IDLE'
            if (close_price_history[0] > ma_55 && close_price_history[1] < ma_55 && ma_55 < ob[0].ma_55_down_half_percent) {
                const close_trade_percentage = ma_55 * 1 / 100
                const ma_55_tp = ma_55 + close_trade_percentage
                const ma_55_sl = ma_55 - close_trade_percentage
                const buy_again_percentage = ma_55 * 0.5 / 100
                const ma_55_down_half_percent = ma_55 - buy_again_percentage

                try {
                    console.log("i'm called before buy")
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    const buy = await client.order({
                        symbol: symbol,
                        side: side,
                        quantity: String(btc_amt),
                        type: type
                    })
                    console.log("i called after buy")
                    console.log('BUY', buy)
                    console.log('BUY qty', buy.cummulativeQuoteQty)

                    status = 'OPEN'
                    var order = await Order.create({ symbol, ma_55, ma_55_tp, ma_55_sl, ma_55_down_half_percent, btc_amt, status })

                    // await Mail.send('email_buy_order_notification', { buy, ma_55, ma_55_tp, ma_55_sl, ma_55_down_half_percent, btc_amt, status }, (message) => {
                    //     message.from('energen1995@gmail.com')
                    //     message.to('energen1995@gmail.com')
                    //     message.subject('Crypto Order Notification')
                    // })
                } catch (error) {
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    console.log(error)
                }
            }
            if (status === "IDLE") {
                console.log("No Order")
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                return response.json({ msg: "No Order" })
            } else if (status === "OPEN") {
                console.log(order)
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                return response.json({ order })
            }
        } else if (ob.length === 2) {
            const msg = "There is 2 open trade"
            console.log("msg", msg)
            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
            return response.json({ msg: msg })
        } else {
            const msg = "SYSTEM FAILURE, CHECK!!"
            console.log("msg : ", msg)
            return response.json({ msg: msg })
        }
        //end of trading algo
    }
    async sellOld({ request, view, response, auth }) {
        // PARAMS FOR BINANCE SELL REQUEST
        var symbol = 'BTCUSDT'
        var side = 'SELL'
        var type = 'MARKET'
        // END OF PARAMS FOR BINANCE SELL REQUEST

        // GET ALL DATA FROM DATABASE
        let order_obj = await Order.all()
        // END OF GET ALL DATA FROM DATABASE

        // CHANGE OBJECT FROM DATABASE TP JSON
        const order = order_obj.toJSON()
        // END OF CHANGE OBJECT FROM DATABASE TP JSON

        // TRADING ALGO
        if (order.length > 0) {
            //find newer moving average
            const price_history = await client.candles({ symbol: 'BTCUSDT', interval: '5m', limit: '57' })

            //b section newer
            var close_price_history = []
            for (var i = 1; i < 56; i++) {
                close_price_history.push(parseFloat(price_history[i].close))
            }
            close_price_history.reverse()

            var limalima_avg = 0
            var limalima_sum = 0
            for (var i = 0; i < 55; i++) {
                limalima_sum += close_price_history[i]
            }
            limalima_avg = limalima_sum / 55

            for (var i = 0; i < order.length; i++) {
                const { ma_55_tp, ma_55_sl, btc_amt, status } = order[i]
                if (status === 'OPEN') {
                    if (limalima_avg >= ma_55_tp || limalima_avg <= ma_55_sl) {
                        //sell btc sebesar btc amt i
                        try {
                            console.log('Im called before sell')
                            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                            const sell = await client.order({
                                symbol: symbol,
                                side: side,
                                quantity: String(btc_amt),
                                type: type
                            })
                            console.log('SELL', sell)
                            console.log('SELL qty', sell.cummulativeQuoteQty)
                            console.log('Im called after sell')
                            let stat = ''
                            // update status to close
                            if (limalima_avg >= ma_55_tp) {
                                const order_close = await Order.find(order[i].id)
                                order_close.status = 'CLOSE PROFIT'
                                await order_close.save()
                                stat = 'CLOSE PROFIT'
                                console.log(order_close)
                                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                                return response.json({ order_close })
                            } else if (limalima_avg <= ma_55_sl) {
                                const order_close = await Order.find(order[i].id)
                                order_close.status = 'CLOSE LOSS'
                                await order_close.save()
                                stat = 'CLOSE LOSS'
                                console.log(order_close)
                                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                                return response.json({ order_close })
                            }

                            // await Mail.send('email_sell_order_notification', { sell, stat }, (message) => {
                            //     message.from('energen1995@gmail.com')
                            //     message.to('energen1995@gmail.com')
                            //     message.subject('Crypto Order Notification')
                            // })

                        } catch (error) {
                            console.log(error)
                            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                        }
                    } else {
                        console.log('No Sell')
                        console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    }
                } else {
                    console.log('No Sell')
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                }
            }
        } else {
            console.log('No OPEN Order')
            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
        }
        // END OF TRADING ALGO
    }
    async getDetailOrder({ request, view, response, auth }) {
        const order = await client.getOrder({
            symbol: 'BTCUSDT',
            orderId: 5184851884,
            recvWindow: 50000
        })

        console.log(order.cummulativeQuoteQty)
        return response.json({ order })
    }
    async sendEmail({ request, view, response, auth }) {

        const symbol = 'BUY'
        const email = await Mail.send('email_test', { symbol }, (message) => {
            message.from('energen1995@gmail.com')
            message.to('energen1995@gmail.com')
            message.subject('Crypto Order Notification')
        })
        console.log(email)
    }

    // STRATEGY USING SUPERTREND AND MACD
    async buyBTC({ request, view, response, auth }) {
        // const ob = await Database.table('supertrend_btcs').where('status', 'OPEN')
        // return ob[0].status
        // const order_id = 1
        // const symbol = "BTCUSDT"
        // const usd_buy_amt = 18
        // const btc_amt = 0.00003
        // const status = "OPEN"

        // var supertrend_btc = await SupertrendBtc.create({order_id, symbol, usd_buy_amt, btc_amt, status })

        // return supertrend_btc

        const ob = await Database.table('supertrend_btcs').where('status', 'OPEN')

        //sending params to binance server
        var symbol = 'BTCUSDT'
        var side = 'BUY'
        var btc_amt = 0.0008
        var type = 'MARKET'
        //end of sending params to binance server

        if (ob.length === 0) {
            const price_history = await client.candles({ symbol: 'BTCUSDT', interval: '15m', limit: '50' })
            // price_history.reverse()
            var status = 'IDLE'

            var data_supertrend = []
            var data_macd = []
            for (let i = 1; i < 50; i++) {
                data_macd.push(parseFloat(price_history[i].close))
                data_supertrend.push([String(price_history[i].openTime), parseFloat(price_history[i].open), parseFloat(price_history[i].high), parseFloat(price_history[i].low), parseFloat(price_history[i].close), parseFloat(price_history[i].volume)])
            }

            // SUPERTREND CALCULATION
            const newStudyATR = new Indicator(new Supertrend());
            const res_supertrend = await newStudyATR.calculate(data_supertrend, { period: 7, multiplier: 2 })
            res_supertrend.reverse()

            // MACD CALCULATION
            var macdInput = {
                values: data_macd,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            }
            const res_macd = await MACD.calculate(macdInput)
            res_macd.reverse()

            // BUY CONDITION
            if (res_supertrend[0].Supertrend.Direction == 1
                && res_supertrend[1].Supertrend.Direction == -1
                && res_macd[0].histogram > 0) {

                try {
                    console.log("i'm called before buy BTC")
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    const buy = await client.order({
                        symbol: symbol,
                        side: side,
                        quantity: String(btc_amt),
                        type: type
                    })
                    console.log("i called after buy BTC")
                    console.log('BUY', buy)
                    console.log('BUY qty', buy.cummulativeQuoteQty)
                    const { orderId, cummulativeQuoteQty } = buy
                    const order_id = orderId
                    const usd_buy_amt = cummulativeQuoteQty
                    status = 'OPEN'
                    var supertrend_btc = await SupertrendBtc.create({ order_id, symbol, usd_buy_amt, btc_amt, status })
                    console.log(supertrend_btc)
                } catch (error) {
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    console.log(error)
                }
                console.log("ok")
            } else {
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                console.log("Not match the buy conditions BTC")
            }
        } else {
            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
            console.log("There is open orders BTC")
        }
    }
    async sellBTC({ request, view, response, auth }) {

        const ob = await Database.table('supertrend_btcs').where('status', 'OPEN')

        //sending params to binance server
        var symbol = 'BTCUSDT'
        var side = 'SELL'
        var btc_amt = 0.0008
        var type = 'MARKET'
        //end of sending params to binance server

        if (ob.length === 1) {
            const price_history = await client.candles({ symbol: 'BTCUSDT', interval: '15m', limit: '50' })
            // price_history.reverse()

            var data_supertrend = []
            var data_macd = []
            for (let i = 1; i < 50; i++) {
                data_macd.push(parseFloat(price_history[i].close))
                data_supertrend.push([String(price_history[i].openTime), parseFloat(price_history[i].open), parseFloat(price_history[i].high), parseFloat(price_history[i].low), parseFloat(price_history[i].close), parseFloat(price_history[i].volume)])
            }

            // SUPERTREND CALCULATION
            const newStudyATR = new Indicator(new Supertrend());
            const res_supertrend = await newStudyATR.calculate(data_supertrend, { period: 7, multiplier: 2 })
            res_supertrend.reverse()

            // MACD CALCULATION
            var macdInput = {
                values: data_macd,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            }
            const res_macd = await MACD.calculate(macdInput)
            res_macd.reverse()

            // SELL CONDITION
            if (res_supertrend[0].Supertrend.Direction == -1
                && res_supertrend[1].Supertrend.Direction == 1) {
                try {
                    console.log("i'm called before SELL BTC")
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    const sell = await client.order({
                        symbol: symbol,
                        side: side,
                        quantity: String(btc_amt),
                        type: type
                    })
                    console.log("i called after SELL BTC")
                    console.log('SELL', sell)
                    console.log('SELL qty', sell.cummulativeQuoteQty)
                    const { orderId, cummulativeQuoteQty } = sell
                    const order_id = orderId
                    const usd_sell_amt = cummulativeQuoteQty

                    const order = await SupertrendBtc.find(ob[0].id)
                    order.usd_sell_amt = usd_sell_amt
                    await order.save()

                    if (order.usd_buy_amt < usd_sell_amt) {
                        order.status = "CLOSE PROFIT"
                        const gain = usd_sell_amt - order.usd_buy_amt
                        order.gain = gain
                        await order.save()
                    } else if (order.usd_buy_amt > usd_sell_amt) {
                        order.status = "CLOSE LOSS"
                        const gain = usd_sell_amt - order.usd_buy_amt
                        order.gain = gain
                        await order.save()
                    }
                    console.log(order)
                } catch (error) {
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    console.log(error)
                }
                console.log("ok")
            } else {
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                console.log("Not match the sell conditions BTC")
            }
        } else {
            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
            console.log("There is no open orders BTC")
        }
    }
    async buyBNB({ request, view, response, auth }) {
        // const ob = await Database.table('supertrend_btcs').where('status', 'OPEN')
        // return ob[0].status
        // const order_id = 1
        // const symbol = "BTCUSDT"
        // const usd_buy_amt = 18
        // const btc_amt = 0.00003
        // const status = "OPEN"

        // var supertrend_btc = await SupertrendBtc.create({order_id, symbol, usd_buy_amt, btc_amt, status })

        // return supertrend_btc

        const ob = await Database.table('supertrend_bnbs').where('status', 'OPEN')

        //sending params to binance server
        var symbol = 'BNBUSDT'
        var side = 'BUY'
        var btc_amt = 0.1
        var type = 'MARKET'
        //end of sending params to binance server

        if (ob.length === 0) {
            const price_history = await client.candles({ symbol: 'BNBUSDT', interval: '15m', limit: '50' })
            // price_history.reverse()
            var status = 'IDLE'

            var data_supertrend = []
            var data_macd = []
            for (let i = 1; i < 50; i++) {
                data_macd.push(parseFloat(price_history[i].close))
                data_supertrend.push([String(price_history[i].openTime), parseFloat(price_history[i].open), parseFloat(price_history[i].high), parseFloat(price_history[i].low), parseFloat(price_history[i].close), parseFloat(price_history[i].volume)])
            }

            // SUPERTREND CALCULATION
            const newStudyATR = new Indicator(new Supertrend());
            const res_supertrend = await newStudyATR.calculate(data_supertrend, { period: 7, multiplier: 2 })
            res_supertrend.reverse()

            // MACD CALCULATION
            var macdInput = {
                values: data_macd,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            }
            const res_macd = await MACD.calculate(macdInput)
            res_macd.reverse()

            // BUY CONDITION
            if (res_supertrend[0].Supertrend.Direction == 1
                && res_supertrend[1].Supertrend.Direction == -1
                && res_macd[0].histogram > 0) {

                try {
                    console.log("i'm called before buy BNB")
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    const buy = await client.order({
                        symbol: symbol,
                        side: side,
                        quantity: String(btc_amt),
                        type: type
                    })
                    console.log("i called after buy BNB")
                    console.log('BUY', buy)
                    console.log('BUY qty', buy.cummulativeQuoteQty)
                    const { orderId, cummulativeQuoteQty } = buy
                    const order_id = orderId
                    const usd_buy_amt = cummulativeQuoteQty
                    status = 'OPEN'
                    var supertrend_btc = await SupertrendBnb.create({ order_id, symbol, usd_buy_amt, btc_amt, status })
                    console.log(supertrend_btc)
                } catch (error) {
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    console.log(error)
                }
                console.log("ok")
            } else {
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                console.log("Not match the buy conditions BNB")
            }
        } else {
            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
            console.log("There is open orders BNB")
        }
    }
    async sellBNB({ request, view, response, auth }) {

        const ob = await Database.table('supertrend_bnbs').where('status', 'OPEN')

        //sending params to binance server
        var symbol = 'BNBUSDT'
        var side = 'SELL'
        var btc_amt = 0.1
        var type = 'MARKET'
        //end of sending params to binance server

        if (ob.length === 1) {
            const price_history = await client.candles({ symbol: 'BNBUSDT', interval: '15m', limit: '50' })
            // price_history.reverse()

            var data_supertrend = []
            var data_macd = []
            for (let i = 1; i < 50; i++) {
                data_macd.push(parseFloat(price_history[i].close))
                data_supertrend.push([String(price_history[i].openTime), parseFloat(price_history[i].open), parseFloat(price_history[i].high), parseFloat(price_history[i].low), parseFloat(price_history[i].close), parseFloat(price_history[i].volume)])
            }

            // SUPERTREND CALCULATION
            const newStudyATR = new Indicator(new Supertrend());
            const res_supertrend = await newStudyATR.calculate(data_supertrend, { period: 7, multiplier: 2 })
            res_supertrend.reverse()

            // MACD CALCULATION
            var macdInput = {
                values: data_macd,
                fastPeriod: 12,
                slowPeriod: 26,
                signalPeriod: 9,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            }
            const res_macd = await MACD.calculate(macdInput)
            res_macd.reverse()

            // SELL CONDITION
            if (res_supertrend[0].Supertrend.Direction == -1
                && res_supertrend[1].Supertrend.Direction == 1) {
                try {
                    console.log("i'm called before SELL BNB")
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    const sell = await client.order({
                        symbol: symbol,
                        side: side,
                        quantity: String(btc_amt),
                        type: type
                    })
                    console.log("i called after SELL BNB")
                    console.log('SELL', sell)
                    console.log('SELL qty', sell.cummulativeQuoteQty)
                    const { orderId, cummulativeQuoteQty } = sell
                    const order_id = orderId
                    const usd_sell_amt = cummulativeQuoteQty

                    const order = await SupertrendBnb.find(ob[0].id)
                    order.usd_sell_amt = usd_sell_amt
                    await order.save()

                    if (order.usd_buy_amt < usd_sell_amt) {
                        order.status = "CLOSE PROFIT"
                        const gain = usd_sell_amt - order.usd_buy_amt
                        order.gain = gain
                        await order.save()
                    } else if (order.usd_buy_amt > usd_sell_amt) {
                        order.status = "CLOSE LOSS"
                        const gain = usd_sell_amt - order.usd_buy_amt
                        order.gain = gain
                        await order.save()
                    }
                    console.log(order)
                } catch (error) {
                    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                    console.log(error)
                }
                console.log("ok")
            } else {
                console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
                console.log("Not match the sell conditions BNB")
            }
        } else {
            console.log(moment().format('MMMM Do YYYY, h:mm:ss a'))
            console.log("There is no open orders BNB")
        }
    }


    // TESTING ONLY
    async analytic({ request, view, response, auth }) {
        const price_history = await client.candles({ symbol: 'BTCUSDT', interval: '1m', limit: '57' })
        //    const time = moment(price_history[1].openTime).format('MMMM Do YYYY, h:mm:ss a');

        //a section older
        var close_price_history_a = []
        for (var i = 0; i < 55; i++) {
            close_price_history_a.push(parseFloat(price_history[i].close))
        }
        close_price_history_a.reverse()
        var delapan_avg_a = 0
        var delapan_sum_a = 0
        for (var i = 0; i < 8; i++) {
            delapan_sum_a += close_price_history_a[i]
        }
        delapan_avg_a = delapan_sum_a / 8

        var limalima_avg_a = 0
        var limalima_sum_a = 0
        for (var i = 0; i < 55; i++) {
            limalima_sum_a += close_price_history_a[i]
        }
        limalima_avg_a = limalima_sum_a / 55

        //b section newer
        var close_price_history_b = []
        for (var i = 1; i < 56; i++) {
            close_price_history_b.push(parseFloat(price_history[i].close))
        }
        close_price_history_b.reverse()
        var delapan_avg_b = 0
        var delapan_sum_b = 0
        for (var i = 0; i < 8; i++) {
            delapan_sum_b += close_price_history_b[i]
        }
        delapan_avg_b = delapan_sum_b / 8

        var limalima_avg_b = 0
        var limalima_sum_b = 0
        for (var i = 0; i < 55; i++) {
            limalima_sum_b += close_price_history_b[i]
        }
        limalima_avg_b = limalima_sum_b / 55

        const ma_8_a = delapan_avg_a
        const ma_55_a = limalima_avg_a
        const ma_8_b = delapan_avg_b
        const ma_55_b = limalima_avg_b

        //ALGO OPEN TRADE
        var status = "NO TRADE"
        var buy_position = false

        if (buy_position == true) {
            status = "There is open trade"
        } else if (!buy_position == false && ma_55_b < ma_8_b && ma_55_a > ma_8_a) {
            buy_position = true
            status = "BUY NOW"
        }

        //ALGO CLOSE TRADE
        if (buy_position == true && ma_55_b > ma_8_b && ma_55_a < ma_8_a) {
            buy_position = false
            status = "CLOSE TRADE"
        }

        const acc_info = await client.accountInfo()
        const deposit_history = await client.depositHistory()
        // const all_book_ticker = await client.book({ symbol: 'BTCUSDT', limit: 5 })

        return response.json({
            status,
            buy_position,
            // all_book_ticker,
            ma_8_a,
            ma_55_a,
            ma_8_b,
            ma_55_b
        })


    }
    async buyTest({ request, view, response, auth }) {
        try {
            console.log("i'm called before buy")
            const buy = await client.order({
                symbol: 'BTCUSDT',
                side: 'BUY',
                quantity: '0.0000001',
                type: 'MARKET'
            })
            console.log("i'm called if success")
        } catch (error) {
            console.log(error)
        }

    }
    async sellTest({ request, view, response, auth }) {
        console.log(
            await client.order({
                symbol: 'BTCUSDT',
                side: 'SELL',
                quantity: '0.000001',
                type: 'MARKET'
            }),
        )
    }
    async supertrend({ request, view, response, auth }) {
        // [
        // '2018-09-05T00:00:00+0530', // Date In Iso Format
        // 741.2, // Open
        // 748.95,  // High
        // 733.95, // Low
        // 740.9, // Close
        // 771705 // Volume
        // ]

        const price_history = await client.candles({ symbol: 'BNBUSDT', interval: '5m', limit: '50' })
        // price_history.reverse()

        var data = []
        for (let i = 1; i < 50; i++) {
            data.push([String(price_history[i].openTime), parseFloat(price_history[i].open), parseFloat(price_history[i].high), parseFloat(price_history[i].low), parseFloat(price_history[i].close), parseFloat(price_history[i].volume)])
        }


        // return data
        const newStudyATR = new Indicator(new Supertrend());
        const hasil = await newStudyATR.calculate(data, { period: 7, multiplier: 2 })
        hasil.reverse()

        // console.log(hasil)
        for (let i = 1; i < hasil.length; i++) {
            console.log(hasil[i][1], hasil[i].Supertrend)
        }
    }
    async macd({ request, view, response, auth }) {

        const price_history = await client.candles({ symbol: 'BTCUSDT', interval: '5m', limit: '50' })
        // price_history.reverse()1

        var data = []
        for (let i = 1; i < 50; i++) {
            data.push(parseFloat(price_history[i].open))
        }

        var macdInput = {
            values: data,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false
        }

        console.log(MACD.calculate(macdInput))
    }
}

module.exports = AnalyticController
