(function() {
  var Client;

  Client = (function() {
    function Client(io_or_socket, options) {
      if (options == null) {
        options = {};
      }
      this.url = options.url || '';
      this.name_space = options.name_space || '__';
      this.sub_name_space = options.sub_name_space || '__';
      this._socket = io_or_socket;
      if (io_or_socket.constructor.name !== 'Socket') {
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
