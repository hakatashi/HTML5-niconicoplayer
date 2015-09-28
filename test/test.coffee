###! videojs-HTML5-niconicoplayer - v0.0.0 - 2015-1-19
# Copyright (c) 2015 Koki Takahashi
# Licensed under the MIT license.
###

((window, videojs, Q) ->
	'use strict'
	realIsHtmlSupported = undefined
	player = undefined

	Q.module 'videojs-HTML5-niconicoplayer',
		setup: ->
			# force HTML support so the tests run in a reasonable
			# environment under phantomjs
			realIsHtmlSupported = videojs.Html5.isSupported

			videojs.Html5.isSupported = -> true

			# create a video element
			video = document.createElement('video')
			document.querySelector('#qunit-fixture').appendChild video
			# create a video.js player
			player = videojs(video)
			# initialize the plugin with the default options
			player.HTML5Niconicoplayer()

		teardown: ->
			videojs.Html5.isSupported = realIsHtmlSupported

	Q.test 'registers itself', ->
		Q.ok player.HTML5Niconicoplayer, 'registered the plugin'

) window, window.videojs, window.QUnit
