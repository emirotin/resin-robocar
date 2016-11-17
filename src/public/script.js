var sliderDecorator = function (node, name) {
  var app = node._ractive.proxy.ractive

  var slider = new Slider(node, {
    value: app.get(name)
  })
  slider.on('change', function () {
    app.set(name, slider.getValue())
  })
  app.observe(name, function () {
    slider.setValue(app.get(name))
  })

  return {
    teardown: function () {
      slider.destroy()
    }
  }
}

Ractive.decorators.slider = sliderDecorator

var EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="

var data = {
  speed: window.INIT_SPEED,
  rot: window.INIT_ROT,
  inputStep: 0.1,
  inputMin: -1,
  inputMax: 1,
  emptyImage: EMPTY_IMAGE
}

var app = new Ractive({
  el: '#root',
  template: '#tpl',
  data: data
})

var socket = io({
  reconnection: true,
  reconnectionDelay: 200,
  reconnectionDelayMax: 1400
})

function onChange() {
  fetch('/set', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      speed: app.get('speed'),
      rot: app.get('rot')
    })
  })
}

function onStop() {
  app.set({
    speed: 0,
    rot: 0
  })
}

function onResetRot() {
  app.set({
    rot: 0
  })
}

app.observe('speed', onChange)
app.observe('rot', onChange)

app.on('stop', onStop)
app.on('resetRot', onResetRot)

// socket.on('image', function(buff) {
//   var blob = new Blob([ buff ], { type: "image/jpeg" })
//   var objectURL = URL.createObjectURL(blob)
//   document.getElementById('image').src = objectURL
// })

function incValue(name, sign) {
  var val = app.get(name) + sign * data.inputStep
  if (val >= data.inputMin && val <= data.inputMax) {
    app.set(name, val)
  }
}

window.onkeyup = function (event) {
  switch (event.key) {
    case "ArrowUp": incValue('speed', 1); break;
    case "ArrowDown": incValue('speed', -1); break;
    case "ArrowRight": incValue('rot', 1); break;
    case "ArrowLeft": incValue('rot', -1); break;
  }
}
