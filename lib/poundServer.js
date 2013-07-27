module.exports = function(opts){
    console.log('pound server starting');

    //modules
    var http = require('http');

    /**
     * Max sockets by default is 5, but we want more than that.
     * http://stackoverflow.com/questions/16472497/nodejs-max-socket-pooling-settings
     *
     * Set os limits
     * http://stackoverflow.com/questions/7578594/how-to-increase-limits-on-sockets-on-osx-for-load-testing
     *
     */
    function configureMaxSockets(http){
        http.globalAgent.maxSockets = 10000;
    }
    configureMaxSockets(http);

    var requestCount = 0;
    //create the server
    var server = http.createServer(function (req, res) {
        ++requestCount;
        var requestId = req.headers['requestid'];
        console.log('pound server received request number: ' + requestCount + ' requestId: ' + requestId);
//        for(var item in req.headers) {
//            console.log(item + ": " + req.headers[item]);
//        }
        console.log(req.headers['connection']);


        res.writeHead(200, {'Content-Type': 'text/plain'});

        res.write('request number: ' + requestCount);
        //res.end('request number: ' + requestCount);
        res.end();
    });

    //start the server
    server.listen(opts.serverPort);

    console.log('pound server listening on port: %s', opts.serverPort);
};