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
    var originalOndestroy = this.cli.ondestroy
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
            set onexit(f) {
                cli.ondestroy = () => f()
            },
            set prompt(p) { cli.prompt.innerHTML = p },
            arg: this.arg
        })
    } finally {
        this.cli.prompt.innerHTML = originalPrompt
        this.cli.onenter = originalOnenter
        this.cli.ondestroy = originalOndestroy
    }
}

const userToString = user => `<span style="color: ${user.color || 'white'}">${user.nick || 'anonymous'}</span>`

const handleLine = (socket, user, ln, exit, cfg) => {
    if (ln.startsWith('/')) {
        switch (ln.split(' ')[0].substr(1).toLowerCase()) {
            case 'exit':
                exit()
                break
            case 'nick':
                $store.set('.config/trollbox/nick', user.nick = ln.split(' ').slice(1).join(' '))
                break
            case 'color':
                $store.set('.config/trollbox/color', user.color = ln.split(' ').slice(1).join(' '))
                break
            case 'img':
                if (ln.split(' ')[1] == 'on') cfg.img = true
                else cfg.img = false
                break
            default:
                socket.emit('message', ln)
                break
        }
    }
    else socket.emit('message', ln)
}

const isImgUrl = url => (/\.(gif|jpg|jpeg|tiff|png|webp)$/i).test(url.pathname)

const app =  cli => {
    var cfg = { img: false }
    var exit;
    var p = new Promise(res => exit = res)
    cli.onexit = exit
    const socket = io(cli.arg.arguments[0] || '//www.windows93.net:8081')
    const currentUser = new User($store.get('.config/trollbox/nick'), $store.get('.config/trollbox/color'))
    cli.online = ln => handleLine(socket, currentUser, ln, exit, cfg)
    socket.on('user joined', user => {
        cli.log(`${userToString(user)} has entered teh trollbox`)
    })
    socket.on('user left', user => {
        cli.log(`${userToString(user)} has left teh trollbox`)
    })
    socket.on('user change nick', (old, nyw) => {
        cli.log(`${userToString(old)} is now known as ${userToString(nyw)}`)
    })
    socket.on('message', msg => {
        if (!cfg.img) cli.log(`${userToString(msg)}: ${msg.msg}`)
        else {
            let logs = [`${userToString(msg)}: `]
            let logsCtr = 0
            for (let betweenSpace of msg.msg.split(' ')) {
                try {
                    let url = new URL(betweenSpace)
                    if (isImgUrl(url)) {
                        logs.push(`<img src="${url}" style="max-width: 100%;">`)
                        logsCtr += 2
                        logs[logsCtr] = ''
                    } else logs[logsCtr] += betweenSpace + ' '
                } catch (ex) {
                    logs[logsCtr] += betweenSpace + ' '
                }
            }
            logs.forEach(e => cli.log(e))
        }
    })
    autorun(() => cli.prompt = `${userToString(currentUser)}&gt;&nbsp;`)
    autorun(() => socket.emit('user joined', currentUser.nick, currentUser.color))

    return p.then(() => socket.close())
}

le._apps.trollboxcli = {
    terminal: true,
    exec: function() { wrap.call(this, app) }
}