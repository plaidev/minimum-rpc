/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const DEFAULT_NAME_SPACE = '__';


class Server {

  constructor(io, methods, options) {

    this.io = io;
    if (methods == null) { methods = {}; }
    if (options == null) { options = {}; }
    const {name_space, connection, join} = options;

    this.methods = {};

    this.name_space = name_space || DEFAULT_NAME_SPACE;

    // for back compatibility
    if (options.sub_name_space) { this.name_space += `/${options.sub_name_space}`; }

    this.connection = connection || ((socket, cb) => cb(null));

    this.join = join || ((socket, room, cb) => cb(null));

    this.init();
  }

  // new method
  set(method_name, method) {
    return this.methods[method_name] = method;
  }

  get(method_name) {
    return this.methods[method_name];
  }

  _listen(socket) {

    socket.on('apply', (req, ack_cb) => {

      const { method } = req;
      const args = req.args || [];

      if (((this.methods[method] != null ? this.methods[method].apply : undefined) == null)) {
        return ack_cb({message: 'cant find method.'});
      }

      const cb = function() {
        return ack_cb.apply(this, arguments);
      }.bind(this);

      args.push(cb);

      args.push(socket);

      try {

        return this.methods[method].apply(this.methods, args);

      } catch (e) {

        console.log('cant apply args', e.stack);

        return ack_cb({message: e.message, name: e.name});
      }
    });

      // timeout?

    return socket.on('join', (req, ack_cb) => {

      const { room } = req;

      if (!room) { return; }

      return this.join(socket, room, err => {

        if (err) {
          console.log('join failed', err);
          return ack_cb({message: err.message, name: err.name});
        }

        return socket.join(room, function(err) {
          if (err) {
            console.log('socket.io join failed', err);
            return ack_cb({message: err.message, name: err.name});
          }

          return ack_cb.apply(this, arguments);
        }.bind(this));
      });
    });
  }

  // initialize
  init() {

    this.channel = this.io.of(`/${this.name_space}`);

    return this.channel.on('connection', socket => {

      return this.connection(socket, err => {

        if (err) {

          console.log('connection error', err);

          socket.emit('connection_ack', {error: true, message: err.message, name: err.name});

          socket.disconnect(true);

          return;
        }

        this._listen(socket);
        
        return socket.emit('connection_ack', {error: false});
    });
  });
  }
}



module.exports = Server;