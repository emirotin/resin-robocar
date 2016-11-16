var express = require("express"),
  bodyParser = require('body-parser'),
  request = require('request'),
  fs = require('fs')

function createServer(port, callback) {
  var app = express(),
    errorHandled = false

  app.use(bodyParser.json())
  var server = app.listen(port, function(err) {
    callback(err, app, server)
  }).on('error', function (err) {
    if (err.code === 'EADDRINUSE' && !errorHandled) {
      errorHandled = true
      callback(err)
      return
    }
    throw err
  })
}

function httpPost(port, data, callback) {
  data = data || {}
  console.log("HTTP POST to", port, ":", data)
  request.post({
    url: 'http://localhost:' + port,
    body: data,
    json: true,
    callback: callback
  })
}

module.exports = function handover(opts) {
  var masterPort = opts.masterPort
  var slavePort = opts.slavePort
  var run = opts.run
  var stop = opts.stop
  var getHandoverData = opts.getHandoverData

  function signalKillMe() {
    if (opts.mockMode) {
      console.log("HANDOVER: KILL: Mock mode, just exit")
      process.exit(0)
    }
    console.log("HANDOVER: KILL: Creating the /data/resin-kill-me file")
    fs.open('/data/resin-kill-me', 'w', function(err, fd) {
      if (!err) fs.close(fd, function(err) {})
    })
  }

  function createMasterServer(callback) {
    createServer(masterPort, function(err, masterApp, masterServer) {
      if (err) return callback(err)

      console.log("MASTER: I'm the master!")

      // whenever on the master port we receive the notification do:
      //  * release master port
      //  * release resources
      //  * post to the slave
      //  * create the kill me file
      masterApp.post('/', function(req, res) {
        console.log("MASTER: ready to die")
        res.end()

        masterServer.close()
        stop()

        var data = getHandoverData()
        console.log("MASTER: Passing the handover data to the slave:", data)
        httpPost(slavePort, data, function () {
          console.log("MASTER: Done, signalling to be killed")
          signalKillMe()
        })
      })

      callback(null, masterApp)
    })
  }

  function createSlaveServer(callback) {
    createServer(slavePort, function(err, slaveApp, slaveServer) {
      if (err) return callback(err)

      console.log("SLAVE: I'm the slave...")

      // whenever on the slave port we receive the handover data
      // run the process (with handover data)
      slaveApp.post('/', function(req, res) {
        var data = req.body
        res.end()

        console.log("SLAVE: running with params:", data)
        run(data)
        // and now start a server on the master port
        createMasterServer(function(err) {
          if (err) {
            console.log("SLAVE: error restarting in MASTER mode:", err)
            throw err
          }
          console.log("SLAVE: restarted in MASTER mode")
          // and release the slave port
          slaveServer.close()
        })
      })

      callback(null, slaveApp)
    })
  }

  // try to listen on the master port
  createMasterServer(function(err, masterServer) {
    if (!err) {
      // if ok we're done, run the process (with no handover data)
      console.log("MASTER: running")
      run()
      return
    }

    // if not listen on the slave port
    createSlaveServer(function(err, slaveApp/*, slaveServer*/) {
      if (err) {
        console.log("SLAVE: wtf...", err)
        console.error(err)
        process.exit(1)
      }

      // then talk to the master port over HTTP to let it know we're ready for handover
      console.log("SLAVE: telling the master I'm ready to take over")
      httpPost(masterPort, null, function(err) {
        if (err) {
          console.error("SLAVE: POST to master error: ", err)
        } else {
          console.log("SLAVE: POST to master OK")
        }
      })
    })
  })
}
