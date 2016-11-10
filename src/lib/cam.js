var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn

module.exports = function init(opts) {
  var fileWatcher = null,
    imagePath = opts.streamFolder + '/' + opts.streamFile,
    raspistillArgs = [
      "-w", '' + opts.imageWidth,
      "-h", '' + opts.imageHeight,
      "--quality", opts.imageQuality,
      "-o", imagePath,
      "-t", "999999999",
      "-tl", '' + opts.imageInterval
    ],
    cameraProc = null,
    stuckTimeout = null,
    socketIo = opts.socketIo

  function spawnCameraProc() {
    cameraProc = spawn('raspistill', raspistillArgs)
    console.log('[raspistill] started, pid:', cameraProc.pid)
    cameraProc.on('exit', function(code, signal) {
      // if "raspistill" process ends for any reason, respawm
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

  function onWatcherStuck() {
    cameraProc.kill()
  }

  function emitNewImage() {
    // console.log('Image changed')
    var buff = fs.readFileSync(imagePath)
    socketIo.emit('image', buff)

    clearTimeout(stuckTimeout)
    stuckTimeout = setTimeout(onWatcherStuck, opts.cameraStuckTimeout)
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
    if (cameraProc) {
      cameraProc.kill()
      cameraProc = null
    }
    if (fileWatcher) {
      fileWatcher.close()
      fileWatcher = null
    }
  }

  return {
    start: function() {
      spawnCameraProc()
      watchFile()
    },
    stop: stopStreaming
  }
}
