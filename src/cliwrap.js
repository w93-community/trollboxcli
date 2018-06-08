module.exports = function(f) {
    var originalPrompt = this.cli.prompt.innerHTML
    var originalOnenter = this.cli.onenter
    var originalOndestroy = this.cli.ondestroy
    this.cli.prompt.innerHTML = ''
    this.cli.onenter = l => false
    var cli = this.cli
    var lastLog = $log('')
    const cleanup = () => {
        this.cli.prompt.innerHTML = originalPrompt
        this.cli.onenter = originalOnenter
        this.cli.ondestroy = originalOndestroy
    }
    return f({
        log: (...args) => {
            var newLog = $log(...args)
            lastLog.parentElement.insertBefore(newLog, lastLog.nextSibling)
            lastLog = newLog
        },
        set online(f) {
            cli.onenter = l => { f(l); return false }
        },
        set onexit(f) {
            cli.ondestroy = () => f()
        },
        set prompt(p) { cli.prompt.innerHTML = p },
        arg: this.arg
    }).then(cleanup).error(cleanup)
}