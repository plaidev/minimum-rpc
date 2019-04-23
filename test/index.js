/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const assert = require("assert");
let app = require("http").createServer();
let io = require("socket.io")(app);
const io_for_client = require('socket.io-client');
const Server = require('../lib/server');
const Client = require('../lib/client');


// server
app.listen(8001, () => console.log('server listen start'));

const called = {};

const server = new Server(io, undefined, {
  connection(socket, cb) {
    console.log('authentification');
    called['connection'] = true;
    return cb(null);
  },
  join(socket, room, cb) {
    called['join'] = true;
    if (room === 'accept_room') {
      return cb(null);
    } else {
      return cb(new Error('reject'));
    }
  }
});

const server_ns = new Server(io, undefined, {
  name_space: 'ns'
});

// client
let client = new Client(io_for_client, {url: 'http://localhost:8001'});
const client_ns = new Client(io_for_client, {url: 'http://localhost:8001', name_space: 'ns'});

// methods
server.set('add', (a, b, cb) => cb(null, a + b));

server_ns.set('add', (a, b, cb) => cb(null, a + b + 1));


describe("Basic RPC Function", () =>

  it("1 + 2 = 3", done =>
    client.send('add', 1, 2, function(err, val) {
      assert(!err);
      assert(val === 3);

      assert(called.connection);

      return done();
    })
  )
);

describe('Namespace', function() {

  it('default namespaced client call default server', done =>
    client.send('add', 1, 2, function(err, val) {
      assert(!err);
      assert(val === 3);
      return done();
    })
  );

  return it('namespaced client call namespaced server', done =>
    client_ns.send('add', 1, 2, function(err, val) {
      assert(!err);
      assert(val === 4);
      return done();
    })
  );
});

describe('Grouped emit', function() {

  it('can join to accept room', function(done) {
    client = new Client(io_for_client, {
      url: 'http://localhost:8001'});

    return client.join('accept_room', function(err) {
      assert(!err);
      assert(called.join);

      client._socket.on('path/event', function(event) {
        assert(event.name === 'event_name');
        client._socket.off('path/event');
        return done();
      });

      return server.channel.to('accept_room').emit('path/event', {name: 'event_name'});
  });
});

  it('cannot join to reject room', function(done) {
    client = new Client(io_for_client, {
      url: 'http://localhost:8001'});

    return client.join('reject_room', function(err) {
      assert(err);
      return done();
    });
  });

  return it('can listen leaked event from same namespace client room', function(done) {
    const client2 = new Client(io_for_client, {url: 'http://localhost:8001'});
    client2._socket.on('path/event', function(event) {
      assert(event.name === 'leaked event');
      return setTimeout(done, 100);
    });

    const client3 = new Client(io_for_client, {url: 'http://localhost:8001', name_space: 'ns'});
    client3._socket.on('path/event', event => assert(false));

    return server.channel.to('accept_room').emit('path/event', {name: 'leaked event'});
});
});


describe('reconnect', function() {

  before(function(done) {
    this.server = new Server(io, undefined, {
      name_space: 'reconnect_test'
    });
    return done();
  });

  return it('can re-join to rooms on reconnected', function(done) {
    client = new Client(io_for_client, {
      url: 'http://localhost:8001',
      name_space: 'reconnect_test'
    });

    client._manager.reconnectionDelayMax(100);

    return client.join('reconnect_test', err => {
      assert(!err);

      let reconnected = false;

      client._socket.on('test', function(event) {
        assert(event.val);
        if (reconnected) {
          assert(event.reconnected);
          app.close();
          done();
        }
      });

      setTimeout(() => {
        return this.server.channel.to('reconnect_test').emit('test', {val: true});
      }
      , 100);

      return setTimeout(() => {
        io.close(); // app.close()も含んでいる

        app = require("http").createServer();
        return app.listen(8001, () => {
          io = require("socket.io")(app);
          this.server = new Server(io, undefined, {
            name_space: 'reconnect_test'
          });
          reconnected = true;
          return setTimeout(() => {
            return this.server.channel.to('reconnect_test').emit('test', {val: true, reconnected});
          }
          , 200);
        });
      });
    });
  });
});


describe('reject connection', function() {
  before(function(done) {
    const reject_app = require("http").createServer();
    const reject_io = require("socket.io")(reject_app);
    reject_app.listen(2001, () => done());
    const reject_server = new Server(reject_io, undefined, {
      connection(socket, cb) {
        called['reject_connection'] = true;
        return cb(new Error('connection rejected'));
      }
    });
    return reject_server.set('add', (a, b, cb) => cb(null, a+b));
  });

  it('connection failed', function(done) {
    let rejected_client;
    return rejected_client = new Client(io_for_client, {url: 'http://localhost:2001'}, function(err) {
      assert(err);

      const more_rejected_client = new Client(io_for_client, {url: 'http://localhost:2001'});

      // connection error is shared for each url
      assert(err === more_rejected_client._connectionError);

      return done();
    });
  });

  return it('call failed', function(done) {
    let rejected_client;
    return rejected_client = new Client(io_for_client, {url: 'http://localhost:2001'}, function(err) {

      return rejected_client.send('add', 1, 2, function(err, result) {
        assert(err);
        return done();
      });
    });
  });
});
