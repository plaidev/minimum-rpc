(function() {
  var Server;

  Server = (function() {
    function Server(io, methods, options) {
      this.io = io;
      this.methods = methods != null ? methods : {};
      if (options == null) {
        options = {};
      }
      this.name_space = options.name_space || '__';
      this.sub_name_space = options.sub_name_space || '__';
      this.connection = options.connection || function(socket, cb) {
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

    Server.prototype.init = function() {
      this.channel = this.io.of('/' + this.name_space);
      return this.channel.on('connection', (function(_this) {
        return function(socket) {
          return _this.connection(socket, function(err) {
            if (err) {
              return console.log('connection error', err);
            }
            return socket.on(_this.sub_name_space + '_apply', function(req, ack_cb) {
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
            });
          });
        };
      })(this));
    };

    return Server;

  })();

  module.exports = Server;

}).call(this);
