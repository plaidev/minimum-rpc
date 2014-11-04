;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("minimum-rpc/lib/index.js", function(exports, require, module){
(function() {
  module.exports = {
    server: require('./server'),
    client: require('./client')
  };

}).call(this);

});
require.register("minimum-rpc/lib/server.js", function(exports, require, module){
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
          _this.socket = socket;
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
            try {
              return _this.methods[method].apply(_this.methods, args);
            } catch (_error) {
              e = _error;
              return ack_cb({
                message: 'cant apply args.'
              });
            }
          });
        };
      })(this));
    };

    return Server;

  })();

  module.exports = Server;

}).call(this);

});
require.register("minimum-rpc/lib/client.js", function(exports, require, module){
(function() {
  var Client;

  Client = (function() {
    function Client(io_or_socket, options) {
      this.url = options.url || '';
      this.name_space = options.name_space || '__';
      this.sub_name_space = options.sub_name_space || '__';
      this._socket = io_or_socket;
      if (io_or_socket.constructor.name !== 'Socket') {
        this._socket = io_or_socket.connect(this.url + '/' + this.name_space);
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

});
require.alias("minimum-rpc/lib/index.js", "minimum-rpc/index.js");if (typeof exports == "object") {
  module.exports = require("minimum-rpc");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("minimum-rpc"); });
} else {
  this["minimum_rpc"] = require("minimum-rpc");
}})();