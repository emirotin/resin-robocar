var i2c = require('i2c')
var BOARD = 0x22

if (process.env.STOP === '1') {
  console.log('STOPPED')
  process.exit(0)
}

var wire = new i2c(BOARD, { device: '/dev/i2c-1' })

function normalizeSpeed(speed) {
  // the polatiry is inverted, thus `-speed`
  var result = -127 + Math.floor(255 * (-speed + 1) / 2)
  console.log('Speed:', speed, 'normalized:', result)
  return result
}

function normalizeMotor(motor) {
  return motor === 'left' ? 0 : 1
}

function setMotor(motor, speed) {
  var value = normalizeSpeed(speed)
  wire.write([ /*BOARD,*/ normalizeMotor(motor), value ], function(err) {
    console.error(err)
  })
}

setMotor('left', 1)
setMotor('right', -1)
