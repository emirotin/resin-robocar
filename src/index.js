var i2c = require('i2c')
var BOARD = 0x22

if (process.env.STOP === '1') {
  console.log('STOPPED')
  process.exit(0)
}

var wire = new i2c(BOARD, { device: '/dev/i2c-1' })

var express = require("express"),
  bodyParser = require('body-parser'),
  app = express()

function normalizeSpeed(speed) {
  var result = -127 + Math.floor(255 * (speed + 1) / 2)
  if (result === 128) {
    result = 127
  }
  console.log('Speed:', speed, 'normalized:', result)
  return result
}

function normalizeMotor(motor) {
  return motor === 'left' ? 0 : 1
}

function setMotor(motor, speed) {
  var value = normalizeSpeed(speed)
  wire.write([ normalizeMotor(motor), value ], function(err) {
    console.error(err)
  })
}

var speed = 0, rot = 0
updateMotors()

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.render('index', { speed: speed, rot: rot })
})

app.post('/set', function(req, res) {
  speed = req.body.speed
  rot = req.body.rot
  res.end()
  updateMotors()
})

function updateMotors() {
  var speedRight, speedLeft
  if (rot > 0) {
    speedLeft = speed
    speedRight = speed * (1 + rot)
  } else {
    speedLeft = speed * (1 - rot)
    speedRight = speed
  }

  setMotor('left', speedLeft)
  setMotor('right', speedRight)
}

app.listen(process.env.PORT || 80, function () {
  console.log('Server is listening')
})
