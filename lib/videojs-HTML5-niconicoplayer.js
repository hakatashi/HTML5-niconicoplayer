/*! videojs-HTML5-niconicoplayer - v0.0.0 - 2015-1-19
 * Copyright (c) 2015 Koki Takahashi
 * Licensed under the MIT license. */
(function(window, videojs) {
  'use strict';

  var defaults = {
        option: true
      },
      HTML5Niconicoplayer;

  /**
   * Initialize the plugin.
   * @param options (optional) {object} configuration for the plugin
   */
  HTML5Niconicoplayer = function(options) {
    var settings = videojs.util.mergeOptions(defaults, options),
        player = this;

    // TODO: write some amazing plugin code
  };

  // register the plugin
  videojs.plugin('HTML5Niconicoplayer', HTML5Niconicoplayer);
})(window, window.videojs);
