# Video.js Html5 Niconicoplayer

Video.js plugin to cope with niconico comment

## Getting Started

```html
<video id="video" class="video-js vjs-default-skin">
  <source src="video.mp4" type="video/mp4">
  <track kind="subtitles" src="comment.xml" srclang="ja" class="vjs-niconico-comment-file">
</video>
<div class="vjs-commentlist"></div>
<script src="path/to/video.js"></script>
<script src="path/to/HTML5-niconicoplayer.js"></script>
<script>
  videojs(document.querySelector('video')).HTML5Niconicoplayer({
    commentList: '.vjs-commentList'
  });
</script>
```

There's also a [working example](example.html) of the plugin you can check out if you're having trouble.

## Documentation

### Plugin Options

You may pass in an options object to the plugin upon initialization. This
object may contain any of the following properties:

  commentList: false
  commentTime: 4
  commentPreTime: 1
  commentHeight: 20
  commentFile: false

#### commentList

Type: `string` | `boolean`
Default: false

CSS path to the comment list area. Set false to disable comment list rendering.

#### commentTime

Type: `number`
Default: 4

The duration comments on the video appears (seconds).
This value contains `commentPreTime`.

#### commentPreTime

Type: `number`
Default: 1

The duration comments on the video appears before the exect comment time (seconds).

#### commentHeight

Type: `number`
Default: 20

The height of the comments on the video, which is used for the calculation of the
comment position.

Note: Any other style information can be specified by custom CSS.

#### commentFile

Type: `string`
Default: false

The file path to the comment file. Set false to enable automatic file detection from `<track>`.

## Release History

 - 0.1.0: Initial release
