var Util = {};
if (typeof require !== 'undefined') {
  module.exports = Util;
  var rand = require('dcrypt').random;

  Util.EventEmitter = require('events').EventEmitter;

  Util.generateRandomString = function () {
    return rand.randomBytes(16).toString('base64');
  };

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
  var arr = JSON.parse(str);
  if (!Array.isArray(arr[1])) {
    return false;
  }
  arr[1].unshift(arr[0]);
  return arr[1];
};

Util.serialize = function (listener, args) {
  args = this.arrayCopy(args, 1);
  return JSON.stringify([listener, args]);
};

Util.hasProperty = function (obj, prop) {
  return Object.prototype.hasOwnProperty.call(Object(obj), prop);
};
