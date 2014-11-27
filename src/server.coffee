
class Server

  constructor: (@io, @methods={}, options={}) ->

    @name_space = options.name_space || '__'

    @sub_name_space = options.sub_name_space || '__'

    @init()

  # new method
  set: (method_name, method) ->
    @methods[method_name] = method

  get: (method_name) ->
    return @methods[method_name]

  # initialize
  init: ()->

    @channel = @io.of('/' +   @name_space)

    @channel.on 'connection', (socket)=>

      socket.on @sub_name_space + '_apply', (req, ack_cb)=>

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

module.exports = Server