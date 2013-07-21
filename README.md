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

### Mac OS Limits
If you want more than 256 simultaneous requests to be open at a time, you'll need to first run this command in the terminal you're running pound in:
```bash
ulimit -n 257
pound url=www.google.com numberOfRequests=257
```

ulimit will allow up to 10240 open sockets/requests at a time.  If you need more than that, you can run the following:
```bash
$ sysctl kern.maxfiles
kern.maxfiles: 12288
$ sysctl kern.maxfilesperproc
kern.maxfilesperproc: 10240
$ sudo sysctl -w kern.maxfiles=1048600
kern.maxfiles: 12288 -> 1048600
$ sudo sysctl -w kern.maxfilesperproc=1048576
kern.maxfilesperproc: 10240 -> 1048576
$ ulimit -S -n
256
$ ulimit -S -n 1048576
$ ulimit -S -n
1048576
```

If you don't wish to wait for all the responses to finish, you can ctrl+c to exit and still get the status message.


## Roadmap
- provide simple server which can help assess node.js load capabilities (i.e. determine the max load a node process can handle)
- websocket support
- provide ability to throttle requests per second.
- configuration file for pounding multiple urls. e.g. pound config=/Users/me/poundConfig.js
- provide more detailed metrics (average response time, responses completed per second, etc)
