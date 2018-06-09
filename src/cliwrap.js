/* global $log */

module.exports = function (f) {
  var originalPrompt = this.cli.prompt.innerHTML
  var originalOnenter = this.cli.onenter
  var originalOndestroy = this.cli.ondestroy
  this.cli.prompt.innerHTML = ''
  this.cli.onenter = l => false
  var cli = this.cli
  var lastLog = $log('')
  let cleaned = false
  const cleanup = () => {
    cleaned = true
    this.cli.prompt.innerHTML = originalPrompt
    this.cli.onenter = originalOnenter
    this.cli.ondestroy = originalOndestroy
  }
  return f({
    log: (...args) => {
      if (!cleaned) {
        var newLog = $log(...args)
        lastLog.parentElement.insertBefore(newLog, lastLog.nextSibling)
        lastLog = newLog
      }
    },
    get online () {
      return cli.onenter
    },
    set online (f) {
      cli.onenter = l => { f(l); return false }
    },
    get onexit () {
      return cli.ondestroy
    },
    set onexit (f) {
      cli.ondestroy = () => { f() }
    },
    get prompt () {
      return cli.prompt.innerHTML
    },
    set prompt (p) { cli.prompt.innerHTML = p },
    arg: this.arg
  }).then(cleanup).error(cleanup)
}
