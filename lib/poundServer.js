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
        http.globalAgent.maxSockets = Infinity;
    }
    configureMaxSockets(http);

    var requestCount = 0;
    //create the server
    var server = http.createServer(function (req, res) {
        ++requestCount;
        console.log('pound server received request number: ' + requestCount);
        res.writeHead(200, {'Content-Type': 'text/plain'});

        res.write('request number: ' + requestCount);
        res.end();
    });

    //start the server
    server.listen(opts.serverPort);

    console.log('pound server listening on port: %s', opts.serverPort);
};