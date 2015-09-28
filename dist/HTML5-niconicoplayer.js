/**
 * videojs-html5-niconicoplayer - Video.js plugin to cope with niconico comment
 * @version v0.0.1
 * @link https://github.com/hakatashi/HTML5-niconicoplayer#readme
 * @license MIT
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/*!
 * videojs-HTML5-niconicoplayer - v0.0.0 - 2015-1-19
 * Copyright (c) 2015 Koki Takahashi
 * Licensed under the MIT license.
 */
var HTML5Niconicoplayer, colors, defaults, find, findIndex,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

find = require('core-js/library/fn/array/find');

findIndex = require('core-js/library/fn/array/find-index');

defaults = {
  commentList: false,
  commentTime: 4,
  commentPreTime: 1,
  commentHeight: 20,
  commentFile: false
};

colors = ['white', 'red', 'pink', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'black'];

HTML5Niconicoplayer = void 0;


/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */

HTML5Niconicoplayer = function(options) {
  var commentEls, commentFile, commentListEl, commentLoaded, comments, contentEl, j, len, player, settings, trackEl, trackEls, videoEl;
  settings = videojs.util.mergeOptions(defaults, options);
  player = this;
  settings.commentPostTime = settings.commentTime - settings.commentPreTime;
  commentLoaded = false;
  if (settings.commentList) {
    commentListEl = document.querySelector(settings.commentList);
  }
  contentEl = player.contentEl();
  videoEl = contentEl.querySelector('video') || contentEl.querySelector('iframe');
  if (settings.commentFile) {
    commentFile = settings.commentFile;
  } else {
    trackEls = videoEl.querySelectorAll('track');
    commentEls = [];
    for (j = 0, len = trackEls.length; j < len; j++) {
      trackEl = trackEls[j];
      if (trackEl.classList.contains('vjs-niconico-comment-file')) {
        commentEls.push(trackEl);
      }
    }
    if (commentEls.length === 0) {
      throw new Error('Niconico Comment file not found');
    }
    commentFile = commentEls[0].getAttribute('src');
  }
  comments = null;
  player.ready(function() {
    var commentAreaEl, fixedComments, i, layoutedComment, layoutedFixedComment, lineEndTimes, lineLength, xhr;
    xhr = new XMLHttpRequest();
    xhr.overrideMimeType('text/xml');
    xhr.open('GET', commentFile, true);
    xhr.send();
    commentAreaEl = document.createElement('div');
    commentAreaEl.className = 'vjs-niconico-comment-area';
    lineLength = Math.floor(videoEl.offsetHeight / settings.commentHeight);
    lineEndTimes = (function() {
      var k, ref, results;
      results = [];
      for (i = k = 0, ref = lineLength; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        results.push(0);
      }
      return results;
    })();
    layoutedComment = 0;
    layoutedFixedComment = 0;
    fixedComments = [];
    videoEl.parentNode.insertBefore(commentAreaEl, videoEl.nextSibling);
    return xhr.onload = function() {
      var centiSeconds, chat, chatEl, chatEls, chats, commentEl, commentTextEl, commentTimeEl, k, l, layoutComment, layoutComments, layoutFixedComment, len1, len2, minutes, packetEl, scrollCommentTime, scrollCommentTo, seconds, updateComment;
      if (xhr.status !== 200) {
        throw new Error("Server responded with status code " + xhr.status);
      }
      if (xhr.responseXML === null) {
        throw new Error("Comment file is broken");
      }
      commentLoaded = true;
      comments = xhr.responseXML;
      packetEl = comments.querySelector('packet');
      chatEls = packetEl.querySelectorAll('chat');
      chats = [];
      for (k = 0, len1 = chatEls.length; k < len1; k++) {
        chatEl = chatEls[k];
        chat = {};
        chat.element = chatEl;
        chat.text = chatEl.textContent;
        chat.date = new Date(parseInt(chatEl.getAttribute('date')) * 1000);
        chat.thread = parseInt(chatEl.getAttribute('thread'));
        chat.userId = chatEl.getAttribute('user_id');
        chat.mail = chatEl.getAttribute('mail');
        chat.styles = chat.mail ? chat.mail.split(' ') : [];
        chat.vpos = parseInt(chatEl.getAttribute('vpos'));
        chats.push(chat);
      }
      chats.sort(function(a, b) {
        return a.vpos - b.vpos;
      });
      if (commentListEl) {
        for (l = 0, len2 = chats.length; l < len2; l++) {
          chat = chats[l];
          commentEl = document.createElement('div');
          commentEl.className = 'vjs-comment';
          commentListEl.appendChild(commentEl);
          commentTextEl = document.createElement('div');
          commentTextEl.className = 'vjs-comment-text';
          commentTextEl.textContent = chat.text;
          commentEl.appendChild(commentTextEl);
          minutes = ('00' + Math.floor(chat.vpos / 6000)).slice(-2);
          seconds = ('00' + Math.floor(chat.vpos / 100) % 60).slice(-2);
          centiSeconds = ('00' + Math.floor(chat.vpos) % 6000).slice(-2);
          commentTimeEl = document.createElement('div');
          commentTimeEl.className = 'vjs-comment-time';
          commentTimeEl.textContent = minutes + ":" + seconds + "." + centiSeconds;
          commentEl.appendChild(commentTimeEl);
          chat.listElement = commentEl;
        }
      }
      scrollCommentTo = function(index) {
        var scrollTop;
        if (commentListEl) {
          chat = chats[index];
          scrollTop = chat.listElement.offsetTop - commentListEl.offsetTop - commentListEl.offsetHeight;
          return commentListEl.scrollTop = Math.max(0, scrollTop);
        }
      };
      scrollCommentTime = function(seconds) {
        var index;
        if (commentListEl) {
          index = findIndex(chats, function(chat) {
            return chat.vpos > seconds * 100;
          });
          return scrollCommentTo(index);
        }
      };
      setInterval(function() {
        if (!player.paused()) {
          seconds = player.currentTime();
          return scrollCommentTime(seconds);
        }
      }, 100);
      setInterval(function() {
        return updateComment();
      }, 33);
      layoutComment = function(chat, chatIndex) {
        var color, commentOffset, commentWidth, disappearTime, index, len3, len4, len5, line, m, minPadding, n, o, paddingTimes, ref, scrollOffset, scrollPath, scrollTime, time, videoWidth, vpos;
        vpos = player.currentTime();
        videoWidth = player.width();
        if ((vpos - settings.commentPostTime < (ref = chat.vpos / 100) && ref < vpos + settings.commentPreTime)) {
          scrollTime = (vpos + settings.commentPreTime) - chat.vpos / 100;
          commentEl = document.createElement('span');
          commentEl.className = 'vjs-niconico-comment';
          commentEl.textContent = chat.text;
          commentAreaEl.appendChild(commentEl);
          commentWidth = commentEl.offsetWidth;
          scrollPath = videoWidth + commentWidth;
          scrollOffset = scrollPath / settings.commentTime * scrollTime;
          commentOffset = videoWidth - scrollOffset;
          disappearTime = chat.vpos / 100 - settings.commentPreTime + settings.commentTime / scrollPath * videoWidth;
          paddingTimes = [];
          line = null;
          for (index = m = 0, len3 = lineEndTimes.length; m < len3; index = ++m) {
            time = lineEndTimes[index];
            if (time <= disappearTime) {
              line = index;
              break;
            } else {
              paddingTimes[index] = time - disappearTime;
            }
          }
          if (line === null) {
            minPadding = Infinity;
            for (index = n = 0, len4 = paddingTimes.length; n < len4; index = ++n) {
              time = paddingTimes[index];
              if (minPadding > time) {
                minPadding = time;
                line = index;
              }
            }
          }
          commentEl.dataset.line = line;
          commentEl.dataset.index = chatIndex;
          commentEl.dataset.width = commentWidth;
          commentEl.style.top = line * settings.commentHeight + 'px';
          commentEl.style.left = commentOffset + 'px';
          for (o = 0, len5 = colors.length; o < len5; o++) {
            color = colors[o];
            if (indexOf.call(chat.styles, color) >= 0) {
              commentEl.className += ' ' + color;
            }
          }
          lineEndTimes[index] = chat.vpos / 100 + settings.commentPostTime;
        }
        if (chat.vpos / 100 < vpos + settings.commentPreTime) {
          return layoutedComment = Math.max(layoutedComment, chatIndex);
        }
      };
      layoutFixedComment = function(chat, chatIndex) {
        var calcOverlap, color, comment, commentHeight, displayTime, index, len3, len4, len5, len6, len7, m, minOverlap, n, o, overlap, overlaps, p, positionTop, q, ref, videoHeight, videoWidth, vpos;
        vpos = player.currentTime();
        videoWidth = player.width();
        videoHeight = player.height();
        if ((vpos - settings.commentTime < (ref = chat.vpos / 100) && ref < vpos)) {
          displayTime = vpos - chat.vpos / 100;
          commentEl = document.createElement('span');
          commentEl.className = 'vjs-niconico-comment fixed';
          commentEl.textContent = chat.text;
          commentHeight = settings.commentHeight;
          calcOverlap = function(from, to) {
            var comment, len3, m, overlapFrom, overlapTo, sum;
            sum = 0;
            for (m = 0, len3 = fixedComments.length; m < len3; m++) {
              comment = fixedComments[m];
              overlapFrom = Math.max(from, comment.from);
              overlapTo = Math.min(to, comment.to);
              if (overlapFrom < overlapTo) {
                sum += overlapTo - overlapFrom;
              }
            }
            return sum;
          };
          positionTop = null;
          if (indexOf.call(chat.styles, 'ue') >= 0) {
            commentEl.className += ' ue';
            fixedComments.sort(function(a, b) {
              return a.to - b.to;
            });
            if (calcOverlap(0, commentHeight) === 0) {
              positionTop = 0;
            } else {
              overlaps = [];
              for (m = 0, len3 = fixedComments.length; m < len3; m++) {
                comment = fixedComments[m];
                overlap = calcOverlap(comment.to, comment.to + commentHeight);
                overlaps.push(overlap);
                if (comment.to + commentHeight <= videoHeight && overlap === 0) {
                  positionTop = comment.to;
                  break;
                }
              }
              if (positionTop === null) {
                minOverlap = Infinity;
                for (index = n = 0, len4 = overlaps.length; n < len4; index = ++n) {
                  overlap = overlaps[index];
                  if (overlap < minOverlap && fixedComments[index].to + commentHeight <= videoHeight) {
                    minOverlap = overlap;
                    positionTop = fixedComments[index].to;
                  }
                }
                if (positionTop === null) {
                  positionTop = 0;
                }
              }
            }
          } else {
            commentEl.className += ' shita';
            fixedComments.sort(function(a, b) {
              return b.from - a.from;
            });
            if (calcOverlap(videoHeight - commentHeight, videoHeight) === 0) {
              positionTop = videoHeight - commentHeight;
            } else {
              overlaps = [];
              for (o = 0, len5 = fixedComments.length; o < len5; o++) {
                comment = fixedComments[o];
                overlap = calcOverlap(comment.from - commentHeight, comment.from);
                overlaps.push(overlap);
                if (comment.from - commentHeight >= 0 && overlap === 0) {
                  positionTop = comment.from - commentHeight;
                  break;
                }
              }
              if (positionTop === null) {
                minOverlap = Infinity;
                for (index = p = 0, len6 = overlaps.length; p < len6; index = ++p) {
                  overlap = overlaps[index];
                  if (overlap < minOverlap && fixedComments[index].from - commentHeight >= 0) {
                    minOverlap = overlap;
                    positionTop = fixedComments[index].from - commentHeight;
                  }
                }
                if (positionTop === null) {
                  positionTop = videoHeight - commentHeight;
                }
              }
            }
          }
          commentEl.dataset.index = chatIndex;
          commentEl.style.top = positionTop + 'px';
          for (q = 0, len7 = colors.length; q < len7; q++) {
            color = colors[q];
            if (indexOf.call(chat.styles, color) >= 0) {
              commentEl.className += ' ' + color;
            }
          }
          commentAreaEl.appendChild(commentEl);
          fixedComments.push({
            from: positionTop,
            to: positionTop + commentHeight,
            index: chatIndex
          });
        }
        if (chat.vpos / 100 < vpos) {
          return layoutedFixedComment = Math.max(layoutedFixedComment, chatIndex);
        }
      };
      layoutComments = function() {
        var index, len3, m, results;
        commentAreaEl.innerHTML = '';
        lineEndTimes = (function() {
          var m, ref, results;
          results = [];
          for (i = m = 0, ref = lineLength; 0 <= ref ? m < ref : m > ref; i = 0 <= ref ? ++m : --m) {
            results.push(0);
          }
          return results;
        })();
        layoutedComment = 0;
        layoutedFixedComment = 0;
        fixedComments = [];
        results = [];
        for (index = m = 0, len3 = chats.length; m < len3; index = ++m) {
          chat = chats[index];
          if (indexOf.call(chat.styles, 'ue') >= 0 || indexOf.call(chat.styles, 'shita') >= 0) {
            results.push(layoutFixedComment(chat, index));
          } else {
            results.push(layoutComment(chat, index));
          }
        }
        return results;
      };
      updateComment = function() {
        var commentOffset, commentWidth, element, index, len3, len4, len5, m, n, o, ref, removalPendingElements, results, scrollOffset, scrollPath, scrollTime, videoWidth, vpos;
        vpos = player.currentTime();
        videoWidth = player.width();
        removalPendingElements = [];
        ref = commentAreaEl.childNodes;
        for (m = 0, len3 = ref.length; m < len3; m++) {
          commentEl = ref[m];
          index = parseInt(commentEl.dataset.index);
          chat = chats[index];
          if (indexOf.call(chat.styles, 'ue') >= 0 || indexOf.call(chat.styles, 'shita') >= 0) {
            if (chat.vpos / 100 < vpos - settings.commentTime) {
              removalPendingElements.push(commentEl);
              fixedComments = fixedComments.filter(function(comment) {
                return comment.index !== index;
              });
            }
          } else {
            if (chat.vpos / 100 < vpos - settings.commentPostTime) {
              removalPendingElements.push(commentEl);
            } else {
              scrollTime = (vpos + settings.commentPreTime) - chat.vpos / 100;
              commentWidth = parseInt(commentEl.dataset.width);
              scrollPath = videoWidth + commentWidth;
              scrollOffset = scrollPath / settings.commentTime * scrollTime;
              commentOffset = videoWidth - scrollOffset;
              commentEl.style.left = commentOffset + 'px';
            }
          }
        }
        for (n = 0, len4 = removalPendingElements.length; n < len4; n++) {
          element = removalPendingElements[n];
          element.parentNode.removeChild(element);
        }
        results = [];
        for (index = o = 0, len5 = chats.length; o < len5; index = ++o) {
          chat = chats[index];
          if (indexOf.call(chat.styles, 'ue') >= 0 || indexOf.call(chat.styles, 'shita') >= 0) {
            if (index > layoutedFixedComment) {
              results.push(layoutFixedComment(chat, index));
            } else {
              results.push(void 0);
            }
          } else {
            if (index > layoutedComment) {
              results.push(layoutComment(chat, index));
            } else {
              results.push(void 0);
            }
          }
        }
        return results;
      };
      player.on('seeked', function() {
        return layoutComments();
      });
      layoutComments();
      window.layoutComments = layoutComments;
      return window.updateComment = updateComment;
    };
  });
  return player;
};

videojs.plugin('HTML5Niconicoplayer', HTML5Niconicoplayer);



},{"core-js/library/fn/array/find":3,"core-js/library/fn/array/find-index":2}],2:[function(require,module,exports){
require('../../modules/es6.array.find-index');
module.exports = require('../../modules/$.core').Array.findIndex;
},{"../../modules/$.core":7,"../../modules/es6.array.find-index":17}],3:[function(require,module,exports){
require('../../modules/es6.array.find');
module.exports = require('../../modules/$.core').Array.find;
},{"../../modules/$.core":7,"../../modules/es6.array.find":18}],4:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],5:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = require('./$.ctx')
  , IObject  = require('./$.iobject')
  , toObject = require('./$.to-object')
  , toLength = require('./$.to-length');
module.exports = function(TYPE){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? Array(length) : IS_FILTER ? [] : undefined
      , val, res;
    for(;length > index; index++)if(NO_HOLES || index in self){
      val = self[index];
      res = f(val, index, O);
      if(TYPE){
        if(IS_MAP)result[index] = res;            // map
        else if(res)switch(TYPE){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(IS_EVERY)return false;          // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};
},{"./$.ctx":8,"./$.iobject":12,"./$.to-length":14,"./$.to-object":15}],6:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],7:[function(require,module,exports){
var core = module.exports = {};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],8:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  } return function(/* ...args */){
      return fn.apply(that, arguments);
    };
};
},{"./$.a-function":4}],9:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , PROTOTYPE = 'prototype';
var ctx = function(fn, that){
  return function(){
    return fn.apply(that, arguments);
  };
};
var $def = function(type, name, source){
  var key, own, out, exp
    , isGlobal = type & $def.G
    , isProto  = type & $def.P
    , target   = isGlobal ? global : type & $def.S
        ? global[name] : (global[name] || {})[PROTOTYPE]
    , exports  = isGlobal ? core : core[name] || (core[name] = {});
  if(isGlobal)source = name;
  for(key in source){
    // contains in native
    own = !(type & $def.F) && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    if(isGlobal && typeof target[key] != 'function')exp = source[key];
    // bind timers to global for call from export context
    else if(type & $def.B && own)exp = ctx(out, global);
    // wrap global constructors for prevent change them in library
    else if(type & $def.W && target[key] == out)!function(C){
      exp = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      exp[PROTOTYPE] = C[PROTOTYPE];
    }(out);
    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export
    exports[key] = exp;
    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$def.F = 1;  // forced
$def.G = 2;  // global
$def.S = 4;  // static
$def.P = 8;  // proto
$def.B = 16; // bind
$def.W = 32; // wrap
module.exports = $def;
},{"./$.core":7,"./$.global":11}],10:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],11:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var UNDEFINED = 'undefined';
var global = module.exports = typeof window != UNDEFINED && window.Math == Math
  ? window : typeof self != UNDEFINED && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],12:[function(require,module,exports){
// indexed object, fallback for non-array-like ES3 strings
var cof = require('./$.cof');
module.exports = 0 in Object('z') ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":6}],13:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],14:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":13}],15:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":10}],16:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],17:[function(require,module,exports){
'use strict';
// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
var KEY    = 'findIndex'
  , $def   = require('./$.def')
  , forced = true
  , $find  = require('./$.array-methods')(6);
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$def($def.P + $def.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments[1]);
  }
});
require('./$.unscope')(KEY);
},{"./$.array-methods":5,"./$.def":9,"./$.unscope":16}],18:[function(require,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var KEY    = 'find'
  , $def   = require('./$.def')
  , forced = true
  , $find  = require('./$.array-methods')(5);
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$def($def.P + $def.F * forced, 'Array', {
  find: function find(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments[1]);
  }
});
require('./$.unscope')(KEY);
},{"./$.array-methods":5,"./$.def":9,"./$.unscope":16}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcaGFrYXRhc2hpXFxEb2N1bWVudHNcXEdpdEh1YlxcSFRNTDUtbmljb25pY29wbGF5ZXJcXG5vZGVfbW9kdWxlc1xcZ3VscC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkM6XFxVc2Vyc1xcaGFrYXRhc2hpXFxEb2N1bWVudHNcXEdpdEh1YlxcSFRNTDUtbmljb25pY29wbGF5ZXJcXGxpYlxcaW5kZXguY29mZmVlIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9hcnJheS9maW5kLWluZGV4LmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9mbi9hcnJheS9maW5kLmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuYS1mdW5jdGlvbi5qcyIsIkM6L1VzZXJzL2hha2F0YXNoaS9Eb2N1bWVudHMvR2l0SHViL0hUTUw1LW5pY29uaWNvcGxheWVyL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmFycmF5LW1ldGhvZHMuanMiLCJDOi9Vc2Vycy9oYWthdGFzaGkvRG9jdW1lbnRzL0dpdEh1Yi9IVE1MNS1uaWNvbmljb3BsYXllci9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb2YuanMiLCJDOi9Vc2Vycy9oYWthdGFzaGkvRG9jdW1lbnRzL0dpdEh1Yi9IVE1MNS1uaWNvbmljb3BsYXllci9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC5jb3JlLmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuY3R4LmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVmLmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQuZGVmaW5lZC5qcyIsIkM6L1VzZXJzL2hha2F0YXNoaS9Eb2N1bWVudHMvR2l0SHViL0hUTUw1LW5pY29uaWNvcGxheWVyL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmdsb2JhbC5qcyIsIkM6L1VzZXJzL2hha2F0YXNoaS9Eb2N1bWVudHMvR2l0SHViL0hUTUw1LW5pY29uaWNvcGxheWVyL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy8kLmlvYmplY3QuanMiLCJDOi9Vc2Vycy9oYWthdGFzaGkvRG9jdW1lbnRzL0dpdEh1Yi9IVE1MNS1uaWNvbmljb3BsYXllci9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvJC50by1pbnRlZ2VyLmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8tbGVuZ3RoLmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudG8tb2JqZWN0LmpzIiwiQzovVXNlcnMvaGFrYXRhc2hpL0RvY3VtZW50cy9HaXRIdWIvSFRNTDUtbmljb25pY29wbGF5ZXIvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzLyQudW5zY29wZS5qcyIsIkM6L1VzZXJzL2hha2F0YXNoaS9Eb2N1bWVudHMvR2l0SHViL0hUTUw1LW5pY29uaWNvcGxheWVyL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuYXJyYXkuZmluZC1pbmRleC5qcyIsIkM6L1VzZXJzL2hha2F0YXNoaS9Eb2N1bWVudHMvR2l0SHViL0hUTUw1LW5pY29uaWNvcGxheWVyL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYuYXJyYXkuZmluZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTs7Ozs7QUFBQSxJQUFBLHNEQUFBO0VBQUE7O0FBTUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSwrQkFBUjs7QUFDUCxTQUFBLEdBQVksT0FBQSxDQUFRLHFDQUFSOztBQUVaLFFBQUEsR0FDRTtFQUFBLFdBQUEsRUFBYSxLQUFiO0VBQ0EsV0FBQSxFQUFhLENBRGI7RUFFQSxjQUFBLEVBQWdCLENBRmhCO0VBR0EsYUFBQSxFQUFlLEVBSGY7RUFJQSxXQUFBLEVBQWEsS0FKYjs7O0FBTUYsTUFBQSxHQUFTLENBQ1AsT0FETyxFQUVQLEtBRk8sRUFHUCxNQUhPLEVBSVAsUUFKTyxFQUtQLFFBTE8sRUFNUCxPQU5PLEVBT1AsTUFQTyxFQVFQLE1BUk8sRUFTUCxRQVRPLEVBVVAsT0FWTzs7QUFhVCxtQkFBQSxHQUFzQjs7O0FBRXRCOzs7OztBQUlBLG1CQUFBLEdBQXNCLFNBQUMsT0FBRDtBQUNwQixNQUFBO0VBQUEsUUFBQSxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBYixDQUEwQixRQUExQixFQUFvQyxPQUFwQztFQUNYLE1BQUEsR0FBUztFQUVULFFBQVEsQ0FBQyxlQUFULEdBQTJCLFFBQVEsQ0FBQyxXQUFULEdBQXVCLFFBQVEsQ0FBQztF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QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiMjIyFcclxuIyB2aWRlb2pzLUhUTUw1LW5pY29uaWNvcGxheWVyIC0gdjAuMC4wIC0gMjAxNS0xLTE5XHJcbiMgQ29weXJpZ2h0IChjKSAyMDE1IEtva2kgVGFrYWhhc2hpXHJcbiMgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG4jIyNcclxuXHJcbmZpbmQgPSByZXF1aXJlICdjb3JlLWpzL2xpYnJhcnkvZm4vYXJyYXkvZmluZCdcclxuZmluZEluZGV4ID0gcmVxdWlyZSAnY29yZS1qcy9saWJyYXJ5L2ZuL2FycmF5L2ZpbmQtaW5kZXgnXHJcblxyXG5kZWZhdWx0cyA9XHJcbiAgY29tbWVudExpc3Q6IGZhbHNlXHJcbiAgY29tbWVudFRpbWU6IDRcclxuICBjb21tZW50UHJlVGltZTogMVxyXG4gIGNvbW1lbnRIZWlnaHQ6IDIwXHJcbiAgY29tbWVudEZpbGU6IGZhbHNlXHJcblxyXG5jb2xvcnMgPSBbXHJcbiAgJ3doaXRlJ1xyXG4gICdyZWQnXHJcbiAgJ3BpbmsnXHJcbiAgJ29yYW5nZSdcclxuICAneWVsbG93J1xyXG4gICdncmVlbidcclxuICAnY3lhbidcclxuICAnYmx1ZSdcclxuICAncHVycGxlJ1xyXG4gICdibGFjaydcclxuXVxyXG5cclxuSFRNTDVOaWNvbmljb3BsYXllciA9IHVuZGVmaW5lZFxyXG5cclxuIyMjKlxyXG4jIEluaXRpYWxpemUgdGhlIHBsdWdpbi5cclxuIyBAcGFyYW0gb3B0aW9ucyAob3B0aW9uYWwpIHtvYmplY3R9IGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBwbHVnaW5cclxuIyMjXHJcbkhUTUw1Tmljb25pY29wbGF5ZXIgPSAob3B0aW9ucykgLT5cclxuICBzZXR0aW5ncyA9IHZpZGVvanMudXRpbC5tZXJnZU9wdGlvbnMoZGVmYXVsdHMsIG9wdGlvbnMpXHJcbiAgcGxheWVyID0gdGhpc1xyXG5cclxuICBzZXR0aW5ncy5jb21tZW50UG9zdFRpbWUgPSBzZXR0aW5ncy5jb21tZW50VGltZSAtIHNldHRpbmdzLmNvbW1lbnRQcmVUaW1lXHJcblxyXG4gIGNvbW1lbnRMb2FkZWQgPSBub1xyXG5cclxuICBpZiBzZXR0aW5ncy5jb21tZW50TGlzdFxyXG4gICAgY29tbWVudExpc3RFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Igc2V0dGluZ3MuY29tbWVudExpc3RcclxuXHJcbiAgIyBQcmVwYXJlIGVsZW1lbnRzXHJcbiAgY29udGVudEVsID0gcGxheWVyLmNvbnRlbnRFbCgpXHJcbiAgdmlkZW9FbCA9IGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCd2aWRlbycpIG9yIGNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCdpZnJhbWUnKVxyXG5cclxuICBpZiBzZXR0aW5ncy5jb21tZW50RmlsZVxyXG4gICAgY29tbWVudEZpbGUgPSBzZXR0aW5ncy5jb21tZW50RmlsZVxyXG4gIGVsc2VcclxuICAgIHRyYWNrRWxzID0gdmlkZW9FbC5xdWVyeVNlbGVjdG9yQWxsICd0cmFjaydcclxuXHJcbiAgICAjIEV4dHJhY3QgY29tbWVudCBlbGVtZW50c1xyXG4gICAgY29tbWVudEVscyA9IFtdXHJcblxyXG4gICAgZm9yIHRyYWNrRWwgaW4gdHJhY2tFbHNcclxuICAgICAgIyBUT0RPOiBJRSBjb21wYXRcclxuICAgICAgaWYgdHJhY2tFbC5jbGFzc0xpc3QuY29udGFpbnMgJ3Zqcy1uaWNvbmljby1jb21tZW50LWZpbGUnXHJcbiAgICAgICAgY29tbWVudEVscy5wdXNoIHRyYWNrRWxcclxuXHJcbiAgICBpZiBjb21tZW50RWxzLmxlbmd0aCBpcyAwXHJcbiAgICAgIHRocm93IG5ldyBFcnJvciAnTmljb25pY28gQ29tbWVudCBmaWxlIG5vdCBmb3VuZCdcclxuXHJcbiAgICBjb21tZW50RmlsZSA9IGNvbW1lbnRFbHNbMF0uZ2V0QXR0cmlidXRlICdzcmMnXHJcblxyXG4gIGNvbW1lbnRzID0gbnVsbFxyXG5cclxuICBwbGF5ZXIucmVhZHkgLT5cclxuICAgICMgUmVxdWVzdCBjb21tZW50XHJcbiAgICB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxyXG4gICAgeGhyLm92ZXJyaWRlTWltZVR5cGUgJ3RleHQveG1sJ1xyXG4gICAgeGhyLm9wZW4gJ0dFVCcsIGNvbW1lbnRGaWxlLCB0cnVlXHJcbiAgICB4aHIuc2VuZCgpXHJcblxyXG4gICAgY29tbWVudEFyZWFFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcclxuICAgIGNvbW1lbnRBcmVhRWwuY2xhc3NOYW1lID0gJ3Zqcy1uaWNvbmljby1jb21tZW50LWFyZWEnXHJcblxyXG4gICAgbGluZUxlbmd0aCA9IE1hdGguZmxvb3IgdmlkZW9FbC5vZmZzZXRIZWlnaHQgLyBzZXR0aW5ncy5jb21tZW50SGVpZ2h0XHJcbiAgICAjIEFycmF5IG9mIHRpbWUgY3VycmVudGx5IGxheW91dGVkIGxhc3QgY29tbWVudCBkaXNhcHBlYXJzIGZvciBlYWNoIGxpbmVcclxuICAgIGxpbmVFbmRUaW1lcyA9ICgwIGZvciBpIGluIFswLi4ubGluZUxlbmd0aF0pXHJcblxyXG4gICAgbGF5b3V0ZWRDb21tZW50ID0gMFxyXG4gICAgbGF5b3V0ZWRGaXhlZENvbW1lbnQgPSAwXHJcblxyXG4gICAgZml4ZWRDb21tZW50cyA9IFtdXHJcblxyXG4gICAgdmlkZW9FbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZSBjb21tZW50QXJlYUVsLCB2aWRlb0VsLm5leHRTaWJsaW5nXHJcblxyXG4gICAgeGhyLm9ubG9hZCA9IC0+XHJcbiAgICAgIGlmIHhoci5zdGF0dXMgaXNudCAyMDBcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJTZXJ2ZXIgcmVzcG9uZGVkIHdpdGggc3RhdHVzIGNvZGUgI3t4aHIuc3RhdHVzfVwiXHJcblxyXG4gICAgICBpZiB4aHIucmVzcG9uc2VYTUwgaXMgbnVsbFxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvbW1lbnQgZmlsZSBpcyBicm9rZW5cIlxyXG5cclxuICAgICAgY29tbWVudExvYWRlZCA9IHRydWVcclxuICAgICAgY29tbWVudHMgPSB4aHIucmVzcG9uc2VYTUxcclxuXHJcbiAgICAgIHBhY2tldEVsID0gY29tbWVudHMucXVlcnlTZWxlY3RvciAncGFja2V0J1xyXG4gICAgICBjaGF0RWxzID0gcGFja2V0RWwucXVlcnlTZWxlY3RvckFsbCAnY2hhdCdcclxuXHJcbiAgICAgIGNoYXRzID0gW11cclxuXHJcbiAgICAgIGZvciBjaGF0RWwgaW4gY2hhdEVsc1xyXG4gICAgICAgIGNoYXQgPSB7fVxyXG4gICAgICAgIGNoYXQuZWxlbWVudCA9IGNoYXRFbFxyXG4gICAgICAgIGNoYXQudGV4dCA9IGNoYXRFbC50ZXh0Q29udGVudFxyXG4gICAgICAgIGNoYXQuZGF0ZSA9IG5ldyBEYXRlIHBhcnNlSW50KGNoYXRFbC5nZXRBdHRyaWJ1dGUgJ2RhdGUnKSAqIDEwMDBcclxuICAgICAgICBjaGF0LnRocmVhZCA9IHBhcnNlSW50IGNoYXRFbC5nZXRBdHRyaWJ1dGUgJ3RocmVhZCdcclxuICAgICAgICBjaGF0LnVzZXJJZCA9IGNoYXRFbC5nZXRBdHRyaWJ1dGUgJ3VzZXJfaWQnXHJcbiAgICAgICAgY2hhdC5tYWlsID0gY2hhdEVsLmdldEF0dHJpYnV0ZSAnbWFpbCdcclxuICAgICAgICBjaGF0LnN0eWxlcyA9IGlmIGNoYXQubWFpbCB0aGVuIGNoYXQubWFpbC5zcGxpdCAnICcgZWxzZSBbXVxyXG4gICAgICAgIGNoYXQudnBvcyA9IHBhcnNlSW50IGNoYXRFbC5nZXRBdHRyaWJ1dGUgJ3Zwb3MnXHJcblxyXG4gICAgICAgIGNoYXRzLnB1c2ggY2hhdFxyXG5cclxuICAgICAgY2hhdHMuc29ydCAoYSwgYikgLT4gYS52cG9zIC0gYi52cG9zXHJcblxyXG4gICAgICBpZiBjb21tZW50TGlzdEVsXHJcbiAgICAgICAgZm9yIGNoYXQgaW4gY2hhdHNcclxuICAgICAgICAgIGNvbW1lbnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2RpdidcclxuICAgICAgICAgIGNvbW1lbnRFbC5jbGFzc05hbWUgPSAndmpzLWNvbW1lbnQnXHJcblxyXG4gICAgICAgICAgY29tbWVudExpc3RFbC5hcHBlbmRDaGlsZCBjb21tZW50RWxcclxuXHJcbiAgICAgICAgICBjb21tZW50VGV4dEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xyXG4gICAgICAgICAgY29tbWVudFRleHRFbC5jbGFzc05hbWUgPSAndmpzLWNvbW1lbnQtdGV4dCdcclxuICAgICAgICAgIGNvbW1lbnRUZXh0RWwudGV4dENvbnRlbnQgPSBjaGF0LnRleHRcclxuXHJcbiAgICAgICAgICBjb21tZW50RWwuYXBwZW5kQ2hpbGQgY29tbWVudFRleHRFbFxyXG5cclxuICAgICAgICAgIG1pbnV0ZXMgPSAoJzAwJyArIE1hdGguZmxvb3IoY2hhdC52cG9zIC8gNjAwMCkpWy0yLi4uXVxyXG4gICAgICAgICAgc2Vjb25kcyA9ICgnMDAnICsgTWF0aC5mbG9vcihjaGF0LnZwb3MgLyAxMDApICUgNjApWy0yLi4uXVxyXG4gICAgICAgICAgY2VudGlTZWNvbmRzID0gKCcwMCcgKyBNYXRoLmZsb29yKGNoYXQudnBvcykgJSA2MDAwKVstMi4uLl1cclxuXHJcbiAgICAgICAgICBjb21tZW50VGltZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xyXG4gICAgICAgICAgY29tbWVudFRpbWVFbC5jbGFzc05hbWUgPSAndmpzLWNvbW1lbnQtdGltZSdcclxuICAgICAgICAgIGNvbW1lbnRUaW1lRWwudGV4dENvbnRlbnQgPSBcIiN7bWludXRlc306I3tzZWNvbmRzfS4je2NlbnRpU2Vjb25kc31cIlxyXG5cclxuICAgICAgICAgIGNvbW1lbnRFbC5hcHBlbmRDaGlsZCBjb21tZW50VGltZUVsXHJcblxyXG4gICAgICAgICAgY2hhdC5saXN0RWxlbWVudCA9IGNvbW1lbnRFbFxyXG5cclxuICAgICAgc2Nyb2xsQ29tbWVudFRvID0gKGluZGV4KSAtPlxyXG4gICAgICAgIGlmIGNvbW1lbnRMaXN0RWxcclxuICAgICAgICAgIGNoYXQgPSBjaGF0c1tpbmRleF1cclxuICAgICAgICAgIHNjcm9sbFRvcCA9IGNoYXQubGlzdEVsZW1lbnQub2Zmc2V0VG9wIC0gY29tbWVudExpc3RFbC5vZmZzZXRUb3AgLSBjb21tZW50TGlzdEVsLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgY29tbWVudExpc3RFbC5zY3JvbGxUb3AgPSBNYXRoLm1heCAwLCBzY3JvbGxUb3BcclxuXHJcbiAgICAgIHNjcm9sbENvbW1lbnRUaW1lID0gKHNlY29uZHMpIC0+XHJcbiAgICAgICAgaWYgY29tbWVudExpc3RFbFxyXG4gICAgICAgICAgaW5kZXggPSBmaW5kSW5kZXggY2hhdHMsIChjaGF0KSAtPiBjaGF0LnZwb3MgPiBzZWNvbmRzICogMTAwXHJcbiAgICAgICAgICBzY3JvbGxDb21tZW50VG8gaW5kZXhcclxuXHJcbiAgICAgIHNldEludGVydmFsIC0+XHJcbiAgICAgICAgaWYgbm90IHBsYXllci5wYXVzZWQoKVxyXG4gICAgICAgICAgc2Vjb25kcyA9IHBsYXllci5jdXJyZW50VGltZSgpXHJcbiAgICAgICAgICBzY3JvbGxDb21tZW50VGltZSBzZWNvbmRzXHJcbiAgICAgICwgMTAwXHJcblxyXG4gICAgICBzZXRJbnRlcnZhbCAtPlxyXG4gICAgICAgIHVwZGF0ZUNvbW1lbnQoKVxyXG4gICAgICAsIDMzXHJcblxyXG4gICAgICBsYXlvdXRDb21tZW50ID0gKGNoYXQsIGNoYXRJbmRleCkgLT5cclxuICAgICAgICB2cG9zID0gcGxheWVyLmN1cnJlbnRUaW1lKClcclxuICAgICAgICB2aWRlb1dpZHRoID0gcGxheWVyLndpZHRoKClcclxuXHJcbiAgICAgICAgaWYgdnBvcyAtIHNldHRpbmdzLmNvbW1lbnRQb3N0VGltZSA8IGNoYXQudnBvcyAvIDEwMCA8IHZwb3MgKyBzZXR0aW5ncy5jb21tZW50UHJlVGltZVxyXG4gICAgICAgICAgc2Nyb2xsVGltZSA9ICh2cG9zICsgc2V0dGluZ3MuY29tbWVudFByZVRpbWUpIC0gY2hhdC52cG9zIC8gMTAwXHJcblxyXG4gICAgICAgICAgY29tbWVudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3BhbidcclxuICAgICAgICAgIGNvbW1lbnRFbC5jbGFzc05hbWUgPSAndmpzLW5pY29uaWNvLWNvbW1lbnQnXHJcbiAgICAgICAgICBjb21tZW50RWwudGV4dENvbnRlbnQgPSBjaGF0LnRleHRcclxuXHJcbiAgICAgICAgICAjIEFwcGVuZCBjb21tZW50IHRvIG1lYXN1cmUgd2lkdGhcclxuICAgICAgICAgIGNvbW1lbnRBcmVhRWwuYXBwZW5kQ2hpbGQgY29tbWVudEVsXHJcblxyXG4gICAgICAgICAgY29tbWVudFdpZHRoID0gY29tbWVudEVsLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICBzY3JvbGxQYXRoID0gdmlkZW9XaWR0aCArIGNvbW1lbnRXaWR0aFxyXG5cclxuICAgICAgICAgIHNjcm9sbE9mZnNldCA9IHNjcm9sbFBhdGggLyBzZXR0aW5ncy5jb21tZW50VGltZSAqIHNjcm9sbFRpbWVcclxuICAgICAgICAgIGNvbW1lbnRPZmZzZXQgPSB2aWRlb1dpZHRoIC0gc2Nyb2xsT2Zmc2V0XHJcblxyXG4gICAgICAgICAgIyBUaW1lIHdoZW4gY3VycmVudCBjb21tZW50IHRvdWNoIHRvIHRoZSBsZWZ0IHNpZGUgb2YgdmlkZW9cclxuICAgICAgICAgIGRpc2FwcGVhclRpbWUgPSBjaGF0LnZwb3MgLyAxMDAgLSBzZXR0aW5ncy5jb21tZW50UHJlVGltZSArIHNldHRpbmdzLmNvbW1lbnRUaW1lIC8gc2Nyb2xsUGF0aCAqIHZpZGVvV2lkdGhcclxuXHJcbiAgICAgICAgICBwYWRkaW5nVGltZXMgPSBbXVxyXG4gICAgICAgICAgbGluZSA9IG51bGxcclxuXHJcbiAgICAgICAgICBmb3IgdGltZSwgaW5kZXggaW4gbGluZUVuZFRpbWVzXHJcbiAgICAgICAgICAgIGlmIHRpbWUgPD0gZGlzYXBwZWFyVGltZVxyXG4gICAgICAgICAgICAgIGxpbmUgPSBpbmRleFxyXG4gICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICBwYWRkaW5nVGltZXNbaW5kZXhdID0gdGltZSAtIGRpc2FwcGVhclRpbWVcclxuXHJcbiAgICAgICAgICBpZiBsaW5lIGlzIG51bGxcclxuICAgICAgICAgICAgbWluUGFkZGluZyA9IEluZmluaXR5XHJcbiAgICAgICAgICAgIGZvciB0aW1lLCBpbmRleCBpbiBwYWRkaW5nVGltZXNcclxuICAgICAgICAgICAgICBpZiBtaW5QYWRkaW5nID4gdGltZVxyXG4gICAgICAgICAgICAgICAgbWluUGFkZGluZyA9IHRpbWVcclxuICAgICAgICAgICAgICAgIGxpbmUgPSBpbmRleFxyXG5cclxuICAgICAgICAgIGNvbW1lbnRFbC5kYXRhc2V0LmxpbmUgPSBsaW5lXHJcbiAgICAgICAgICBjb21tZW50RWwuZGF0YXNldC5pbmRleCA9IGNoYXRJbmRleFxyXG4gICAgICAgICAgY29tbWVudEVsLmRhdGFzZXQud2lkdGggPSBjb21tZW50V2lkdGhcclxuICAgICAgICAgIGNvbW1lbnRFbC5zdHlsZS50b3AgPSBsaW5lICogc2V0dGluZ3MuY29tbWVudEhlaWdodCArICdweCdcclxuICAgICAgICAgIGNvbW1lbnRFbC5zdHlsZS5sZWZ0ID0gY29tbWVudE9mZnNldCArICdweCdcclxuXHJcbiAgICAgICAgICBmb3IgY29sb3IgaW4gY29sb3JzXHJcbiAgICAgICAgICAgIGlmIGNvbG9yIGluIGNoYXQuc3R5bGVzXHJcbiAgICAgICAgICAgICAgY29tbWVudEVsLmNsYXNzTmFtZSArPSAnICcgKyBjb2xvclxyXG5cclxuICAgICAgICAgIGxpbmVFbmRUaW1lc1tpbmRleF0gPSBjaGF0LnZwb3MgLyAxMDAgKyBzZXR0aW5ncy5jb21tZW50UG9zdFRpbWVcclxuXHJcbiAgICAgICAgaWYgY2hhdC52cG9zIC8gMTAwIDwgdnBvcyArIHNldHRpbmdzLmNvbW1lbnRQcmVUaW1lXHJcbiAgICAgICAgICBsYXlvdXRlZENvbW1lbnQgPSBNYXRoLm1heCBsYXlvdXRlZENvbW1lbnQsIGNoYXRJbmRleFxyXG5cclxuICAgICAgbGF5b3V0Rml4ZWRDb21tZW50ID0gKGNoYXQsIGNoYXRJbmRleCkgLT5cclxuICAgICAgICB2cG9zID0gcGxheWVyLmN1cnJlbnRUaW1lKClcclxuICAgICAgICB2aWRlb1dpZHRoID0gcGxheWVyLndpZHRoKClcclxuICAgICAgICB2aWRlb0hlaWdodCA9IHBsYXllci5oZWlnaHQoKVxyXG5cclxuICAgICAgICBpZiB2cG9zIC0gc2V0dGluZ3MuY29tbWVudFRpbWUgPCBjaGF0LnZwb3MgLyAxMDAgPCB2cG9zXHJcbiAgICAgICAgICBkaXNwbGF5VGltZSA9IHZwb3MgLSBjaGF0LnZwb3MgLyAxMDBcclxuXHJcbiAgICAgICAgICBjb21tZW50RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdzcGFuJ1xyXG4gICAgICAgICAgY29tbWVudEVsLmNsYXNzTmFtZSA9ICd2anMtbmljb25pY28tY29tbWVudCBmaXhlZCdcclxuICAgICAgICAgIGNvbW1lbnRFbC50ZXh0Q29udGVudCA9IGNoYXQudGV4dFxyXG5cclxuICAgICAgICAgIGNvbW1lbnRIZWlnaHQgPSBzZXR0aW5ncy5jb21tZW50SGVpZ2h0XHJcblxyXG4gICAgICAgICAgY2FsY092ZXJsYXAgPSAoZnJvbSwgdG8pIC0+XHJcbiAgICAgICAgICAgIHN1bSA9IDBcclxuXHJcbiAgICAgICAgICAgIGZvciBjb21tZW50IGluIGZpeGVkQ29tbWVudHNcclxuICAgICAgICAgICAgICBvdmVybGFwRnJvbSA9IE1hdGgubWF4IGZyb20sIGNvbW1lbnQuZnJvbVxyXG4gICAgICAgICAgICAgIG92ZXJsYXBUbyA9IE1hdGgubWluIHRvLCBjb21tZW50LnRvXHJcblxyXG4gICAgICAgICAgICAgIGlmIG92ZXJsYXBGcm9tIDwgb3ZlcmxhcFRvXHJcbiAgICAgICAgICAgICAgICBzdW0gKz0gb3ZlcmxhcFRvIC0gb3ZlcmxhcEZyb21cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdW1cclxuXHJcbiAgICAgICAgICBwb3NpdGlvblRvcCA9IG51bGxcclxuXHJcbiAgICAgICAgICBpZiAndWUnIGluIGNoYXQuc3R5bGVzXHJcbiAgICAgICAgICAgIGNvbW1lbnRFbC5jbGFzc05hbWUgKz0gJyB1ZSdcclxuXHJcbiAgICAgICAgICAgICMgU29ydCBmaXhlZENvbW1lbnRzIG91dFxyXG4gICAgICAgICAgICBmaXhlZENvbW1lbnRzLnNvcnQgKGEsIGIpIC0+IGEudG8gLSBiLnRvXHJcblxyXG4gICAgICAgICAgICBpZiBjYWxjT3ZlcmxhcCgwLCBjb21tZW50SGVpZ2h0KSBpcyAwXHJcbiAgICAgICAgICAgICAgcG9zaXRpb25Ub3AgPSAwXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICBvdmVybGFwcyA9IFtdXHJcbiAgICAgICAgICAgICAgZm9yIGNvbW1lbnQgaW4gZml4ZWRDb21tZW50c1xyXG4gICAgICAgICAgICAgICAgb3ZlcmxhcCA9IGNhbGNPdmVybGFwIGNvbW1lbnQudG8sIGNvbW1lbnQudG8gKyBjb21tZW50SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBvdmVybGFwcy5wdXNoIG92ZXJsYXBcclxuXHJcbiAgICAgICAgICAgICAgICBpZiBjb21tZW50LnRvICsgY29tbWVudEhlaWdodCA8PSB2aWRlb0hlaWdodCBhbmQgb3ZlcmxhcCBpcyAwXHJcbiAgICAgICAgICAgICAgICAgIHBvc2l0aW9uVG9wID0gY29tbWVudC50b1xyXG4gICAgICAgICAgICAgICAgICBicmVha1xyXG5cclxuICAgICAgICAgICAgICBpZiBwb3NpdGlvblRvcCBpcyBudWxsXHJcbiAgICAgICAgICAgICAgICBtaW5PdmVybGFwID0gSW5maW5pdHlcclxuICAgICAgICAgICAgICAgIGZvciBvdmVybGFwLCBpbmRleCBpbiBvdmVybGFwc1xyXG4gICAgICAgICAgICAgICAgICBpZiBvdmVybGFwIDwgbWluT3ZlcmxhcCBhbmQgZml4ZWRDb21tZW50c1tpbmRleF0udG8gKyBjb21tZW50SGVpZ2h0IDw9IHZpZGVvSGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgbWluT3ZlcmxhcCA9IG92ZXJsYXBcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvblRvcCA9IGZpeGVkQ29tbWVudHNbaW5kZXhdLnRvXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgcG9zaXRpb25Ub3AgaXMgbnVsbFxyXG4gICAgICAgICAgICAgICAgICBwb3NpdGlvblRvcCA9IDBcclxuXHJcbiAgICAgICAgICBlbHNlICMgc2hpdGFcclxuICAgICAgICAgICAgY29tbWVudEVsLmNsYXNzTmFtZSArPSAnIHNoaXRhJ1xyXG5cclxuICAgICAgICAgICAgIyBTb3J0IGZpeGVkQ29tbWVudHMgb3V0XHJcbiAgICAgICAgICAgIGZpeGVkQ29tbWVudHMuc29ydCAoYSwgYikgLT4gYi5mcm9tIC0gYS5mcm9tXHJcblxyXG4gICAgICAgICAgICBpZiBjYWxjT3ZlcmxhcCh2aWRlb0hlaWdodCAtIGNvbW1lbnRIZWlnaHQsIHZpZGVvSGVpZ2h0KSBpcyAwXHJcbiAgICAgICAgICAgICAgcG9zaXRpb25Ub3AgPSB2aWRlb0hlaWdodCAtIGNvbW1lbnRIZWlnaHRcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgIG92ZXJsYXBzID0gW11cclxuICAgICAgICAgICAgICBmb3IgY29tbWVudCBpbiBmaXhlZENvbW1lbnRzXHJcbiAgICAgICAgICAgICAgICBvdmVybGFwID0gY2FsY092ZXJsYXAgY29tbWVudC5mcm9tIC0gY29tbWVudEhlaWdodCwgY29tbWVudC5mcm9tXHJcbiAgICAgICAgICAgICAgICBvdmVybGFwcy5wdXNoIG92ZXJsYXBcclxuXHJcbiAgICAgICAgICAgICAgICBpZiBjb21tZW50LmZyb20gLSBjb21tZW50SGVpZ2h0ID49IDAgYW5kIG92ZXJsYXAgaXMgMFxyXG4gICAgICAgICAgICAgICAgICBwb3NpdGlvblRvcCA9IGNvbW1lbnQuZnJvbSAtIGNvbW1lbnRIZWlnaHRcclxuICAgICAgICAgICAgICAgICAgYnJlYWtcclxuXHJcbiAgICAgICAgICAgICAgaWYgcG9zaXRpb25Ub3AgaXMgbnVsbFxyXG4gICAgICAgICAgICAgICAgbWluT3ZlcmxhcCA9IEluZmluaXR5XHJcbiAgICAgICAgICAgICAgICBmb3Igb3ZlcmxhcCwgaW5kZXggaW4gb3ZlcmxhcHNcclxuICAgICAgICAgICAgICAgICAgaWYgb3ZlcmxhcCA8IG1pbk92ZXJsYXAgYW5kIGZpeGVkQ29tbWVudHNbaW5kZXhdLmZyb20gLSBjb21tZW50SGVpZ2h0ID49IDBcclxuICAgICAgICAgICAgICAgICAgICBtaW5PdmVybGFwID0gb3ZlcmxhcFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uVG9wID0gZml4ZWRDb21tZW50c1tpbmRleF0uZnJvbSAtIGNvbW1lbnRIZWlnaHRcclxuXHJcbiAgICAgICAgICAgICAgICBpZiBwb3NpdGlvblRvcCBpcyBudWxsXHJcbiAgICAgICAgICAgICAgICAgIHBvc2l0aW9uVG9wID0gdmlkZW9IZWlnaHQgLSBjb21tZW50SGVpZ2h0XHJcblxyXG4gICAgICAgICAgY29tbWVudEVsLmRhdGFzZXQuaW5kZXggPSBjaGF0SW5kZXhcclxuICAgICAgICAgIGNvbW1lbnRFbC5zdHlsZS50b3AgPSBwb3NpdGlvblRvcCArICdweCdcclxuXHJcbiAgICAgICAgICBmb3IgY29sb3IgaW4gY29sb3JzXHJcbiAgICAgICAgICAgIGlmIGNvbG9yIGluIGNoYXQuc3R5bGVzXHJcbiAgICAgICAgICAgICAgY29tbWVudEVsLmNsYXNzTmFtZSArPSAnICcgKyBjb2xvclxyXG5cclxuICAgICAgICAgIGNvbW1lbnRBcmVhRWwuYXBwZW5kQ2hpbGQgY29tbWVudEVsXHJcblxyXG4gICAgICAgICAgZml4ZWRDb21tZW50cy5wdXNoXHJcbiAgICAgICAgICAgIGZyb206IHBvc2l0aW9uVG9wXHJcbiAgICAgICAgICAgIHRvOiBwb3NpdGlvblRvcCArIGNvbW1lbnRIZWlnaHRcclxuICAgICAgICAgICAgaW5kZXg6IGNoYXRJbmRleFxyXG5cclxuICAgICAgICBpZiBjaGF0LnZwb3MgLyAxMDAgPCB2cG9zXHJcbiAgICAgICAgICBsYXlvdXRlZEZpeGVkQ29tbWVudCA9IE1hdGgubWF4IGxheW91dGVkRml4ZWRDb21tZW50LCBjaGF0SW5kZXhcclxuXHJcbiAgICAgIGxheW91dENvbW1lbnRzID0gLT5cclxuICAgICAgICBjb21tZW50QXJlYUVsLmlubmVySFRNTCA9ICcnXHJcbiAgICAgICAgbGluZUVuZFRpbWVzID0gKDAgZm9yIGkgaW4gWzAuLi5saW5lTGVuZ3RoXSlcclxuXHJcbiAgICAgICAgbGF5b3V0ZWRDb21tZW50ID0gMFxyXG4gICAgICAgIGxheW91dGVkRml4ZWRDb21tZW50ID0gMFxyXG5cclxuICAgICAgICBmaXhlZENvbW1lbnRzID0gW11cclxuXHJcbiAgICAgICAgZm9yIGNoYXQsIGluZGV4IGluIGNoYXRzXHJcbiAgICAgICAgICBpZiAndWUnIGluIGNoYXQuc3R5bGVzIG9yICdzaGl0YScgaW4gY2hhdC5zdHlsZXNcclxuICAgICAgICAgICAgbGF5b3V0Rml4ZWRDb21tZW50IGNoYXQsIGluZGV4XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGxheW91dENvbW1lbnQgY2hhdCwgaW5kZXhcclxuXHJcbiAgICAgIHVwZGF0ZUNvbW1lbnQgPSAtPlxyXG4gICAgICAgIHZwb3MgPSBwbGF5ZXIuY3VycmVudFRpbWUoKVxyXG4gICAgICAgIHZpZGVvV2lkdGggPSBwbGF5ZXIud2lkdGgoKVxyXG5cclxuICAgICAgICByZW1vdmFsUGVuZGluZ0VsZW1lbnRzID0gW11cclxuXHJcbiAgICAgICAgZm9yIGNvbW1lbnRFbCBpbiBjb21tZW50QXJlYUVsLmNoaWxkTm9kZXNcclxuICAgICAgICAgIGluZGV4ID0gcGFyc2VJbnQgY29tbWVudEVsLmRhdGFzZXQuaW5kZXhcclxuICAgICAgICAgIGNoYXQgPSBjaGF0c1tpbmRleF1cclxuXHJcbiAgICAgICAgICBpZiAndWUnIGluIGNoYXQuc3R5bGVzIG9yICdzaGl0YScgaW4gY2hhdC5zdHlsZXNcclxuICAgICAgICAgICAgaWYgY2hhdC52cG9zIC8gMTAwIDwgdnBvcyAtIHNldHRpbmdzLmNvbW1lbnRUaW1lXHJcbiAgICAgICAgICAgICAgcmVtb3ZhbFBlbmRpbmdFbGVtZW50cy5wdXNoIGNvbW1lbnRFbFxyXG4gICAgICAgICAgICAgIGZpeGVkQ29tbWVudHMgPSBmaXhlZENvbW1lbnRzLmZpbHRlciAoY29tbWVudCkgLT4gY29tbWVudC5pbmRleCBpc250IGluZGV4XHJcblxyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBpZiBjaGF0LnZwb3MgLyAxMDAgPCB2cG9zIC0gc2V0dGluZ3MuY29tbWVudFBvc3RUaW1lXHJcbiAgICAgICAgICAgICAgcmVtb3ZhbFBlbmRpbmdFbGVtZW50cy5wdXNoIGNvbW1lbnRFbFxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgc2Nyb2xsVGltZSA9ICh2cG9zICsgc2V0dGluZ3MuY29tbWVudFByZVRpbWUpIC0gY2hhdC52cG9zIC8gMTAwXHJcbiAgICAgICAgICAgICAgY29tbWVudFdpZHRoID0gcGFyc2VJbnQgY29tbWVudEVsLmRhdGFzZXQud2lkdGhcclxuICAgICAgICAgICAgICBzY3JvbGxQYXRoID0gdmlkZW9XaWR0aCArIGNvbW1lbnRXaWR0aFxyXG5cclxuICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQgPSBzY3JvbGxQYXRoIC8gc2V0dGluZ3MuY29tbWVudFRpbWUgKiBzY3JvbGxUaW1lXHJcbiAgICAgICAgICAgICAgY29tbWVudE9mZnNldCA9IHZpZGVvV2lkdGggLSBzY3JvbGxPZmZzZXRcclxuXHJcbiAgICAgICAgICAgICAgY29tbWVudEVsLnN0eWxlLmxlZnQgPSBjb21tZW50T2Zmc2V0ICsgJ3B4J1xyXG5cclxuICAgICAgICBmb3IgZWxlbWVudCBpbiByZW1vdmFsUGVuZGluZ0VsZW1lbnRzXHJcbiAgICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQgZWxlbWVudFxyXG5cclxuICAgICAgICBmb3IgY2hhdCwgaW5kZXggaW4gY2hhdHNcclxuICAgICAgICAgIGlmICd1ZScgaW4gY2hhdC5zdHlsZXMgb3IgJ3NoaXRhJyBpbiBjaGF0LnN0eWxlc1xyXG4gICAgICAgICAgICBpZiBpbmRleCA+IGxheW91dGVkRml4ZWRDb21tZW50XHJcbiAgICAgICAgICAgICAgbGF5b3V0Rml4ZWRDb21tZW50IGNoYXQsIGluZGV4XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGlmIGluZGV4ID4gbGF5b3V0ZWRDb21tZW50XHJcbiAgICAgICAgICAgICAgbGF5b3V0Q29tbWVudCBjaGF0LCBpbmRleFxyXG5cclxuICAgICAgcGxheWVyLm9uICdzZWVrZWQnLCAtPlxyXG4gICAgICAgIGxheW91dENvbW1lbnRzKClcclxuXHJcbiAgICAgIGxheW91dENvbW1lbnRzKClcclxuICAgICAgd2luZG93LmxheW91dENvbW1lbnRzID0gbGF5b3V0Q29tbWVudHNcclxuICAgICAgd2luZG93LnVwZGF0ZUNvbW1lbnQgPSB1cGRhdGVDb21tZW50XHJcblxyXG4gIHJldHVybiBwbGF5ZXJcclxuXHJcbiMgcmVnaXN0ZXIgdGhlIHBsdWdpblxyXG52aWRlb2pzLnBsdWdpbiAnSFRNTDVOaWNvbmljb3BsYXllcicsIEhUTUw1Tmljb25pY29wbGF5ZXJcclxuIiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYuYXJyYXkuZmluZC1pbmRleCcpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzLyQuY29yZScpLkFycmF5LmZpbmRJbmRleDsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5hcnJheS5maW5kJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvJC5jb3JlJykuQXJyYXkuZmluZDsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYodHlwZW9mIGl0ICE9ICdmdW5jdGlvbicpdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgYSBmdW5jdGlvbiEnKTtcbiAgcmV0dXJuIGl0O1xufTsiLCIvLyAwIC0+IEFycmF5I2ZvckVhY2hcbi8vIDEgLT4gQXJyYXkjbWFwXG4vLyAyIC0+IEFycmF5I2ZpbHRlclxuLy8gMyAtPiBBcnJheSNzb21lXG4vLyA0IC0+IEFycmF5I2V2ZXJ5XG4vLyA1IC0+IEFycmF5I2ZpbmRcbi8vIDYgLT4gQXJyYXkjZmluZEluZGV4XG52YXIgY3R4ICAgICAgPSByZXF1aXJlKCcuLyQuY3R4JylcbiAgLCBJT2JqZWN0ICA9IHJlcXVpcmUoJy4vJC5pb2JqZWN0JylcbiAgLCB0b09iamVjdCA9IHJlcXVpcmUoJy4vJC50by1vYmplY3QnKVxuICAsIHRvTGVuZ3RoID0gcmVxdWlyZSgnLi8kLnRvLWxlbmd0aCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihUWVBFKXtcbiAgdmFyIElTX01BUCAgICAgICAgPSBUWVBFID09IDFcbiAgICAsIElTX0ZJTFRFUiAgICAgPSBUWVBFID09IDJcbiAgICAsIElTX1NPTUUgICAgICAgPSBUWVBFID09IDNcbiAgICAsIElTX0VWRVJZICAgICAgPSBUWVBFID09IDRcbiAgICAsIElTX0ZJTkRfSU5ERVggPSBUWVBFID09IDZcbiAgICAsIE5PX0hPTEVTICAgICAgPSBUWVBFID09IDUgfHwgSVNfRklORF9JTkRFWDtcbiAgcmV0dXJuIGZ1bmN0aW9uKCR0aGlzLCBjYWxsYmFja2ZuLCB0aGF0KXtcbiAgICB2YXIgTyAgICAgID0gdG9PYmplY3QoJHRoaXMpXG4gICAgICAsIHNlbGYgICA9IElPYmplY3QoTylcbiAgICAgICwgZiAgICAgID0gY3R4KGNhbGxiYWNrZm4sIHRoYXQsIDMpXG4gICAgICAsIGxlbmd0aCA9IHRvTGVuZ3RoKHNlbGYubGVuZ3RoKVxuICAgICAgLCBpbmRleCAgPSAwXG4gICAgICAsIHJlc3VsdCA9IElTX01BUCA/IEFycmF5KGxlbmd0aCkgOiBJU19GSUxURVIgPyBbXSA6IHVuZGVmaW5lZFxuICAgICAgLCB2YWwsIHJlcztcbiAgICBmb3IoO2xlbmd0aCA+IGluZGV4OyBpbmRleCsrKWlmKE5PX0hPTEVTIHx8IGluZGV4IGluIHNlbGYpe1xuICAgICAgdmFsID0gc2VsZltpbmRleF07XG4gICAgICByZXMgPSBmKHZhbCwgaW5kZXgsIE8pO1xuICAgICAgaWYoVFlQRSl7XG4gICAgICAgIGlmKElTX01BUClyZXN1bHRbaW5kZXhdID0gcmVzOyAgICAgICAgICAgIC8vIG1hcFxuICAgICAgICBlbHNlIGlmKHJlcylzd2l0Y2goVFlQRSl7XG4gICAgICAgICAgY2FzZSAzOiByZXR1cm4gdHJ1ZTsgICAgICAgICAgICAgICAgICAgIC8vIHNvbWVcbiAgICAgICAgICBjYXNlIDU6IHJldHVybiB2YWw7ICAgICAgICAgICAgICAgICAgICAgLy8gZmluZFxuICAgICAgICAgIGNhc2UgNjogcmV0dXJuIGluZGV4OyAgICAgICAgICAgICAgICAgICAvLyBmaW5kSW5kZXhcbiAgICAgICAgICBjYXNlIDI6IHJlc3VsdC5wdXNoKHZhbCk7ICAgICAgICAgICAgICAgLy8gZmlsdGVyXG4gICAgICAgIH0gZWxzZSBpZihJU19FVkVSWSlyZXR1cm4gZmFsc2U7ICAgICAgICAgIC8vIGV2ZXJ5XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBJU19GSU5EX0lOREVYID8gLTEgOiBJU19TT01FIHx8IElTX0VWRVJZID8gSVNfRVZFUlkgOiByZXN1bHQ7XG4gIH07XG59OyIsInZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoaXQpLnNsaWNlKDgsIC0xKTtcbn07IiwidmFyIGNvcmUgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuaWYodHlwZW9mIF9fZSA9PSAnbnVtYmVyJylfX2UgPSBjb3JlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmIiwiLy8gb3B0aW9uYWwgLyBzaW1wbGUgY29udGV4dCBiaW5kaW5nXG52YXIgYUZ1bmN0aW9uID0gcmVxdWlyZSgnLi8kLmEtZnVuY3Rpb24nKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZm4sIHRoYXQsIGxlbmd0aCl7XG4gIGFGdW5jdGlvbihmbik7XG4gIGlmKHRoYXQgPT09IHVuZGVmaW5lZClyZXR1cm4gZm47XG4gIHN3aXRjaChsZW5ndGgpe1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKGEpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSk7XG4gICAgfTtcbiAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbihhLCBiKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEsIGIpO1xuICAgIH07XG4gICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24oYSwgYiwgYyl7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhLCBiLCBjKTtcbiAgICB9O1xuICB9IHJldHVybiBmdW5jdGlvbigvKiAuLi5hcmdzICovKXtcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICAgIH07XG59OyIsInZhciBnbG9iYWwgICAgPSByZXF1aXJlKCcuLyQuZ2xvYmFsJylcbiAgLCBjb3JlICAgICAgPSByZXF1aXJlKCcuLyQuY29yZScpXG4gICwgUFJPVE9UWVBFID0gJ3Byb3RvdHlwZSc7XG52YXIgY3R4ID0gZnVuY3Rpb24oZm4sIHRoYXQpe1xuICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbiAgfTtcbn07XG52YXIgJGRlZiA9IGZ1bmN0aW9uKHR5cGUsIG5hbWUsIHNvdXJjZSl7XG4gIHZhciBrZXksIG93biwgb3V0LCBleHBcbiAgICAsIGlzR2xvYmFsID0gdHlwZSAmICRkZWYuR1xuICAgICwgaXNQcm90byAgPSB0eXBlICYgJGRlZi5QXG4gICAgLCB0YXJnZXQgICA9IGlzR2xvYmFsID8gZ2xvYmFsIDogdHlwZSAmICRkZWYuU1xuICAgICAgICA/IGdsb2JhbFtuYW1lXSA6IChnbG9iYWxbbmFtZV0gfHwge30pW1BST1RPVFlQRV1cbiAgICAsIGV4cG9ydHMgID0gaXNHbG9iYWwgPyBjb3JlIDogY29yZVtuYW1lXSB8fCAoY29yZVtuYW1lXSA9IHt9KTtcbiAgaWYoaXNHbG9iYWwpc291cmNlID0gbmFtZTtcbiAgZm9yKGtleSBpbiBzb3VyY2Upe1xuICAgIC8vIGNvbnRhaW5zIGluIG5hdGl2ZVxuICAgIG93biA9ICEodHlwZSAmICRkZWYuRikgJiYgdGFyZ2V0ICYmIGtleSBpbiB0YXJnZXQ7XG4gICAgaWYob3duICYmIGtleSBpbiBleHBvcnRzKWNvbnRpbnVlO1xuICAgIC8vIGV4cG9ydCBuYXRpdmUgb3IgcGFzc2VkXG4gICAgb3V0ID0gb3duID8gdGFyZ2V0W2tleV0gOiBzb3VyY2Vba2V5XTtcbiAgICAvLyBwcmV2ZW50IGdsb2JhbCBwb2xsdXRpb24gZm9yIG5hbWVzcGFjZXNcbiAgICBpZihpc0dsb2JhbCAmJiB0eXBlb2YgdGFyZ2V0W2tleV0gIT0gJ2Z1bmN0aW9uJylleHAgPSBzb3VyY2Vba2V5XTtcbiAgICAvLyBiaW5kIHRpbWVycyB0byBnbG9iYWwgZm9yIGNhbGwgZnJvbSBleHBvcnQgY29udGV4dFxuICAgIGVsc2UgaWYodHlwZSAmICRkZWYuQiAmJiBvd24pZXhwID0gY3R4KG91dCwgZ2xvYmFsKTtcbiAgICAvLyB3cmFwIGdsb2JhbCBjb25zdHJ1Y3RvcnMgZm9yIHByZXZlbnQgY2hhbmdlIHRoZW0gaW4gbGlicmFyeVxuICAgIGVsc2UgaWYodHlwZSAmICRkZWYuVyAmJiB0YXJnZXRba2V5XSA9PSBvdXQpIWZ1bmN0aW9uKEMpe1xuICAgICAgZXhwID0gZnVuY3Rpb24ocGFyYW0pe1xuICAgICAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIEMgPyBuZXcgQyhwYXJhbSkgOiBDKHBhcmFtKTtcbiAgICAgIH07XG4gICAgICBleHBbUFJPVE9UWVBFXSA9IENbUFJPVE9UWVBFXTtcbiAgICB9KG91dCk7XG4gICAgZWxzZSBleHAgPSBpc1Byb3RvICYmIHR5cGVvZiBvdXQgPT0gJ2Z1bmN0aW9uJyA/IGN0eChGdW5jdGlvbi5jYWxsLCBvdXQpIDogb3V0O1xuICAgIC8vIGV4cG9ydFxuICAgIGV4cG9ydHNba2V5XSA9IGV4cDtcbiAgICBpZihpc1Byb3RvKShleHBvcnRzW1BST1RPVFlQRV0gfHwgKGV4cG9ydHNbUFJPVE9UWVBFXSA9IHt9KSlba2V5XSA9IG91dDtcbiAgfVxufTtcbi8vIHR5cGUgYml0bWFwXG4kZGVmLkYgPSAxOyAgLy8gZm9yY2VkXG4kZGVmLkcgPSAyOyAgLy8gZ2xvYmFsXG4kZGVmLlMgPSA0OyAgLy8gc3RhdGljXG4kZGVmLlAgPSA4OyAgLy8gcHJvdG9cbiRkZWYuQiA9IDE2OyAvLyBiaW5kXG4kZGVmLlcgPSAzMjsgLy8gd3JhcFxubW9kdWxlLmV4cG9ydHMgPSAkZGVmOyIsIi8vIDcuMi4xIFJlcXVpcmVPYmplY3RDb2VyY2libGUoYXJndW1lbnQpXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYoaXQgPT0gdW5kZWZpbmVkKXRocm93IFR5cGVFcnJvcihcIkNhbid0IGNhbGwgbWV0aG9kIG9uICBcIiArIGl0KTtcbiAgcmV0dXJuIGl0O1xufTsiLCIvLyBodHRwczovL2dpdGh1Yi5jb20vemxvaXJvY2svY29yZS1qcy9pc3N1ZXMvODYjaXNzdWVjb21tZW50LTExNTc1OTAyOFxudmFyIFVOREVGSU5FRCA9ICd1bmRlZmluZWQnO1xudmFyIGdsb2JhbCA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIHdpbmRvdyAhPSBVTkRFRklORUQgJiYgd2luZG93Lk1hdGggPT0gTWF0aFxuICA/IHdpbmRvdyA6IHR5cGVvZiBzZWxmICE9IFVOREVGSU5FRCAmJiBzZWxmLk1hdGggPT0gTWF0aCA/IHNlbGYgOiBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuaWYodHlwZW9mIF9fZyA9PSAnbnVtYmVyJylfX2cgPSBnbG9iYWw7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW5kZWYiLCIvLyBpbmRleGVkIG9iamVjdCwgZmFsbGJhY2sgZm9yIG5vbi1hcnJheS1saWtlIEVTMyBzdHJpbmdzXG52YXIgY29mID0gcmVxdWlyZSgnLi8kLmNvZicpO1xubW9kdWxlLmV4cG9ydHMgPSAwIGluIE9iamVjdCgneicpID8gT2JqZWN0IDogZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gY29mKGl0KSA9PSAnU3RyaW5nJyA/IGl0LnNwbGl0KCcnKSA6IE9iamVjdChpdCk7XG59OyIsIi8vIDcuMS40IFRvSW50ZWdlclxudmFyIGNlaWwgID0gTWF0aC5jZWlsXG4gICwgZmxvb3IgPSBNYXRoLmZsb29yO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBpc05hTihpdCA9ICtpdCkgPyAwIDogKGl0ID4gMCA/IGZsb29yIDogY2VpbCkoaXQpO1xufTsiLCIvLyA3LjEuMTUgVG9MZW5ndGhcbnZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuLyQudG8taW50ZWdlcicpXG4gICwgbWluICAgICAgID0gTWF0aC5taW47XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGl0ID4gMCA/IG1pbih0b0ludGVnZXIoaXQpLCAweDFmZmZmZmZmZmZmZmZmKSA6IDA7IC8vIHBvdygyLCA1MykgLSAxID09IDkwMDcxOTkyNTQ3NDA5OTFcbn07IiwiLy8gNy4xLjEzIFRvT2JqZWN0KGFyZ3VtZW50KVxudmFyIGRlZmluZWQgPSByZXF1aXJlKCcuLyQuZGVmaW5lZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBPYmplY3QoZGVmaW5lZChpdCkpO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCl7IC8qIGVtcHR5ICovIH07IiwiJ3VzZSBzdHJpY3QnO1xuLy8gMjIuMS4zLjkgQXJyYXkucHJvdG90eXBlLmZpbmRJbmRleChwcmVkaWNhdGUsIHRoaXNBcmcgPSB1bmRlZmluZWQpXG52YXIgS0VZICAgID0gJ2ZpbmRJbmRleCdcbiAgLCAkZGVmICAgPSByZXF1aXJlKCcuLyQuZGVmJylcbiAgLCBmb3JjZWQgPSB0cnVlXG4gICwgJGZpbmQgID0gcmVxdWlyZSgnLi8kLmFycmF5LW1ldGhvZHMnKSg2KTtcbi8vIFNob3VsZG4ndCBza2lwIGhvbGVzXG5pZihLRVkgaW4gW10pQXJyYXkoMSlbS0VZXShmdW5jdGlvbigpeyBmb3JjZWQgPSBmYWxzZTsgfSk7XG4kZGVmKCRkZWYuUCArICRkZWYuRiAqIGZvcmNlZCwgJ0FycmF5Jywge1xuICBmaW5kSW5kZXg6IGZ1bmN0aW9uIGZpbmRJbmRleChjYWxsYmFja2ZuLyosIHRoYXQgPSB1bmRlZmluZWQgKi8pe1xuICAgIHJldHVybiAkZmluZCh0aGlzLCBjYWxsYmFja2ZuLCBhcmd1bWVudHNbMV0pO1xuICB9XG59KTtcbnJlcXVpcmUoJy4vJC51bnNjb3BlJykoS0VZKTsiLCIndXNlIHN0cmljdCc7XG4vLyAyMi4xLjMuOCBBcnJheS5wcm90b3R5cGUuZmluZChwcmVkaWNhdGUsIHRoaXNBcmcgPSB1bmRlZmluZWQpXG52YXIgS0VZICAgID0gJ2ZpbmQnXG4gICwgJGRlZiAgID0gcmVxdWlyZSgnLi8kLmRlZicpXG4gICwgZm9yY2VkID0gdHJ1ZVxuICAsICRmaW5kICA9IHJlcXVpcmUoJy4vJC5hcnJheS1tZXRob2RzJykoNSk7XG4vLyBTaG91bGRuJ3Qgc2tpcCBob2xlc1xuaWYoS0VZIGluIFtdKUFycmF5KDEpW0tFWV0oZnVuY3Rpb24oKXsgZm9yY2VkID0gZmFsc2U7IH0pO1xuJGRlZigkZGVmLlAgKyAkZGVmLkYgKiBmb3JjZWQsICdBcnJheScsIHtcbiAgZmluZDogZnVuY3Rpb24gZmluZChjYWxsYmFja2ZuLyosIHRoYXQgPSB1bmRlZmluZWQgKi8pe1xuICAgIHJldHVybiAkZmluZCh0aGlzLCBjYWxsYmFja2ZuLCBhcmd1bWVudHNbMV0pO1xuICB9XG59KTtcbnJlcXVpcmUoJy4vJC51bnNjb3BlJykoS0VZKTsiXX0=
