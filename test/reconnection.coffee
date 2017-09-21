assert = require("assert")
io_for_client = require('socket.io-client')
Server = require('../src/server')
Client = require('../src/client')


_server = (port=2000, cb) -> 
  app = require("http").createServer()
  io = require("socket.io")(app)
  server = new Server(io)
  app.listen port, () ->
    cb null, app, io, server
  return server

_client = (port=2000) ->
  return new Client io_for_client, {
    url: 'http://localhost:'+port
  }


describe 'reconnect', ->

  _build = (n, cb=null) ->
    # delayMethod, returnError, restartを持つサーバを作る
    console.log('server: build server', n)
    @server = _server 2001, (err, @app, @io, @server) =>
      @num = n
      console.log('server: listen start')
      cb?()
    @server.set 'delayMethod', (n, cb) ->
      console.log('server: delay method start', n)
      setTimeout ->
        console.log('server: delay method done', n)
        cb null, n
      , 100
    @server.set 'restart', (cb) =>
      console.log('server: call restart')
      cb()

      # 回線をクローズし、同様のサーバを作り直す
      console.log('server: close connection')
      console.log(@num)
      @app.close()
      setTimeout =>
        console.log('server: restart server', n+1)
        _build.call @, n+1
      , 100

  before (done) ->
    _build.call @, 0, done

  after (done) ->
    if @app
      @app.close(done) 
    else
      done()

  it 'can reconnect', (done) ->
    client = _client(2001)

    cnt = 0

    client._socket.on 'disconnect', ->
      console.log('disconnect')

      # disconnect発覚直後に実行されたイベントはreconnect後に実行される
      console.log('call delayMethod method 3')
      client.send 'delayMethod', 3, (err, n) ->
        cnt++
        console.log('okokok', err, n, cnt)

        assert cnt is 3
        done()

    client._socket.on 'reconnect', ->
      console.log('reconnect')

    console.log('call delayMethod method 1')
    client.send 'delayMethod', 1, (err, n) ->
      cnt++
      console.log('ok', err, n)

      client.send 'restart', ->

        console.log('call delayMethod method 2 (lost)')
        client.send 'delayMethod', 2, (err) ->
          assert err.name is 'ResponseError'
          console.log('okok', err, n, cnt)
          cnt++
