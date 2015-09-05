###! videojs-HTML5-niconicoplayer - v0.0.0 - 2015-1-19
# Copyright (c) 2015 Koki Takahashi
# Licensed under the MIT license.
###

defaults =
  commentList: false

HTML5Niconicoplayer = undefined

###*
# Initialize the plugin.
# @param options (optional) {object} configuration for the plugin
###
HTML5Niconicoplayer = (options) ->
  settings = videojs.util.mergeOptions(defaults, options)
  player = this

  commentLoaded = no

  if settings.commentList
    commentListEl = document.querySelector settings.commentList

  # Prepare elements
  videoEl = player.contentEl()
  trackEls = videoEl.querySelectorAll 'track'

  # Extract comment elements
  commentEls = []

  for trackEl in trackEls
    # TODO: IE compat
    if trackEl.classList.contains 'vjs-niconico-comment'
      commentEls.push trackEl

  if commentEls.length is 0
    throw new Error 'Niconico Comment file not found'

  commentFile = commentEls[0].getAttribute 'src'

  comments = null

  player.ready ->
    player.play()

    # Request comment
    xhr = new XMLHttpRequest()
    xhr.overrideMimeType 'text/xml'
    xhr.open 'GET', commentFile, true
    xhr.send()

    xhr.onload = ->
      if xhr.status isnt 200
        throw new Error "Server responded with status code #{xhr.status}"

      if xhr.responseXML is null
        throw new Error "Comment file is broken"

      commentLoaded = true
      comments = xhr.responseXML

      packetEl = comments.querySelector 'packet'
      chatEls = packetEl.querySelectorAll 'chat'

      chats = []

      for chatEl in chatEls
        chat = {}
        chat.element = chatEl
        chat.text = chatEl.textContent
        chat.date = new Date parseInt(chatEl.getAttribute 'date') * 1000
        chat.thread = parseInt chatEl.getAttribute 'thread'
        chat.userId = chatEl.getAttribute 'user_id'
        chat.vpos = parseInt chatEl.getAttribute 'vpos'

        chats.push chat

      chats.sort (a, b) -> a.vpos - b.vpos

      if commentListEl
        for chat in chats
          commentEl = document.createElement 'div'
          commentEl.className = 'vjs-comment'

          commentListEl.appendChild commentEl

          commentTextEl = document.createElement 'div'
          commentTextEl.className = 'vjs-comment-text'
          commentTextEl.textContent = chat.text

          commentEl.appendChild commentTextEl

          minutes = ('00' + Math.floor(chat.vpos / 6000))[-2...]
          seconds = ('00' + Math.floor(chat.vpos / 100) % 60)[-2...]
          centiSeconds = ('00' + Math.floor(chat.vpos) % 6000)[-2...]

          commentTimeEl = document.createElement 'div'
          commentTimeEl.className = 'vjs-comment-time'
          commentTimeEl.textContent = "#{minutes}:#{seconds}.#{centiSeconds}"

          commentEl.appendChild commentTimeEl

  return player

# register the plugin
videojs.plugin 'HTML5Niconicoplayer', HTML5Niconicoplayer
