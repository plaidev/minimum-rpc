
assert = require("assert")
app = require("http").createServer()
io = require("socket.io")(app)
io_for_client = require('socket.io-client')
{Server, Client} = require('..')

# server
app.listen 2000, () ->
  console.log 'server listen start'
server = new Server(io, undefined, {
  connection: (socket, cb) ->
    console.log 'authentification'
    cb null
})

# client
client = new Client io_for_client, {url: 'http://localhost:2000'}

describe "Basic RPC Function", ->
  it "1 + 2 = 3", (done) ->
    server.set 'add', (a, b, cb) ->
      cb(null, a + b)
    client.send 'add', 1, 2, (err, val) ->
      assert not err
      assert val is 3
      done()
