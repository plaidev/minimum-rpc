DEFAULT_NAME_SPACE = '__'


class Server

  constructor: (@io, methods={}, options={}) ->

    {name_space, connection, join} = options

    @methods = {}

    @name_space = name_space or DEFAULT_NAME_SPACE

    # for back compatibility
    @name_space += '/' + options.sub_name_space if options.sub_name_space

    @connection = connection or (socket, cb) ->
      return cb null

    @join = join || (socket, room, cb) ->
      return cb null

    @init()

  # new method
  set: (method_name, method) ->
    @methods[method_name] = method

  get: (method_name) ->
    return @methods[method_name]

  _listen: (socket) ->

    socket.on 'apply', (req, ack_cb) =>

      method = req.method
      args = req.args || []

      if not @methods[method]?.apply?
        return ack_cb({message: 'cant find method.'})

      cb = =>
        ack_cb.apply(@, arguments)

      args.push cb

      args.push socket

      try

        @methods[method].apply(@methods, args)

      catch e

        console.log 'cant apply args', e.stack

        ack_cb({message: e.message, name: e.name})

      # timeout?

    socket.on 'join', (req, ack_cb) =>

      room = req.room

      return if not room

      @join socket, room, (err) =>

        if err
          console.log 'join failed', err
          return ack_cb({message: err.message, name: err.name})

        socket.join room, (err) =>
          if err
            console.log 'socket.io join failed', err
            return ack_cb({message: err.message, name: err.name})

          ack_cb.apply @, arguments

  # initialize
  init: ->

    @channel = @io.of('/' +   @name_space)

    @channel.on 'connection', (socket) =>

      @connection socket, (err) =>

        if err

          console.log 'connection error', err

          socket.emit 'connection_ack', {error: true, message: err.message, name: err.name}

          return

        @_listen(socket)
        
        socket.emit 'connection_ack', {error: false}



module.exports = Server