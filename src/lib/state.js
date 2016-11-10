module.exports = function init(initState) {
  var state = initState

  return {
    get: function() {
      return state
    },
    update: function(newProps) {
      Object.assign(state, newProps)
    }
  }
}
