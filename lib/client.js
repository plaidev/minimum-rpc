/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _managers = {}; // for socket.io-client >= 1.4.x
const _connectionErrors = {};

class Client {
  constructor(io_or_socket, options, cb=null) {

    if (options == null) { options = {}; }
    this.url = options.url || '';

    this.name_space = options.name_space || '__';

    this._socket = io_or_socket;

    this._joined = [];

    this._connectionError = null;

    if ((io_or_socket.Manager != null) && _connectionErrors[this.url]) {

      this._connectionError = _connectionErrors[this.url];

      if (cb) {
        setTimeout(() => {
          return cb(this._connectionError);
        }
        , 0);
      }
      return;
    }

    this._requestId = 1;
    this._requestCache = {};
    this._disconnected = true;

    // for socket.io-client >= 1.4.x
    if (io_or_socket.Manager != null) {
      const path = `/${this.name_space}`;
      const uri = this.url;
      if (!(uri in _managers)) {
        _managers[uri] = io_or_socket.Manager(uri, options.connect_options);
      }

      this._manager = _managers[uri];

      this._socket = this._manager.socket(path);

      this._socket.on('connect', () => {

        this._disconnected = false;

        return (() => {
          const result = [];
          for (let k in this._requestCache) {
            const req = this._requestCache[k];
            result.push(req.queued = false);
          }
          return result;
        })();
      });

      this._socket.on('disconnect', () => {

        return this._disconnected = true;
      });

      this._socket.on('reconnect', () => {

        this._disconnected = false;

        const joined = this._joined;

        this._joined = [];

        for (let room of Array.from(joined)) {

          this.join(room);
        }

        return (() => {
          const result = [];
          for (let k in this._requestCache) {

            const req = this._requestCache[k];
            const {ack_cb, queued} = req;

            if (queued) {
              continue;
            }

            const err = new Error('There is no chance of getting a response by the request');
            err.name = 'ResponseError';
            result.push(ack_cb(err));
          }
          return result;
        })();
      });

    } else if (io_or_socket.constructor.name !== 'Socket') {
      this._socket = io_or_socket.connect(this.url + '/' + this.name_space, options.connect_options || {});
    }

    // not error, but connection acked
    if ((io_or_socket.Manager != null) && this.url in _connectionErrors) {
      if (cb) { cb(null, {success: true}); }
      return;
    }

    const self = this;

    this._socket.on('connection_ack', function(data) {

      if (data.error) {

        _connectionErrors[self.url] = new Error(data.message);
        _connectionErrors[self.url].name = data.name;
        self._connectionError = _connectionErrors[self.url];

        if (cb) { cb(self._connectionError); }

        return;
      }

      // connection success
      _connectionErrors[self.url] = null;

      if (cb) { cb(null, {success: true}); }

    }); 
  }

  join(room, cb) {
    if (cb == null) { cb = function(){}; }
    if (Array.from(this._joined).includes(room)) { return (typeof cb === 'function' ? cb() : undefined); }

    return this._socket.emit('join', {room}, err => {
      if (err) { return (typeof cb === 'function' ? cb(err) : undefined); }
      this._joined.push(room);
      return (typeof cb === 'function' ? cb(err) : undefined);
    });
  }

  send() {

    let args;
    const method = arguments[0];

    if (arguments.length === 1) { return this._send(method); }

    const cb = arguments[arguments.length - 1];

    if (cb.constructor.name === "Function") {
      args = [].slice.call(arguments, 1, arguments.length - 1);
      return this._send(method, args, cb);
    }

    args = [].slice.call(arguments, 1, arguments.length);
    return this._send(method, args);
  }

  _send(method, args, cb) {

    if (args == null) { args = []; }
    if (cb == null) { cb = function(){}; }
    if (this._connectionError) {
      return cb.apply(this, [this._connectionError]);
    }

    const requestId = this._requestId++;

    const self = this;

    const ack_cb = function() {
      cb.apply(this, arguments);

      delete self._requestCache[requestId];

    };

    const req = {
      method,
      args
    };

    this._socket.emit('apply', req, ack_cb);

    return this._requestCache[requestId] = {
      ack_cb,
      queued: this._disconnected
    };
  }
}


module.exports = Client;
