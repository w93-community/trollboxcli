const io = require('socket.io-client')
const { configure, autorun, observable, decorate } = require('mobx')
configure({
    isolateGlobalState: true
})

class User {
    constructor(nick, color) {
        this.nick = nick || "anonymous"
        this.color = color || "white"
    }
}

decorate(User, {
    nick: observable,
    color: observable
})

const wrap = async function(f) {
    var originalPrompt = this.cli.prompt.innerHTML
    var originalOnenter = this.cli.onenter
    try  {
      this.cli.prompt.innerHTML = ''
      this.cli.onenter = l => false
      var cli = this.cli
      var lastLog = $log('')
      await f({
          log: (...args) => {
              var newLog = $log(...args)
              lastLog.parentElement.insertBefore(newLog, lastLog.nextSibling)
              lastLog = newLog
            },
            set online(f) {
            cli.onenter = l => { f(l); return false }
          },
          set prompt(p) { cli.prompt.innerHTML = p },
            arg: this.arg
        })
    } finally {
      this.cli.prompt.innerHTML = originalPrompt
      this.cli.onenter = originalOnenter
    }
}

const userToString = user => `<span style="color: ${user.color || 'white'}">${user.nick || 'anonymous'}</span>`

const handleLine = (socket, ln, exit) => {
    if (ln.startsWith('/exit')) exit()
    else socket.emit('message', ln)
}

const app =  cli => {
    var exit;
    var p = new Promise(res => exit = res)
    const socket = io('//www.windows93.net:8081')
    const currentUser = new User(localStorage['.config/trollbox/nick'], localStorage['.config/trollbox/color'])
    cli.online = ln => handleLine(socket, ln, exit)
    socket.on('user joined', user => {
        cli.log(`${userToString(user)} has entered teh trollbox`)
    })
    socket.on('user change nick', (old, nyw) => {
        cli.log(`${userToString(old)} is now known as ${userToString(nyw)}`)
    })
    socket.on('message', msg => {
        cli.log(`${userToString(msg)}: ${msg.msg}`)
    })
    autorun(() => cli.prompt = `${userToString(currentUser)}&gt;&nbsp;`)
    autorun(() => socket.emit('user joined', currentUser.nick, currentUser.color))

    return p.then(() => socket.close())
}

le._apps.trollboxcli = {
    terminal: true,
    exec: function() { wrap.call(this, app) }
}