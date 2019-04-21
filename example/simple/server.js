/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const {Server} = require('../..');

const app = require("http").createServer();
const io = require("socket.io")(app);
app.listen(2000, () => console.log('server listen start'));

const server = new Server(io, {
  add(a, b, cb) {
    return cb(null, a + b);
  }
});
