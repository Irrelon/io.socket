var Util = {};
if (typeof JSON !== 'undefined') {
  Util.JSON = JSON;
}

if (typeof require !== 'undefined') {
  module.exports = Util;
  Util.EventEmitter = require('events').EventEmitter;
} else {
  var EventEmitter = function () {
    this._events = {};
  };

  EventEmitter.prototype.emit = function (ev) {
    var args = Util.arrayCopy(arguments, 1);
    var events = this._events[ev];
    if (events) {
      for (var i = 0, ll = events.length; i < ll; i++) {
        events[i].apply(this, args);
      }
    }
  };

  EventEmitter.prototype.on = function (ev, fn) {
    if (!(ev in this._events)) {
      this._events[ev] = [];
    }
    this._events[ev].push(fn);
  };

  EventEmitter.prototype.once = function (ev, fn) {
    var events = this._events[ev];
    if (!(ev in this._events)) {
      events = this._events[ev] = [];
    }
    var func = function () {
      fn.apply(this, Util.arrayCopy(arguments));
      events.splice(events.indexOf(func), 1);
    };
    events.push(func);
  };

  Util.generateRandomString = function () {
    return (Math.random() + "").substr(2);
  };

  Util.EventEmitter = EventEmitter;
}

Util.arrayCopy = function (arg, index) {
  index = index || 0;
  var arr = [];
  for (var i = index, ll = arg.length; i < ll; i++) {
    arr.push(arg[i]);
  }
  return arr;
};

Util.clone = function (proto, obj) {
  obj.__proto__ = proto;
  return obj;
};

Util.deserialize = function (str) {
  var arr = Util.JSON.parse(str);
  if (!Array.isArray(arr[1])) {
    return false;
  }
  arr[1].unshift(arr[0]);
  return arr[1];
};

Util.serialize = function (listener, args) {
  args = this.arrayCopy(args, 1);
  return Util.JSON.stringify([listener, args]);
};

Util.hasProperty = function (obj, prop) {
  return Object.prototype.hasOwnProperty.call(Object(obj), prop);
};


if (typeof JSON === 'undefined') {
  // JSON shim taken from Socket.IO, which took it from Crockford's json2.
  (function (exports) {
    var JSON = exports.JSON = {};
    function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
    }
    function date(d, key) {
      return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
    }
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
        },
        rep;
    function quote(string) {
      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
          '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];
      if (value instanceof Date) {
        value = date(key);
      }
      if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
      }
      switch (typeof value) {
      case 'string':
        return quote(value);
      case 'number':
        return isFinite(value) ? String(value) : 'null';
      case 'boolean':
      case 'null':
        return String(value);
      case 'object':
        if (!value) {
          return 'null';
        }
        gap += indent;
        partial = [];
        if (Object.prototype.toString.apply(value) === '[object Array]') {
          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || 'null';
          }
          v = partial.length === 0 ? '[]' : gap ?
            '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
            '[' + partial.join(',') + ']';
          gap = mind;
          return v;
        }
        if (rep && typeof rep === 'object') {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === 'string') {
              k = rep[i];
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        } else {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        }
        v = partial.length === 0 ? '{}' : gap ?
          '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
          '{' + partial.join(',') + '}';
        gap = mind;
        return v;
      default:
        return value;
      }
    }
    JSON.stringify = function (value, replacer, space) {
      var i;
      gap = '';
      indent = '';
      if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
          indent += ' ';
        }
      } else if (typeof space === 'string') {
        indent = space;
      }
      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
          (typeof replacer !== 'object' ||
           typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
      }
      return str('', {'': value});
    };
    JSON.parse = function (text, reviver) {
      var j;
      function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = walk(value, k);
              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value);
      }
      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
        text = text.replace(cx, function (a) {
          return '\\u' +
            ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }
      if (/^[\],:{}\s]*$/
          .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
        j = eval('(' + text + ')');
        return typeof reviver === 'function' ?
          walk({'': j}, '') : j;
      }
      throw new SyntaxError('JSON.parse');
    };
  }(Util));
}
