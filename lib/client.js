(function() {
  var Client, _connectionErrors, _managers,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _managers = {};

  _connectionErrors = {};

  Client = (function() {
    function Client(io_or_socket, options, cb) {
      var path, self, uri;
      if (options == null) {
        options = {};
      }
      if (cb == null) {
        cb = null;
      }
      this.url = options.url || '';
      this.name_space = options.name_space || '__';
      this._socket = io_or_socket;
      this._joined = [];
      this._connectionError = null;
      if ((io_or_socket.Manager != null) && _connectionErrors[this.url]) {
        this._connectionError = _connectionErrors[this.url];
        if (cb) {
          setTimeout((function(_this) {
            return function() {
              return cb(_this._connectionError);
            };
          })(this), 0);
        }
        return;
      }
      this._requestId = 1;
      this._requestCache = {};
      this._disconnected = true;
      if (io_or_socket.Manager != null) {
        path = '/' + this.name_space;
        uri = this.url;
        if (!(uri in _managers)) {
          _managers[uri] = io_or_socket.Manager(uri, options.connect_options);
        }
        this._manager = _managers[uri];
        this._socket = this._manager.socket(path);
        this._socket.on('connect', (function(_this) {
          return function() {
            return _this._disconnected = false;
          };
        })(this));
        this._socket.on('disconnect', (function(_this) {
          return function() {
            return _this._disconnected = true;
          };
        })(this));
        this._socket.on('reconnect', (function(_this) {
          return function() {
            var ack_cb, err, joined, k, req, room, _i, _len, _ref, _ref1, _results;
            _this._disconnected = false;
            joined = _this._joined;
            _this._joined = [];
            for (_i = 0, _len = joined.length; _i < _len; _i++) {
              room = joined[_i];
              _this.join(room);
            }
            _ref = _this._requestCache;
            _results = [];
            for (k in _ref) {
              req = _ref[k];
              _ref1 = req, req = _ref1.req, ack_cb = _ref1.ack_cb;
              err = new Error('There is no chance of getting a response by the request');
              err.name = 'ResponseError';
              _results.push(ack_cb(err));
            }
            return _results;
          };
        })(this));
      } else if (io_or_socket.constructor.name !== 'Socket') {
        this._socket = io_or_socket.connect(this.url + '/' + this.name_space, options.connect_options || {});
      }
      if ((io_or_socket.Manager != null) && this.url in _connectionErrors) {
        if (cb) {
          cb(null, {
            success: true
          });
        }
        return;
      }
      self = this;
      this._socket.on('connection_ack', function(data) {
        if (data.error) {
          _connectionErrors[self.url] = new Error(data.message);
          _connectionErrors[self.url].name = data.name;
          self._connectionError = _connectionErrors[self.url];
          if (cb) {
            cb(self._connectionError);
          }
          return;
        }
        _connectionErrors[self.url] = null;
        if (cb) {
          cb(null, {
            success: true
          });
        }
      });
    }

    Client.prototype.join = function(room, cb) {
      if (cb == null) {
        cb = function() {};
      }
      if (__indexOf.call(this._joined, room) >= 0) {
        return typeof cb === "function" ? cb() : void 0;
      }
      return this._socket.emit('join', {
        room: room
      }, (function(_this) {
        return function(err) {
          if (err) {
            return typeof cb === "function" ? cb(err) : void 0;
          }
          _this._joined.push(room);
          return typeof cb === "function" ? cb(err) : void 0;
        };
      })(this));
    };

    Client.prototype.send = function() {
      var args, cb, method;
      method = arguments[0];
      if (arguments.length === 1) {
        return this._send(method);
      }
      cb = arguments[arguments.length - 1];
      if (cb.constructor.name === "Function") {
        args = [].slice.call(arguments, 1, arguments.length - 1);
        return this._send(method, args, cb);
      }
      args = [].slice.call(arguments, 1, arguments.length);
      return this._send(method, args);
    };

    Client.prototype._send = function(method, args, cb) {
      var ack_cb, req, requestId, self;
      if (args == null) {
        args = [];
      }
      if (cb == null) {
        cb = function() {};
      }
      if (this._connectionError) {
        return cb.apply(this, [this._connectionError]);
      }
      requestId = this._requestId++;
      self = this;
      ack_cb = function() {
        cb.apply(this, arguments);
        if (self._requestCache[requestId]) {
          delete self._requestCache[requestId];
        }
      };
      req = {
        method: method,
        args: args
      };
      this._socket.emit('apply', req, ack_cb);
      if (!this._disconnected) {
        return this._requestCache[requestId] = {
          req: req,
          ack_cb: ack_cb
        };
      }
    };

    return Client;

  })();

  module.exports = Client;

}).call(this);
