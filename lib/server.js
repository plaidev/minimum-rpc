(function() {
  var Server;

  Server = (function() {
    function Server(io, methods, options) {
      var connection, default_sub_name_space, join_request, name_space;
      this.io = io;
      this.methods = methods != null ? methods : {};
      if (options == null) {
        options = {};
      }
      name_space = options.name_space, connection = options.connection, join_request = options.join_request, default_sub_name_space = options.default_sub_name_space;
      this.name_space = name_space || '__';
      this.connection = connection || function(socket, cb) {
        return cb(null);
      };
      this.join_request = join_request || function(socket, sub_name_space, cb) {
        return cb(null);
      };
      this.default_sub_name_space = default_sub_name_space || '__';
      this.init();
    }

    Server.prototype.set = function(method_name, method) {
      return this.methods[method_name] = method;
    };

    Server.prototype.get = function(method_name) {
      return this.methods[method_name];
    };

    Server.prototype.join = function(socket, sub_name_space) {
      socket.join(sub_name_space);
      return socket.on(sub_name_space + '_apply', (function(_this) {
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
    };

    Server.prototype.init = function() {
      this.channel = this.io.of('/' + this.name_space);
      return this.channel.on('connection', (function(_this) {
        return function(socket) {
          _this.join(socket, _this.default_sub_name_space);
          return _this.connection(socket, function(err) {
            socket.on('join', function(req) {
              if ((req != null ? req.sub_name_space : void 0) == null) {
                return;
              }
              if (!req.sub_name_space === _this.default_sub_name_space) {
                return;
              }
              return _this.join_request(socket, req.sub_name_space, function(err) {
                if (err) {
                  console.log('sub namespace join failed', err);
                }
                return _this.join(socket, req.sub_name_space);
              });
            });
            if (err) {
              return console.log('connection error', err);
            }
          });
        };
      })(this));
    };

    return Server;

  })();

  module.exports = Server;

}).call(this);
