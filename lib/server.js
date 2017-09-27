(function() {
  var DEFAULT_NAME_SPACE, Server;

  DEFAULT_NAME_SPACE = '__';

  Server = (function() {
    function Server(io, methods, options) {
      var connection, join, name_space;
      this.io = io;
      if (methods == null) {
        methods = {};
      }
      if (options == null) {
        options = {};
      }
      name_space = options.name_space, connection = options.connection, join = options.join;
      this.methods = {};
      this.name_space = name_space || DEFAULT_NAME_SPACE;
      if (options.sub_name_space) {
        this.name_space += '/' + options.sub_name_space;
      }
      this.connection = connection || function(socket, cb) {
        return cb(null);
      };
      this.join = join || function(socket, room, cb) {
        return cb(null);
      };
      this.init();
    }

    Server.prototype.set = function(method_name, method) {
      return this.methods[method_name] = method;
    };

    Server.prototype.get = function(method_name) {
      return this.methods[method_name];
    };

    Server.prototype._listen = function(socket) {
      socket.on('apply', (function(_this) {
        return function(req, ack_cb) {
          var args, cb, e, method, _ref;
          method = req.method;
          args = req.args || [];
          if (((_ref = _this.methods[method]) != null ? _ref.apply : void 0) == null) {
            return ack_cb({
              message: 'cant find method.'
            });
          }
          cb = function() {
            return ack_cb.apply(_this, arguments);
          };
          args.push(cb);
          args.push(socket);
          try {
            return _this.methods[method].apply(_this.methods, args);
          } catch (_error) {
            e = _error;
            console.log('cant apply args', e.stack);
            return ack_cb({
              message: e.message,
              name: e.name
            });
          }
        };
      })(this));
      return socket.on('join', (function(_this) {
        return function(req, ack_cb) {
          var room;
          room = req.room;
          if (!room) {
            return;
          }
          return _this.join(socket, room, function(err) {
            if (err) {
              console.log('join failed', err);
              return ack_cb({
                message: err.message,
                name: err.name
              });
            }
            return socket.join(room, function(err) {
              if (err) {
                console.log('socket.io join failed', err);
                return ack_cb({
                  message: err.message,
                  name: err.name
                });
              }
              return ack_cb.apply(_this, arguments);
            });
          });
        };
      })(this));
    };

    Server.prototype.init = function() {
      this.channel = this.io.of('/' + this.name_space);
      return this.channel.on('connection', (function(_this) {
        return function(socket) {
          return _this.connection(socket, function(err) {
            if (err) {
              console.log('connection error', err);
              socket.emit('connection_ack', {
                error: true,
                message: err.message,
                name: err.name
              });
              socket.disconnect(true);
              return;
            }
            _this._listen(socket);
            return socket.emit('connection_ack', {
              error: false
            });
          });
        };
      })(this));
    };

    return Server;

  })();

  module.exports = Server;

}).call(this);
