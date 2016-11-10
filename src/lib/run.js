module.exports = function getRun(opts) {
  var state = require('./state')({ speed: 0, rot: 0 })
  var web = require('./web')({
    streamFolder: opt.streamFolder,
    state: state,
    onStateUpdate: updateMotors
  })
  var motors = require('./motors')({ board: opts.board })
  var cam = require('./cam')({
    streamFolder: opt.streamFolder,
    streamFile: opts.streamFile,
    imageInterval: opts.imageInterval,
    cameraStuckTimeout: opts.cameraStuckTimeout,
    imageWidth: opts.imageWidth,
    imageHeight: opts.imageHeight,
    imageQuality: opts.imageQuality,
    socketIo: web.socketIo
  })
  var ports = opts.port

  function updateMotors() {
    motors.update(state.get())
  }

  return function run() {
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

    // start everything
    updateMotors()
    cam.start()
    web.start(port, function () {
      console.log('Server is listening on', port)
    })
  }
}
