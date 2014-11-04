
{Server} = require('../..')

app = require("http").createServer()
io = require("socket.io")(app)
app.listen 2000, () ->
  console.log 'server listen start'

server = new Server(io, {
  add: (a, b, cb) ->
    cb(null, a + b)
})
