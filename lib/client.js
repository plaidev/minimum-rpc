(function() {
  var Client;

  var _managers = {}; // for socket.io-client >= 1.4.x

  Client = (function() {
    function Client(io_or_socket, options) {
      if (options == null) {
        options = {};
      }
      this.url = options.url || '';
      this.name_space = options.name_space || '__';
      this.sub_name_space = options.sub_name_space || '__';
      this._socket = io_or_socket;
      if (io_or_socket.Manager) { // for socket.io-client >= 1.4.x
        var path = '/' + this.name_space;
        var uri = this.url;
        if (!(uri in _managers)) {
          _managers[uri] = io_or_socket.Manager(uri, options.connect_options);
        }
        this._socket = _managers[uri].socket(path);
      }
      else if (io_or_socket.constructor.name !== 'Socket') {
        this._socket = io_or_socket.connect(this.url + '/' + this.name_space, options.connect_options || {});
      }
    }

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
      return this._socket.emit(this.sub_name_space + '_apply', req, ack_cb);
    };

    return Client;

  })();

  module.exports = Client;

}).call(this);
