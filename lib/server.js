(function() {
  var DEFAULT_NAME_SPACE, DEFAULT_SUB_NAME_SPACE, Server,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  DEFAULT_NAME_SPACE = '__';

  DEFAULT_SUB_NAME_SPACE = '__';

  Server = (function() {
    function Server(io, methods, options) {
      var connection, join_request, name_space;
      this.io = io;
      if (methods == null) {
        methods = {};
      }
      if (options == null) {
        options = {};
      }
      name_space = options.name_space, connection = options.connection, join_request = options.join_request;
      if (DEFAULT_SUB_NAME_SPACE in methods) {
        this.methods = methods;
      } else {
        this.methods = {};
        this.methods[DEFAULT_SUB_NAME_SPACE] = methods || {};
      }
      this.name_space = name_space || DEFAULT_NAME_SPACE;
      this.connection = connection || function(socket, cb) {
        return cb(null);
      };
      this.join_request = join_request || function(socket, sub_name_space, cb) {
        return cb(null);
      };
      this.init();
    }

    Server.prototype.set = function(method_name, method, sub_name_space) {
      var _base;
      if (sub_name_space == null) {
        sub_name_space = DEFAULT_SUB_NAME_SPACE;
      }
      if ((_base = this.methods)[sub_name_space] == null) {
        _base[sub_name_space] = {};
      }
      return this.methods[sub_name_space][method_name] = method;
    };

    Server.prototype.get = function(method_name, sub_name_space) {
      var _ref;
      if (sub_name_space == null) {
        sub_name_space = DEFAULT_SUB_NAME_SPACE;
      }
      return (_ref = this.methods[sub_name_space]) != null ? _ref[method_name] : void 0;
    };

    Server.prototype.join = function(socket, sub_name_space) {
      socket.join(sub_name_space);
      return socket.on(sub_name_space + '_apply', (function(_this) {
        return function(req, ack_cb) {
          var args, cb, e, method, _ref, _ref1;
          method = req.method;
          args = req.args || [];
          if (((_ref = _this.methods[sub_name_space]) != null ? (_ref1 = _ref[method]) != null ? _ref1.apply : void 0 : void 0) == null) {
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
            return _this.methods[sub_name_space][method].apply(_this.methods[sub_name_space], args);
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
          var joined;
          joined = [];
          return _this.connection(socket, function(err) {
            socket.on('join', function(req) {
              var _ref;
              if ((req != null ? req.sub_name_space : void 0) == null) {
                return;
              }
              if (_ref = req.sub_name_space, __indexOf.call(joined, _ref) >= 0) {
                return;
              }
              return _this.join_request(socket, req.sub_name_space, function(err) {
                if (err) {
                  console.log('sub namespace join failed', err);
                  return;
                }
                joined.push(req.sub_name_space);
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
