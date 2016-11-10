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
var CAMERA_STUCK_TIMEOUT = IMAGE_INTERVAL * 6

var HANDOVER_MASTER_PORT = 8080
var HANDOVER_SLAVE_PORT = 9090

var run = require('./lib/run')({
  board: BOARD,
  streamFolder: STREAM_FOLDER,
  streamFile: STREAM_FILE,
  imageInterval: IMAGE_INTERVAL,
  cameraStuckTimeout: CAMERA_STUCK_TIMEOUT,
  imageWidth: IMAGE_WIDTH,
  imageHeight: IMAGE_HEIGHT,
  imageQuality: IMAGE_QUALITY
})

// require('./handover')({
//   masterPort: MASTER_PORT
// })

run()
