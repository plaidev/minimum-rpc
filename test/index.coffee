
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
  join: (socket, room, cb) ->
    called['join'] = true
    if room is 'accept_room'
      cb null
    else
      cb new Error('reject')
})

server_ns = new Server(io, undefined, {
  name_space: 'ns'
})

# client
client = new Client io_for_client, {url: 'http://localhost:2000'}
client_ns = new Client io_for_client, {url: 'http://localhost:2000', name_space: 'ns'}

# methods
server.set 'add', (a, b, cb) ->
  cb(null, a + b)

server_ns.set 'add', (a, b, cb) ->
  cb(null, a + b + 1)


describe "Basic RPC Function", ->

  it "1 + 2 = 3", (done) ->
    client.send 'add', 1, 2, (err, val) ->
      assert not err
      assert val is 3

      assert called.connection

      done()

describe 'Namespace', ->

  it 'default namespaced client call default server', (done) ->
    client.send 'add', 1, 2, (err, val) ->
      assert not err
      assert val is 3
      done()

  it 'namespaced client call namespaced server', (done) ->
    client_ns.send 'add', 1, 2, (err, val) ->
      assert not err
      assert val is 4
      done()

describe 'Grouped emit', ->

  it 'can join to accept room', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000'}

    client.join 'accept_room', (err) ->
      assert not err
      assert called.join

      client._socket.on 'path/event', (event) ->
        assert event.name is 'event_name'
        client._socket.off 'path/event'
        done()

      server.channel.to('accept_room').emit 'path/event', {name: 'event_name'}

  it 'cannot join to reject room', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000'}

    client.join 'reject_room', (err) ->
      assert err
      done()

  it 'can listen leaked event from same namespace client room', (done) ->
    client2 = new Client io_for_client, {url: 'http://localhost:2000'}
    client2._socket.on 'path/event', (event) ->
      assert event.name is 'leaked event'
      setTimeout done, 100

    client3 = new Client io_for_client, {url: 'http://localhost:2000', name_space: 'ns'}
    client3._socket.on 'path/event', (event) ->
      assert false

    server.channel.to('accept_room').emit 'path/event', {name: 'leaked event'}


describe 'reconnect', ->

  before (done) ->
    @server = new Server(io, undefined, {
      name_space: 'reconnect_test'
    })
    done()

  it 'can re-join to rooms on reconnected', (done) ->
    client = new Client io_for_client, {
      url: 'http://localhost:2000',
      name_space: 'reconnect_test'
    }

    client._manager.reconnectionDelayMax 100

    client.join 'reconnect_test', (err) =>
      assert not err

      reconnected = false

      client._socket.on 'test', (event) ->
        assert event.val
        if reconnected
          assert event.reconnected
          done()

      setTimeout =>
        @server.channel.to('reconnect_test').emit 'test', {val: true}
      , 100

      setTimeout =>
        io.close() # app.close()も含んでいる

        app = require("http").createServer()
        app.listen 2000, =>
          io = require("socket.io")(app)
          @server = new Server(io, undefined, {
            name_space: 'reconnect_test'
          })
          reconnected = true
          setTimeout =>
            @server.channel.to('reconnect_test').emit 'test', {val: true, reconnected}
          , 200

