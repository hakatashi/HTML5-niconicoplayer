gulp = require 'gulp'
libs = require('gulp-load-plugins')()
pkg = require './package.json'

banner = """
	/**
	 * <%= pkg.name %> - <%= pkg.description %>
	 * @version v<%= pkg.version %>
	 * @link <%= pkg.homepage %>
	 * @license <%= pkg.license %>
	 */

"""

gulp.task 'build', ->
	gulp.src 'lib/index.coffee', read: false
	.pipe libs.browserify
		transform: ['coffeeify']
		extensions: ['.coffee']
		debug: true
	.pipe libs.rename 'index.js'
	.pipe gulp.dest './build'

gulp.task 'task-dist', ->
	gulp.src 'build/index.js'
	.pipe libs.header banner, pkg: pkg
	.pipe libs.rename 'HTML5-niconicoplayer.js'
	.pipe gulp.dest './dist'
	.pipe libs.sourcemaps.init loadMaps: true
	.pipe libs.uglify()
	.pipe libs.rename (path) -> path.extname = '.min.js'
	.pipe libs.sourcemaps.write './'
	.pipe gulp.dest './dist'

gulp.task 'dist', ['build', 'task-dist']

gulp.task 'default', ['build']
