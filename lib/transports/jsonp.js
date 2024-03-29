var JSONP = exports.JSONP = function (req, res) {
  this.req = req;
  this.res = res;
  this.reqId = req.url.substr(req.url.lastIndexOf('/') + 1);
};

JSONP.prototype.flush = function (arr, flag) {
  if ((Array.isArray(arr) && arr.length) || (arguments.length === 2 && flag)) {
    arr = arr || [];
    if (this.res) {
      this.res.writeHead(200, {'Content-Type': 'text/javascript'});
      this.res.end('window["' + this.reqId +  '"](' + arr.map(JSON.stringify).join(', ') + ');');
      this.res = null;
    }
  }
};
