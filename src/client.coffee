
_managers = {} # for socket.io-client >= 1.4.x

class Client
  constructor: (io_or_socket, options={}) ->

    @url = options.url || ''

    @name_space = options.name_space || '__'

    @room = options.room || '__'

    @_socket = io_or_socket

    @_joined = []

    # for socket.io-client >= 1.4.x
    if io_or_socket.Manager?
      path = '/' + @name_space
      uri = @url
      if not (uri of _managers)
        _managers[uri] = io_or_socket.Manager(uri, options.connect_options)
      @_socket = _managers[uri].socket(path)

    else if (io_or_socket.constructor.name isnt 'Socket')
      @_socket = io_or_socket.connect @url + '/' + @name_space, options.connect_options || {}

    @join @room

  join: (room) ->
    if not (room in @_joined)
      @_socket.emit 'join', {room}
      @_joined.push room

  send: () ->

    method = arguments[0]

    return @_send(method) if arguments.length == 1

    cb = arguments[arguments.length - 1]

    if cb.constructor.name is "Function"
      args = [].slice.call(arguments, 1, arguments.length - 1)
      return @_send(method, args, cb)

    args = [].slice.call(arguments, 1, arguments.length)
    return @_send(method, args)

  _send: (method, args=[], cb=()->) ->

    ack_cb = () ->
      return cb.apply(@, arguments)

    req = {
      method: method
      args: args
    }

    @_socket.emit 'apply', req, ack_cb

module.exports = Client
