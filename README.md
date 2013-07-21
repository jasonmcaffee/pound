#pound
=====
Pound provides load testing capabilities by generating requests to specified urls.

## Install
```bash
sudo npm install -g poundjs
```

## Usage
You can use pound from the terminal to generate requests to a given url.
For example, we can generate 200 requests to www.google.com by running the following:
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
- provide simple server which can help assess node.js load capabilities (i.e. determine the max load a node process can handle)
- websocket support
- provide ability to throttle requests per second.
- configuration file for pounding multiple urls. e.g. pound config=/Users/me/poundConfig.js
- provide more detailed metrics (average response time, responses completed per second, etc)
