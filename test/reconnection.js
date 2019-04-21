/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const assert = require("assert");
const io_for_client = require('socket.io-client');
const Server = require('../lib/server');
const Client = require('../lib/client');


const _server = function(port, cb) { 
  if (port == null) { port = 2000; }
  const app = require("http").createServer();
  const io = require("socket.io")(app);
  const server = new Server(io);
  const _app = app.listen(port, (err) => {
    if (err) throw err;
    cb(err, _app, io);
  });
  return server;
};

const _client = function(port) {
  if (port == null) { port = 2000; }
  return new Client(io_for_client, {
    url: `http://localhost:${port}`
  });
};


describe('reconnect', function() {

  var _build = function(n, cb=null) {
    // delayMethod, returnError, restartを持つサーバを作る
    console.log('server: build server', n);
    this.server = _server(8002, (err, app, io) => {
      this.app = app;
      this.io = io;
      this.num = n;
      console.log('server: listen start');
      return (typeof cb === 'function' ? cb() : undefined);
    });
    this.server.set('delayMethod', function(n, cb) {
      console.log('server: delay method start', n);
      return setTimeout(function() {
        console.log('server: delay method done', n);
        return cb(null, n);
      }
      , 100);
    });
    return this.server.set('restart', cb => {
      console.log('server: call restart');
      cb();

      // 回線をクローズし、同様のサーバを作り直す
      console.log('server: close connection');
      console.log(this.num);
      this.app.emit('close')
      this.app.close(()=>{
        console.log('server: restart server', n+1);
        return _build.call(this, n+1);
      }, 200);
    });
  };

  before(function(done) {
    return _build.call(this, 0, done);
  });

  after(function(done) {
    if (this.app) {
      this.app.emit('close')
      this.app.close(done);
      process.exit()
    } else {
      return done();
    }
  });

  return it('can reconnect', function(done) {
    const client = _client(8002);

    let cnt = 0;

    client._socket.on('disconnect', function() {

      // disconnect発覚直後に実行されたイベントはreconnect後に実行される
      console.log('call delayMethod method 3');
      return client.send('delayMethod', 3, function(err, n) {
        cnt++;
        console.log('okokok', err, n, cnt);

        assert(!err);
        assert(cnt === 3);
        return done();
      });
    });

    client._socket.on('reconnect', () => console.log('reconnect'));

    console.log('call delayMethod method 1');
    return client.send('delayMethod', 1, function(err, n) {
      cnt++;
      console.log('ok', err, n);

      return client.send('restart', function() {

        console.log('call delayMethod method 2 (lost)');
        return client.send('delayMethod', 2, function(err) {
          assert(err.name === 'ResponseError');
          console.log('okok', err, n, cnt);
          return cnt++;
        });
      });
    });
  });
});
