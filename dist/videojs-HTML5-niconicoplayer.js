(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/*! videojs-HTML5-niconicoplayer - v0.0.0 - 2015-1-19
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
},{"./$.array-methods":5,"./$.def":9,"./$.unscope":16}]},{},[1]);
