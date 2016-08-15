(function() {
  var Client, _managers,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _managers = {};

  Client = (function() {
    function Client(io_or_socket, options) {
      var path, uri;
      if (options == null) {
        options = {};
      }
      this.url = options.url || '';
      this.name_space = options.name_space || '__';
      this._socket = io_or_socket;
      this._joined = [];
      if (io_or_socket.Manager != null) {
        path = '/' + this.name_space;
        uri = this.url;
        if (!(uri in _managers)) {
          _managers[uri] = io_or_socket.Manager(uri, options.connect_options);
        }
        this._socket = _managers[uri].socket(path);
        _managers[uri].on('reconnect', (function(_this) {
          return function() {
            var joined, room, _i, _len, _results;
            joined = _this._joined;
            _this._joined = [];
            _results = [];
            for (_i = 0, _len = joined.length; _i < _len; _i++) {
              room = joined[_i];
              _results.push(_this.join(room));
            }
            return _results;
          };
        })(this));
      } else if (io_or_socket.constructor.name !== 'Socket') {
        this._socket = io_or_socket.connect(this.url + '/' + this.name_space, options.connect_options || {});
      }
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
      var ack_cb, req;
      if (args == null) {
        args = [];
      }
      if (cb == null) {
        cb = function() {};
      }
      ack_cb = function() {
        return cb.apply(this, arguments);
      };
      req = {
        method: method,
        args: args
      };
      return this._socket.emit('apply', req, ack_cb);
    };

    return Client;

  })();

  module.exports = Client;

}).call(this);
