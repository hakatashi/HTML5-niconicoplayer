gulp = require 'gulp'
libs = require('gulp-load-plugins')()

gulp.task 'build', ->
	gulp.src 'lib/index.coffee', read: false
	.pipe libs.browserify
		transform: ['coffeeify']
		extensions: ['.coffee']
	.pipe libs.rename 'HTML5-niconicoplayer.js'
	.pipe gulp.dest './build'

gulp.task 'default', ['build']
