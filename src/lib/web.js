var express = require("express"),
  bodyParser = require('body-parser')

module.exports = function init(opts) {
  var app = express(),
    httpServer = require('http').Server(app),
    socketIo = require('socket.io')(httpServer)

  app.set('view engine', 'ejs')
  app.set('views', __dirname + '/views')
  app.use(express.static(__dirname + '/public'))
  app.use(express.static(opts.streamFolder))
  app.use(bodyParser.json())

  app.get('/', function(req, res) {
    res.render('index', opts.state.get())
  })

  app.post('/set', function(req, res) {
    res.end()
    opts.state.update(req.body)
    opts.onStateUpdate()
  })

  return {
    socketIo: socketIo,
    start: function (port, cb) {
      httpServer.listen(port, cb)
    }
  }
}
