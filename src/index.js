var i2c = require('i2c')
var BOARD = 0x22

var wire = new i2c(address, device: '/dev/i2c-1')

function normalizeSpeed(speed) {
  return -127 + Math.floor(255 * (speed + 1) / 2)
}

function setMotor(motor, speed) {
  var value = normalizeSpeed(speed)
  wire.write([ BOARD, motor === 'left' ? 0 : 1, value ], function(err) {
    console.error(err)
  })
}

setMotor('left', 1)
setMotor('right', 1)
