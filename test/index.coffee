
assert = require("assert")
app = require("http").createServer()
io = require("socket.io")(app)
io_for_client = require('socket.io-client')
{Server, Client} = require('..')

# server
app.listen 2000, () ->
  console.log 'server listen start'

called = {}

server = new Server(io, undefined, {
  connection: (socket, cb) ->
    console.log 'authentification'
    called['connection'] = true
    cb null
  authorization: (socket, auth_name, cb) ->
    called['authorization'] = true
    if auth_name is 'accept_auth_name' or auth_name is '__'
      cb null
    else
      cb new Error('reject')
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

      assert called.connection
      assert called.authorization

      done()

describe 'sub name space', ->

  before ->
    server.set 'add1', (a, b, cb) ->
      cb(null, a + b + 1)

    server.set 'add2', (a, b, cb) ->
      cb(null, a + b + 2)

    server.set 'add3', (a, b, cb) ->
      cb(null, a + b + 3)

  it 'can join to default auth', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000'}
    client.send 'add1', 1, 2, (err, val) ->
      assert not err
      assert val is 4
      done()

  it 'can join to accept auth', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000',
      auth_name: 'accept_auth_name'}
    client.send 'add2', 1, 2, (err, val) ->
      assert not err
      assert val is 5

      client.send 'add1', 1, 2, (err, val) ->
        assert not err
        assert val is 4
        done()

  it 'can not join to reject auth', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000',
      auth_name: 'reject_auth_name'}

    client.send 'add3', 1, 2, (err, val) ->
      console.log err, val
      assert err

    setTimeout ->
      console.log 'connection timeout'
      assert true
      done()
    , 1000