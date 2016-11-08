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

var socket = io()

socket.on('image', function(url) {
  app.set('imagePath', url)
});
