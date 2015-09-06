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

colors = [
  'white'
  'red'
  'pink'
  'orange'
  'yellow'
  'green'
  'cyan'
  'blue'
  'purple'
  'black'
]

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

    fixedComments = []

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
      , 100

      setInterval ->
        updateComment()
      , 33

      layoutComment = (chat, chatIndex) ->
        vpos = player.currentTime()
        videoWidth = player.width()

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
          commentEl.dataset.width = commentWidth
          commentEl.style.top = line * settings.commentHeight + 'px'
          commentEl.style.left = commentOffset + 'px'

          for color in colors
            if color in chat.styles
              commentEl.className += ' ' + color

          lineEndTimes[index] = chat.vpos / 100 + settings.commentPostTime

        if chat.vpos / 100 < vpos + settings.commentPreTime
          layoutedComment = Math.max layoutedComment, chatIndex

      layoutFixedComment = (chat, chatIndex) ->
        vpos = player.currentTime()
        videoWidth = player.width()
        videoHeight = player.height()

        if vpos - settings.commentTime < chat.vpos / 100 < vpos
          displayTime = vpos - chat.vpos / 100

          commentEl = document.createElement 'span'
          commentEl.className = 'vjs-niconico-comment fixed'
          commentEl.textContent = chat.text

          commentHeight = settings.commentHeight

          calcOverlap = (from, to) ->
            sum = 0

            for comment in fixedComments
              overlapFrom = Math.max from, comment.from
              overlapTo = Math.min to, comment.to

              if overlapFrom < overlapTo
                sum += overlapTo - overlapFrom

            return sum

          positionTop = null

          if 'ue' in chat.styles
            commentEl.className += ' ue'

            # Sort fixedComments out
            fixedComments.sort (a, b) -> a.to - b.to

            if calcOverlap(0, commentHeight) is 0
              positionTop = 0
            else
              overlaps = []
              for comment in fixedComments
                overlap = calcOverlap comment.to, comment.to + commentHeight
                overlaps.push overlap

                if comment.to + commentHeight <= videoHeight and overlap is 0
                  positionTop = comment.to
                  break

              if positionTop is null
                minOverlap = Infinity
                for overlap, index in overlaps
                  if overlap < minOverlap and fixedComments[index].to + commentHeight <= videoHeight
                    minOverlap = overlap
                    positionTop = fixedComments[index].to

                if positionTop is null
                  positionTop = 0

          else # shita
            commentEl.className += ' shita'

            # Sort fixedComments out
            fixedComments.sort (a, b) -> b.from - a.from

            if calcOverlap(videoHeight - commentHeight, videoHeight) is 0
              positionTop = videoHeight - commentHeight
            else
              overlaps = []
              for comment in fixedComments
                overlap = calcOverlap comment.from - commentHeight, comment.from
                overlaps.push overlap

                if comment.from - commentHeight >= 0 and overlap is 0
                  positionTop = comment.from - commentHeight
                  break

              if positionTop is null
                minOverlap = Infinity
                for overlap, index in overlaps
                  if overlap < minOverlap and fixedComments[index].from - commentHeight >= 0
                    minOverlap = overlap
                    positionTop = fixedComments[index].from - commentHeight

                if positionTop is null
                  positionTop = videoHeight - commentHeight

          commentEl.dataset.index = chatIndex
          commentEl.style.top = positionTop + 'px'

          for color in colors
            if color in chat.styles
              commentEl.className += ' ' + color

          commentAreaEl.appendChild commentEl

          fixedComments.push
            from: positionTop
            to: positionTop + commentHeight
            index: chatIndex

        if chat.vpos / 100 < vpos
          layoutedFixedComment = Math.max layoutedFixedComment, chatIndex

      layoutComments = ->
        commentAreaEl.innerHTML = ''
        lineEndTimes = (0 for i in [0...lineLength])

        layoutedComment = 0
        layoutedFixedComment = 0

        fixedComments = []

        for chat, index in chats
          if 'ue' in chat.styles or 'shita' in chat.styles
            layoutFixedComment chat, index
          else
            layoutComment chat, index

      updateComment = ->
        vpos = player.currentTime()
        videoWidth = player.width()

        removalPendingElements = []

        for commentEl in commentAreaEl.childNodes
          index = parseInt commentEl.dataset.index
          chat = chats[index]

          if 'ue' in chat.styles or 'shita' in chat.styles
            if chat.vpos / 100 < vpos - settings.commentTime
              removalPendingElements.push commentEl
              fixedComments = fixedComments.filter (comment) -> comment.index isnt index

          else
            if chat.vpos / 100 < vpos - settings.commentPostTime
              removalPendingElements.push commentEl
            else
              scrollTime = (vpos + settings.commentPreTime) - chat.vpos / 100
              commentWidth = parseInt commentEl.dataset.width
              scrollPath = videoWidth + commentWidth

              scrollOffset = scrollPath / settings.commentTime * scrollTime
              commentOffset = videoWidth - scrollOffset

              commentEl.style.left = commentOffset + 'px'

        for element in removalPendingElements
          element.parentNode.removeChild element

        for chat, index in chats
          if 'ue' in chat.styles or 'shita' in chat.styles
            if index > layoutedFixedComment
              layoutFixedComment chat, index
          else
            if index > layoutedComment
              layoutComment chat, index

      player.on 'seeked', ->
        layoutComments()

      layoutComments()
      window.layoutComments = layoutComments
      window.updateComment = updateComment

  return player

# register the plugin
videojs.plugin 'HTML5Niconicoplayer', HTML5Niconicoplayer
