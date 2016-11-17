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

var data = {
  speed: window.INIT_SPEED,
  rot: window.INIT_ROT,
  imagePath: null
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

socket.on('image', function(buff) {
  var blob = new Blob([ buff ], { type: "image/jpeg" })
  var objectURL = URL.createObjectURL(blob)
  document.getElementById('image').src = objectURL
})
