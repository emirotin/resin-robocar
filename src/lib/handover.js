var express = require("express"),
  bodyParser = require('body-parser'),
  request = require('request')

funtion createServer(port, callback) {
  var app = express()
  app.use(bodyParser.json())
  var server = app.listen(port, function(err) {
    callback(err, app, server)
  })
}

function signalKillMe() {
  fs.open('/data/resin-kill-me', 'w', function(err, fd) {
    if (!err) fs.close(fd, function(err) {})
  })
}

function httpPost(port, data) {
  request.post('http://localhost:' + port, data)
}

module.exports = function handover(opts) {
  var masterPort = opts.masterPort
  var slavePort = opts.slavePort
  var run = opts.run
  var stop = opts.stop
  var getHandoverData = opts.getHandoverData

  function createMasterServer(callback) {
    createServer(masterPort, function(err, masterApp, server) {
      if (err) return callback(err)

      console.log("I'm the master!")

      // whenever on the master port we receive the notification do:
      //  * release master port
      //  * release resources
      //  * post to the slave
      //  * create the kill me file
      masterApp.post('/', function() {
        server.close()
        stop()
        httpPost(slavePort, getHandoverData())
        signalKillMe()
      })

      callback(null, masterApp)
    })
  }

  function createSlaveServer(callback) {
    createServer(slavePort, function(err, slaveApp, server) {
      if (err) return callback(err)

      console.log("I'm the slave...")

      // whenever on the slave port we receive the handover data run the process (with handover data)
      slaveApp.post('/', function(req, res) {
        run(req.body)
        // and now start a server on the master port
        createMasterServer(function() {
          // and release the slave port
          server.close()
        })
      })

      callback(null, slaveApp)
    })
  }

  // try to listen on the master port
  createMasterServer(function(err, masterServer) {
    if (!err) {
      // if ok we're done, run the process (with no handover data)
      return run()
    }

    // if not listen on the slave port
    createSlaveServer(function(err, slaveApp, server) {
      if (err) {
        console.error(err)
        process.exit(1)
      }

      // then talk to the master port over HTTP to let it know we're ready for handover
      httpPost(masterPort)
    })
  })
}
