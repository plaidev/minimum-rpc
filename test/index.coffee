
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
  join_request: (socket, sub_name_space, cb) ->
    called['join_request'] = true
    if sub_name_space is 'accept_sub_name_space'
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
      assert not called.join_request

      done()

describe 'sub name space', ->

  before ->
    server.set 'add1', (a, b, cb) ->
      cb(null, a + b + 1)

    server.set 'add2', (a, b, cb) ->
      cb(null, a + b + 2)
    , 'accept_sub_name_space'

    server.set 'add3', (a, b, cb) ->
      cb(null, a + b + 3)
    , 'reject_sub_name_space'

  it 'can join to default sub name space', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000'}
    client.send 'add1', 1, 2, (err, val) ->
      assert not err
      assert val is 4
      done()

  it 'can join to default sub name space', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000',
      sub_name_space: 'accept_sub_name_space'}
    client.send 'add2', 1, 2, (err, val) ->
      assert not err
      assert val is 5

      client.send 'add1', 1, 2, (err, val) ->
        assert err
        done()

  it 'can not join to default sub name space', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000',
      sub_name_space: 'reject_sub_name_space'}

    client.send 'add3', 1, 2, (err, val) ->
      console.log err, val
      assert err

    setTimeout ->
      console.log 'connection timeout'
      assert true
      done()
    , 1000