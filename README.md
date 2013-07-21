#pound
=====
Pound provides load testing capabilities by generating requests to urls.

## Install
sudo npm install -g poundjs

## Usage
```bash
pound url=www.google.com numberOfRequests=200
```
should result in a message like:
```bash
pound completed 200 requests in 25186 ms. highest number of open connections was 191. request errors: 14
```

Note: if you need want more than 256 simultaneous requests, you'll need to first run this command in the terminal you're running pound in:
```bash
ulimit -n 257
pound url=www.google.com numberOfRequests=257
```

If you don't wish to wait for all the responses to finish, you can ctrl+c to exit and still get the status message.


## Roadmap
provide simple server which can help assess node.js load capabilities (i.e. determine the max load a node process can handle)
websocket support

