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
	.pipe libs.sourcemaps.init()
	.pipe libs.browserify
		transform: ['coffeeify']
		extensions: ['.coffee']
		debug: true
	.pipe libs.rename 'index.js'
	.pipe libs.sourcemaps.write './'
	.pipe gulp.dest './build'

gulp.task 'copy-dist', ->
	gulp.src 'build/index.js'
	.pipe libs.header banner, pkg: pkg
	.pipe libs.rename 'HTML5-niconicoplayer.js'
	.pipe gulp.dest './dist'

gulp.task 'uglify-dist', ->
	gulp.src 'dist/HTML5-niconicoplayer.js'
	.pipe libs.sourcemaps.init loadMaps: true
	.pipe libs.uglify()
	.pipe libs.rename (path) -> path.extname = '.min.js'
	.pipe libs.sourcemaps.write './'
	.pipe gulp.dest './dist'

gulp.task 'dist', ['build', 'copy-dist', 'uglify-dist']

gulp.task 'default', ['build']
