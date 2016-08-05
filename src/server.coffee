DEFAULT_NAME_SPACE = '__'
DEFAULT_SUB_NAME_SPACE = '__'


class Server

  constructor: (@io, methods={}, options={}) ->

    {name_space, connection, join_request} = options

    if DEFAULT_SUB_NAME_SPACE of methods
      @methods = methods
    else
      @methods = {}
      @methods[DEFAULT_SUB_NAME_SPACE] = methods or {}

    @name_space = name_space or DEFAULT_NAME_SPACE

    @connection = connection or (socket, cb) ->
      return cb null

    @join_request = join_request || (socket, sub_name_space, cb) ->
      return cb null

    @init()

  # new method
  set: (method_name, method, sub_name_space=DEFAULT_SUB_NAME_SPACE) ->
    @methods[sub_name_space] ?= {}
    @methods[sub_name_space][method_name] = method

  get: (method_name, sub_name_space=DEFAULT_SUB_NAME_SPACE) ->
    return @methods[sub_name_space]?[method_name]

  join: (socket, sub_name_space) ->

    socket.join(sub_name_space)

    socket.on sub_name_space + '_apply', (req, ack_cb) =>

      method = req.method
      args = req.args || []

      method = @methods[sub_name_space]?[method] or @methods[DEFAULT_SUB_NAME_SPACE]?[method]

      if not method?.apply?
        return ack_cb({message: 'cant find method.'})

      cb = =>
        ack_cb.apply(@, arguments)

      args.push cb

      args.push socket

      try

        method.apply(@methods[sub_name_space] or @methods[DEFAULT_SUB_NAME_SPACE], args)

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

          return if not req?.sub_name_space?

          return if req.sub_name_space in joined

          @join_request socket, req.sub_name_space, (err) =>

            if err
              console.log 'sub namespace join failed', err
              return

            joined.push req.sub_name_space

            @join socket, req.sub_name_space

        return console.log 'connection error', err if err


module.exports = Server