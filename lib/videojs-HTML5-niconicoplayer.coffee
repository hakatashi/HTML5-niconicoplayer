###! videojs-HTML5-niconicoplayer - v0.0.0 - 2015-1-19
# Copyright (c) 2015 Koki Takahashi
# Licensed under the MIT license.
###

defaults = option: true
HTML5Niconicoplayer = undefined

###*
# Initialize the plugin.
# @param options (optional) {object} configuration for the plugin
###
HTML5Niconicoplayer = (options) ->
  settings = videojs.util.mergeOptions(defaults, options)
  player = this

  player.ready ->
    player.play()

# register the plugin
videojs.plugin 'HTML5Niconicoplayer', HTML5Niconicoplayer
