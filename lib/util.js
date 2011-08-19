var Util = {};
if (typeof require !== 'undefined') {
  var rand = require('dcrypt').random;
  Util.EventEmitter = require('events').EventEmitter;
  module.exports = Util;
} else {
  var EventEmitter = function () {
    this._events = {};
  };

  EventEmitter.prototype.emit = function (ev) {
    var args = Util.arrayCopy(arguments);
    var events = this._events[ev];
    for (var i = 0, ll = this._events[ev]; i < ll; i++) {
      events[i].apply(this, args);
    }
  };

  EventEmitter.prototype.on = function (ev, fn) {
    if (!(ev in this._events)) {
      this._events[ev] = [];
    }
    this._events[ev].push(fn);
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
  arr[1].unshift(arr[0]);
  return arr[1];
};

Util.serialize = function (listener, args) {
  args = this.arrayCopy(args, 1);
  return JSON.stringify([listener, args]);
};

Util.generateRandomString = function () {
  return rand.randomBytes(16).toString('base64');
};

Util.hasProperty = function (obj, prop) {
  return Object.prototype.hasOwnProperty.call(Object(obj), prop);
};
