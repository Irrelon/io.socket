
module.exports = {
  EventEmitter: require('events').EventEmitter,
  arrayCopy: function (arg, index) {
    index = index || 0;
    var arr = [];
    for (var i = index, ll = arg.length; i < ll; i++) {
      arr[i] = arg[i];
    }
    return arr;
  },
  deserialize: function (str) {
    var arr = JSON.parse(str);
    arr[1].unshift(arr[0]);
    return arr[1];
  },
  serialize: function (listener) {
    var args = this.arrayCopy(arguments, 1);
    return JSON.stringify([listener, args]);
  }

};
