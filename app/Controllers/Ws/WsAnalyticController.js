'use strict'

class WsAnalyticController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }
}

module.exports = WsAnalyticController
