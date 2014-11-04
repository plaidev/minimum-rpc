# minimum-rpc

a minimum rpc module.

## Installation

  Install with npm

    $ npm install minimum-rpc

  Install with [component(1)](http://component.io):

    $ component install nashibao/minimum-rpc

## API

```coffeescript
{Server, Client} = require('minimum-rpc')

# setup server
app = require("http").createServer()
io = require("socket.io")(app)
app.listen 2000, () ->
  console.log 'server listen start'
server = new Server(io)

# server api
server.set 'add', (a, b, cb) ->
  cb(null, a + b)

# setup client in (node|browser)
io = require('socket.io-client')
client = new Client io_for_client, {url: 'http://localhost:2000'}

# client api
client.send 'add', 1, 2, (err, val) ->
  assert not err
  assert val is 3

```


## License

  The MIT License (MIT)

  Copyright (c) 2014 <copyright holders>

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.