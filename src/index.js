if (process.env.STOP === '1') {
  console.log('STOPPED')
  process.exit(0)
}

// CONFIG

var BOARD = 0x22
var IMAGE_WIDTH = 320
var IMAGE_RATIO = 4/3
var IMAGE_HEIGHT = IMAGE_WIDTH / IMAGE_RATIO
var STREAM_FOLDER = '/tmp/stream'
var STREAM_FILE = 'image_stream.jpg'
var IMAGE_INTERVAL = 100
var CAMERA_STUCK_TIMEOUT = IMAGE_INTERVAL * 5

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
    "--quality", 25,
    "-o", imagePath,
    "-t", "999999999",
    "-tl", '' + IMAGE_INTERVAL
  ],
  cameraProc

function spawnCameraProc() {
  cameraProc = spawn('raspistill', raspistillArgs)
  console.log('[raspistill] started, pid:', cameraProc.pid)
  // cameraProc.stdout.on('data', function(data){
  //   console.log("[raspistill] " + data)
  // })
  // cameraProc.stderr.on('data', function(data){
  //   console.error("[raspistill error] " + data)
  // })
  cameraProc.on('exit', function(code, signal){
    //if "raspistill" process ends for any reason, stop watching
    console.log("[raspistill] exited with code:", code)
    spawnCameraProc()
  })
}

function watchFile() {
  if (!fs.existsSync(imagePath)) {
    console.log('Image file does not exist')
    setTimeout(watchFile, 100)
    return
  }
  console.log('Image file found')
  startWatch()
}

var stuckTimeout = null

function onWatcherStuck() {
  cameraProc.kill()
}

function emitNewImage() {
  // console.log('Image changed')
  var buff = fs.readFileSync(imagePath)
  socketIo.emit('image', buff)

  clearTimeout(stuckTimeout)
  stuckTimeout = setTimeout(onWatcherStuck, CAMERA_STUCK_TIMEOUT)
}

function startWatch(){
  var createWatcher = function() {
    fileWatcher = fs.watch(imagePath, { persistent: true }, watchCallback)
  }
  var watchCallback = function(event, filename){
    if ('change' === event) {
      emitNewImage()
    } else if('rename' === event) {
      fileWatcher.close()
      createWatcher()
    }
  }

  createWatcher()
}

function stopStreaming() {
  if (cameraProc) cameraProc.kill()
  if (fileWatcher) {
    fileWatcher.close()
    fileWatcher = null
  }
}

//do something when app is closing
process.on('SIGTERM', function () {
  writeLog("node application exiting, cleaning up ...")
  stopStreaming()
  process.exit(0)
})

process.on('exit', function (code) {
  writeLog("node about to exit with code:" + code)
  stopStreaming()
})

spawnCameraProc()
watchFile()

// EXPRESS LOGIC

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))
app.use(express.static(STREAM_FOLDER))
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
