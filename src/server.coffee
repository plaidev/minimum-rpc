DEFAULT_NAME_SPACE = '__'


class Server

  constructor: (@io, methods={}, options={}) ->

    {name_space, connection, join_request} = options

    @methods = {}

    @name_space = name_space or DEFAULT_NAME_SPACE

    @connection = connection or (socket, cb) ->
      return cb null

    @join_request = join_request || (socket, auth_name, cb) ->
      return cb null

    @init()

  # new method
  set: (method_name, method) ->
    @methods[method_name] ?= {}
    @methods[method_name] = method

  get: (method_name) ->
    return @methods[method_name]

  join: (socket, auth_name) ->

    socket.join(auth_name)

    socket.on auth_name + '_apply', (req, ack_cb) =>

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

  # initialize
  init: ->

    @channel = @io.of('/' +   @name_space)

    @channel.on 'connection', (socket) =>

      joined = []

      @connection socket, (err) =>

        socket.on 'join', (req) =>

          auth_name = req.sub_name_space or req.auth_name

          return if not auth_name

          return if auth_name in joined

          @join_request socket, auth_name, (err) =>

            if err
              console.log 'sub namespace join failed', err
              return

            joined.push auth_name

            @join socket, auth_name

        return console.log 'connection error', err if err


module.exports = Server