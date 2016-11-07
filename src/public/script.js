var data = {
  speed: window.INIT_SPEED,
  rot: window.INIT_ROT
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

app.observe('speed', onChange)
app.observe('rot', onChange)
