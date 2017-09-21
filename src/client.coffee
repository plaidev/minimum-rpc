
_managers = {} # for socket.io-client >= 1.4.x
_connectionErrors = {}

class Client
  constructor: (io_or_socket, options={}, cb=null) ->

    @url = options.url || ''

    @name_space = options.name_space || '__'

    @_socket = io_or_socket

    @_joined = []

    @_connectionError = null


    if io_or_socket.Manager? and _connectionErrors[@url]

      @_connectionError = _connectionErrors[@url]

      if cb
        setTimeout =>
          cb @_connectionError
        , 0
      return

    # for socket.io-client >= 1.4.x
    if io_or_socket.Manager?
      path = '/' + @name_space
      uri = @url
      if not (uri of _managers)
        _managers[uri] = io_or_socket.Manager(uri, options.connect_options)

      @_manager = _managers[uri]

      @_socket = @_manager.socket(path)

      @_socket.on 'reconnect', =>

        joined = @_joined

        @_joined = []

        for room in joined

          @join room

    else if (io_or_socket.constructor.name isnt 'Socket')
      @_socket = io_or_socket.connect @url + '/' + @name_space, options.connect_options || {}

    # not error, but connection acked
    if io_or_socket.Manager? and @url of _connectionErrors
      cb null, {success: true} if cb
      return

    self = @

    @_socket.on 'connection_ack', (data) ->

      if data.error

        _connectionErrors[self.url] = new Error(data.message)
        _connectionErrors[self.url].name = data.name
        self._connectionError = _connectionErrors[self.url]

        cb self._connectionError if cb

        return

      # connection success
      _connectionErrors[self.url] = null

      cb null, {success: true} if cb

      return 

  join: (room, cb=()->) ->
    return cb?() if room in @_joined

    @_socket.emit 'join', {room}, (err) =>
      return cb?(err) if err
      @_joined.push room
      cb?(err)

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

    if @_connectionError
      return cb.apply(@, [@_connectionError])

    ack_cb = () ->
      return cb.apply(@, arguments)

    req = {
      method: method
      args: args
    }

    @_socket.emit 'apply', req, ack_cb

module.exports = Client
