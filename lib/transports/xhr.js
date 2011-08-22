var XHR = exports.XHR = function (req, res) {
  this.req = req;
  this.res = res;
  this.reqId = req.url.substr(req.url.lastIndexOf('/') + 1);
};

XHR.prototype.flush = function (arr, flag) {
  if ((Array.isArray(arr) && arr.length) || (arguments.length === 2 && flag)) {
    arr = arr || [];
    if (this.res) {
      var data = '[' + arr.map(JSON.stringify).join(', ') + ']';
      this.res.writeHead(200, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Length': data === undefined ? 0 : Buffer.byteLength(data),
        'Connection': 'Keep-Alive'
      });
      this.res.end(data);
      this.res = null;
    }
  }
};
