
class Server

  constructor: (@io, @methods={}, options={}) ->

    {name_space, connection, join_request, default_sub_name_space} = options

    @name_space = name_space or '__'

    @connection = connection or (socket, cb) ->
      return cb null

    @join_request = join_request || (socket, sub_name_space, cb) ->
      return cb null

    @default_sub_name_space = default_sub_name_space or '__'

    @init()

  # new method
  set: (method_name, method) ->
    @methods[method_name] = method

  get: (method_name) ->
    return @methods[method_name]

  join: (socket, sub_name_space) ->

    socket.join(sub_name_space)

    socket.on sub_name_space + '_apply', (req, ack_cb)=>

      method = req.method
      args = req.args || []

      if not @methods[method]?.apply?
        return ack_cb({message: 'cant find method.'})

      cb = ()=>
        ack_cb.apply(@, arguments)

      args.push cb

      args.push socket

      try

        @methods[method].apply(@methods, args)

      catch e

        console.log 'cant apply args', e.stack

        ack_cb({message: e.message, name: e.name})

  # initialize
  init: ->

    @channel = @io.of('/' +   @name_space)

    @channel.on 'connection', (socket) =>

      @join socket, @default_sub_name_space

      @connection socket, (err) =>

        socket.on 'join', (req) =>

          return if not req?.sub_name_space?

          return if not req.sub_name_space is @default_sub_name_space

          @join_request socket, req.sub_name_space, (err) =>

            if err
              console.log 'sub namespace join failed', err

            @join socket, req.sub_name_space

        return console.log 'connection error', err if err


module.exports = Server