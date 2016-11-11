var i2c = require('i2c')

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

function setMotor(wire ,motor, speed) {
  console.log('SET:', motor, 'to', speed);
  wire.write([ normalizeMotor(motor), normalizeSpeed(speed) ], function(err) {
    if (err) {
      console.error('motor error:', err)
    }
  })
}

function updateMotors(wire, newState) {
  var speed = newState.speed
  var rot = newState.rot

  var speedRight, speedLeft
  if (rot > 0) {
    speedLeft = speed
    speedRight = speed * (1 - rot)
  } else {
    speedLeft = speed * (1 + rot)
    speedRight = speed
  }

  setMotor(wire, 'left', speedLeft)
  setMotor(wire, 'right', speedRight)
}

module.exports = function init(opts) {
  var wire = new i2c(opts.board, { device: '/dev/i2c-1' })

  return {
    update: updateMotors.bind(null, wire),
    release: function() {
      // TBD
    }
  }
}
