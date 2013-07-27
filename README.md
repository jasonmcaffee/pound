#pound
=====
Pound is a load testing client which generates N requests to specified urls.
Pound also provides a light-weight server setup so you can determine the processing power of node.

## Current Benchmarks
Client: Macbook Pro
Server: Hackintosh 10.6.8. 16GB RAM, SSD Hard drive, 3.31 GHz Intel Core i5
Network: Local wifi

Using command
```bash
pound url=192.168.0.130 port=9090 numberOfRequests=10000 requestsPerSecond=1000 useAgents=true
```
Results in:

```bash
pound completed 10000 requests in 13075 ms.
received responses: 10000.
highest number of open connections was: 1.
request errors: 0
requests per second: 764.81835556405354.
responses per second: 764.81835556405354
```

NOTE: Performance does seem to degrade over time. with 20000 requests, requests per second got up to ~765, but usually ends up around ~525.


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
All options via the terminal should be space separated, in a name=value format.

e.g.
```bash
pound url=www.google.com port=80 numberOfRequests=10
```
##### url
The url to the resource you wish the client to request.

Do not prepend 'http://' as it is not needed and will cause an error.

Paths and query string params are fine.

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

##### numberOfRequests
default: 200

The number of requests you wish to be immediately created, as quickly as possible, to the provided url or set of urls.

##### requestsPerSecond
default: disabled

If set, an interval will be created to send N requests per second instead of sending them all at once.

Note: you may not be able to get down to sub-milliseconds with this option.

##### useAgents
default: false

If set to true, an http agent will be created and used for a set of requests, instead of using the default global agent.

##### printStatusUpdateEveryNseconds
default: 5

prints out total requests, responses received, etc. every N seconds. Useful when you need visibility into what's going on for high number of requests.

NOTE: these are running totals, and not just the totals for the status update interval.

#### Client Request Errors

##### Unknown system errno 23. syscall: connect
see https://github.com/jasonmcaffee/pound/issues/2

##### ECONNRESET syscall: read
see https://github.com/jasonmcaffee/pound/issues/1

### Server
To start the pound server, pass 'server=true' to pound:
```bash
pound server=true
```
By default the server will listen on port 9090

The server will simply respond with a text/plain body which will tell you the request number
```bash
pound server received request number: 48
```
NOTE: 2 requests are issued when you load the server url in your browser. The extra one is for the favicon.

NOTE: see the MAC OS Limits section above if you wish to process more than 256 requests at a time.

#### Server Options
###### server
default: false

set to true if you wish to start the server
###### serverPort
default: 9090

the port you wish the server to listen on.


## Roadmap
- server option for type. e.g. web server, net (simple socket), web socket, etc.
- websocket support
- provide ability to throttle requests per second.
- configuration file for pounding multiple urls. e.g. pound config=/Users/me/poundConfig.js
- provide more detailed metrics (average response time, responses completed per second, etc)
- use clustering for client and server to allow higher volumes.
