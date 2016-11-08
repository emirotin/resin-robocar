if (process.env.STOP === '1') {
  console.log('STOPPED')
  process.exit(0)
}

// CONFIG

var BOARD = 0x22
var IMAGE_WIDTH = 320
var IMAGE_RATIO = 4/3
var IMAGE_HEIGHT = IMAGE_WIDTH / IMAGE_RATIO
var STREAM_FOLDER = '/data/stream'
var STREAM_FILE = 'image_stream.jpg'
var IMAGE_INTERVAL = 100

// DEPS

var i2c = require('i2c')
var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn

var express = require("express"),
  bodyParser = require('body-parser'),
  app = express(),
  httpServer = require('http').Server(app),
  socketIo = require('socket.io')(httpServer)

// MOTORS LOGIC

var wire = new i2c(BOARD, { device: '/dev/i2c-1' })
var _speed = 0, _rot = 0

function normalizeSpeed(speed) {
  var result = -127 + Math.floor(255 * (speed + 1) / 2)
  if (result === 128) {
    result = 127
  }
  return result
}

function normalizeMotor(motor) {
  return motor === 'left' ? 1 : 0
}

function setMotor(motor, speed) {
  console.log('SET:', motor, 'to', speed);
  wire.write([ normalizeMotor(motor), normalizeSpeed(speed) ], function(err) {
    console.error(err)
  })
}

function updateMotors(newState) {
  _speed = newState.speed
  _rot = newState.rot

  var speedRight, speedLeft
  if (_rot > 0) {
    speedLeft = _speed
    speedRight = _speed * (1 - _rot)
  } else {
    speedLeft = _speed * (1 + _rot)
    speedRight = _speed
  }

  setMotor('left', speedLeft)
  setMotor('right', speedRight)
}

function getState() {
  return {
    speed: _speed,
    rot: _rot
  }
}

updateMotors(getState())

// CAMERA LOGIC

var sockets = {},
  fileWatcher = null,
  imagePath = STREAM_FOLDER + '/' + STREAM_FILE,
  raspistillArgs = [
    "-w", '' + IMAGE_WIDTH,
    "-h", '' + IMAGE_HEIGHT,
    "-o", imagePath,
    "-t", "999999999",
    "-tl", '' + IMAGE_INTERVAL
  ],
  cameraProc = spawn('raspistill', raspistillArgs)

function watchFile() {
  if (!fs.existsSync(imagePath)) {
    setInterval(watchFile, 100)
    return
  }
  fileWatcher = fs.watch(imagePath, emitNewImage)
}

watchFile()

function emitNewImage() {
  socketIo.sockets.emit('image', '/' + STREAM_FILE + '?_t=' + Date.now())
}

// function stopStreaming() {
//   if (cameraProc) cameraProc.kill()
//   fileWatcher.close()
//   fileWatcher = null
// }

/*socketIo.on('connection', function(socket) {
  //sockets[socket.id] = socket
  //startStreaming()

  // socket.on('disconnect', function() {
  //   delete sockets[socket.id]
  //   // no more sockets, kill the stream
  //   if (Object.keys(sockets).length == 0) {
  //     stopStreaming()
  //   }
  // })
})*/

// EXPRESS LOGIC

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))
app.use(express.static(path.join(__dirname, '..', STREAM_FOLDER)))
app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.render('index', getState())
})

app.post('/set', function(req, res) {
  res.end()
  updateMotors(req.body)
})

// START ALL THE THINGS

httpServer.listen(process.env.PORT || 80, function () {
  console.log('Server is listening')
})
