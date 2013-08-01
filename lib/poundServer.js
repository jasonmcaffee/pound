/**
 * Todo: add option for setTimeout on responses so we can see limits for connections
 * Todo: add connection counter.
 * Todo: add status update interval.
 * @param opts
 * @param originalArgs
 */

module.exports = function(opts, originalArgs){
    //console.log('pound server starting');

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
        http.globalAgent.maxSockets = opts.globalAgentMaxSockets;
    }
    configureMaxSockets(http);

    var requestCount = 0;
    var server;

    function log(message){
        if(!opts.silent){
            console.log(message);
        }

    }
    function handleRequest(req, res){
        ++requestCount;
        var requestId = req.headers['requestid'];
        log('pound server received request number: ' + requestCount + ' requestId: ' + requestId);
        log(req.headers['connection']);


        res.writeHead(200, {'Content-Type': 'text/plain'});

        res.write('request number: ' + requestCount);
        //res.end('request number: ' + requestCount);
        res.end();
    }

    var cluster = require('cluster');
    var numCPUs = require('os').cpus().length;
    if(opts.clusterServer){
        if(cluster.isMaster){
            console.log('server will cluster across %s cpus', numCPUs);

            cluster.setupMaster({
                exec : "pound.js",
                args : originalArgs,
                silent : false
            });
            for(var i=0; i <numCPUs; ++i){
                cluster.fork();
            }
            cluster.on('exit', function(worker, code, signal){
                console.log('worker ' + worker.process.pid + ' died');
            });
        }else{
            console.log('worker server starting');
            server = http.createServer(handleRequest);
            //start the server
            server.listen(opts.serverPort);
        }


    }else{
        console.log('starting non-clustered server');
        //create the server
        server = http.createServer(handleRequest);
        //start the server
        server.listen(opts.serverPort);
    }








    console.log('pound server listening on port: %s', opts.serverPort);
};