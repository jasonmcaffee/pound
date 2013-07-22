#pound
=====
Pound is a load testing client which generates N requests to specified urls.
Pound also provides a light-weight server setup so you can determine the processing power of node.


## Install
```bash
sudo npm install -g poundjs
```

## Usage
### Client
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

#### Client Options
All options via the terminal should be space separated, in a <name>=<value> format.
e.g.
```bash
pound url=www.google.com port=80 numberOfRequests=10
```
##### url
the url to the resource you wish the client to request.
do not prepend 'http://' as it is not needed and will cause an error.
paths and query string params are fine.
If you do not supply a url, a random url from a predefined array of urls will be used.
```bash
pound url=www.example.com/someFile.js?q=true
```

##### urls
default: predefined array of urls
not supported from the command line yet.

##### port
default: 80
the port to use when connecting to a server/url.

##### requestMethod
default: GET
the request method you wish to use. should be in upper case.

### Server
To start the pound server, pass 'server=true' to pound:
```bash
pound server=true
```
By default the server will listen on port 9090
NOTE: see the MAC OS Limits section above if you wish to process more than 256 requests at a time.

#### Server Options
###### server
set to true if you wish to start the server
###### serverPort
the port you wish the server to listen on.


## Roadmap
- provide simple server which can help assess node.js load capabilities (i.e. determine the max load a node process can handle)
- websocket support
- provide ability to throttle requests per second.
- configuration file for pounding multiple urls. e.g. pound config=/Users/me/poundConfig.js
- provide more detailed metrics (average response time, responses completed per second, etc)
- use clustering for client and server to allow higher volumes.
