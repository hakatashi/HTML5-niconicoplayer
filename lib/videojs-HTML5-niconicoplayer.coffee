###! videojs-HTML5-niconicoplayer - v0.0.0 - 2015-1-19
# Copyright (c) 2015 Koki Takahashi
# Licensed under the MIT license.
###

find = require 'core-js/library/fn/array/find'
findIndex = require 'core-js/library/fn/array/find-index'

defaults =
  commentList: false
  commentTime: 4
  commentPreTime: 1
  commentHeight: 20

HTML5Niconicoplayer = undefined

###*
# Initialize the plugin.
# @param options (optional) {object} configuration for the plugin
###
HTML5Niconicoplayer = (options) ->
  settings = videojs.util.mergeOptions(defaults, options)
  player = this

  settings.commentPostTime = settings.commentTime - settings.commentPreTime

  commentLoaded = no

  if settings.commentList
    commentListEl = document.querySelector settings.commentList

  # Prepare elements
  contentEl = player.contentEl()
  videoEl = contentEl.querySelector 'video'
  trackEls = videoEl.querySelectorAll 'track'

  # Extract comment elements
  commentEls = []

  for trackEl in trackEls
    # TODO: IE compat
    if trackEl.classList.contains 'vjs-niconico-comment-file'
      commentEls.push trackEl

  if commentEls.length is 0
    throw new Error 'Niconico Comment file not found'

  commentFile = commentEls[0].getAttribute 'src'

  comments = null

  player.ready ->
    # Request comment
    xhr = new XMLHttpRequest()
    xhr.overrideMimeType 'text/xml'
    xhr.open 'GET', commentFile, true
    xhr.send()

    commentAreaEl = document.createElement 'div'
    commentAreaEl.className = 'vjs-niconico-comment-area'

    lineLength = Math.floor videoEl.offsetHeight / settings.commentHeight
    # Array of time currently layouted last comment disappears for each line
    lineEndTimes = (0 for i in [0...lineLength])

    layoutedComment = 0
    layoutedFixedComment = 0

    videoEl.parentNode.insertBefore commentAreaEl, videoEl.nextSibling

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
        chat.mail = chatEl.getAttribute 'mail'
        chat.styles = if chat.mail then chat.mail.split ' ' else []
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

          chat.listElement = commentEl

      scrollCommentTo = (index) ->
        if commentListEl
          chat = chats[index]
          scrollTop = chat.listElement.offsetTop - commentListEl.offsetTop - commentListEl.offsetHeight
          commentListEl.scrollTop = Math.max 0, scrollTop

      scrollCommentTime = (seconds) ->
        if commentListEl
          index = findIndex chats, (chat) -> chat.vpos > seconds * 100
          scrollCommentTo index

      setInterval ->
        if not player.paused()
          seconds = player.currentTime()
          scrollCommentTime seconds
          updateComment()
      , 100

      layoutComment = (chat, chatIndex) ->
        vpos = player.currentTime()
        videoWidth = videoEl.offsetWidth

        if vpos - settings.commentPostTime < chat.vpos / 100 < vpos + settings.commentPreTime
          scrollTime = (vpos + settings.commentPreTime) - chat.vpos / 100

          commentEl = document.createElement 'span'
          commentEl.className = 'vjs-niconico-comment'
          commentEl.textContent = chat.text

          # Append comment to measure width
          commentAreaEl.appendChild commentEl

          commentWidth = commentEl.offsetWidth
          scrollPath = videoWidth + commentWidth

          scrollOffset = scrollPath / settings.commentTime * scrollTime
          commentOffset = videoWidth - scrollOffset

          # Time when current comment touch to the left side of video
          disappearTime = chat.vpos / 100 - settings.commentPreTime + settings.commentTime / scrollPath * videoWidth

          paddingTimes = []
          line = null

          for time, index in lineEndTimes
            if time <= disappearTime
              line = index
              break
            else
              paddingTimes[index] = time - disappearTime

          if line is null
            minPadding = Infinity
            for time, index in paddingTimes
              if minPadding > time
                minPadding = time
                line = index

          commentEl.dataset.line = line
          commentEl.dataset.index = chatIndex
          commentEl.style.top = line * settings.commentHeight + 'px'
          commentEl.style.left = commentOffset + 'px'
          lineEndTimes[index] = chat.vpos / 100 + settings.commentPostTime

        if chat.vpos / 100 < vpos + settings.commentPreTime
          layoutedComment = Math.max layoutedComment, chatIndex

      layoutComments = ->
        commentAreaEl.innerHTML = ''
        lineEndTimes = (0 for i in [0...lineLength])

        layoutedComment = 0
        layoutedFixedComment = 0

        for chat, index in chats
          layoutComment chat, index

      updateComment = ->
        vpos = player.currentTime()
        videoWidth = videoEl.offsetWidth

        removalPendingElements = []

        for commentEl in commentAreaEl.childNodes
          chat = chats[commentEl.dataset.index]
          if chat.vpos / 100 < vpos - settings.commentPostTime
            removalPendingElements.push commentEl
          else
            scrollTime = (vpos + settings.commentPreTime) - chat.vpos / 100
            commentWidth = commentEl.offsetWidth
            scrollPath = videoWidth + commentWidth

            scrollOffset = scrollPath / settings.commentTime * scrollTime
            commentOffset = videoWidth - scrollOffset

            commentEl.style.left = commentOffset + 'px'

        for element in removalPendingElements
          element.parentNode.removeChild element

        offset = layoutedComment

        for chat, index in chats[offset + 1 ...]
          layoutComment chat, offset + 1 + index

      player.on 'seeked', ->
        layoutComments()

      layoutComments()
      window.layoutComments = layoutComments
      window.updateComment = updateComment

  return player

# register the plugin
videojs.plugin 'HTML5Niconicoplayer', HTML5Niconicoplayer
