if (process.env.STOP === '1') {
  console.log('STOPPED')
  process.exit(0)
}

// CONFIG

var BOARD = 0x22
var IMAGE_WIDTH = 320
var IMAGE_RATIO = 4/3
var IMAGE_HEIGHT = IMAGE_WIDTH / IMAGE_RATIO
var IMAGE_QUALITY = 25
var STREAM_FOLDER = '/tmp/stream'
var STREAM_FILE = 'image_stream.jpg'
var IMAGE_INTERVAL = 100
var CAMERA_STUCK_TIMEOUT = IMAGE_INTERVAL * 5

var state = require('./lib/state')({ speed: 0, rot: 0 })
var web = require('./lib/web')({
  streamFolder: STREAM_FOLDER,
  state: state,
  onStateUpdate: updateMotors
})
var motors = require('./lib/motors')({ board: BOARD })
var cam = require('./lib/state')({
  streamFolder: STREAM_FOLDER,
  streamFile: STREAM_FILE,
  imageInterval: IMAGE_INTERVAL,
  cameraStuckTimeout: CAMERA_STUCK_TIMEOUT,
  imageWidth: IMAGE_WIDTH,
  imageHeight: IMAGE_HEIGHT,
  imageQuality: IMAGE_QUALITY,
  socketIo: web.socketIo
})

function updateMotors() {
  motos.update(state.get())
}

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
web.start(process.env.PORT || 80, function () {
  console.log('Server is listening')
})
