module.exports = function getRun(opts) {
  var state = require('./state')({ speed: 0, rot: 0 })
  var web = require('./web')({
    streamFolder: opts.streamFolder,
    state: state,
    onStateUpdate: updateMotors
  })
  var motors = require('./motors')({ board: opts.board })
  var cam = require('./cam')({
    streamFolder: opts.streamFolder,
    streamFile: opts.streamFile,
    imageInterval: opts.imageInterval,
    cameraStuckTimeout: opts.cameraStuckTimeout,
    imageWidth: opts.imageWidth,
    imageHeight: opts.imageHeight,
    imageQuality: opts.imageQuality,
    socketIo: web.socketIo
  })
  var port = opts.port

  function updateMotors() {
    motors.update(state.get())
  }

  function run(handoverData) {
    // hande exits
    process.on('SIGTERM', function () {
      console.log("node application exiting, cleaning up ...")
      cam.stop()
      process.exit(0)
    })

    process.on('exit', function (code) {
      console.log("node about to exit with code:" + code)
      cam.stop()
    })

    // handle handover data
    if (handoverData) {
      state.update(handoverData)
    }

    // start everything
    updateMotors()
    cam.start()
    web.start(port, function () {
      console.log('Server is listening on', port)
    })
  }

  return {
    run: run,
    stop: function() {
      cam.stop()
      motors.release()
      web.stop()
    },
    getState: function() {
      return state.get()
    }
  }
}
