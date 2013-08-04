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
    var util = require('../lib/util');

    //default options
    var defaults = {
        server:false, //if true we will run the server instead of the client.
        serverPort:9090, //port the server should run on.
        clusterServer:false, //uses experimental cluster api
        silent: false, // logging on server will be disabled.
        globalAgentMaxSockets: 10000 //max sockets for globalAgent
    };

    //namespace for pound related variables
    var pound = {
        userOptions: util.extend(opts, defaults, false)
    };

    /**
     * Max sockets by default is 5, but we want more than that.
     * http://stackoverflow.com/questions/16472497/nodejs-max-socket-pooling-settings
     *
     * Set os limits
     * http://stackoverflow.com/questions/7578594/how-to-increase-limits-on-sockets-on-osx-for-load-testing
     *
     */
    function configureMaxSockets(http){
        http.globalAgent.maxSockets = pound.userOptions.globalAgentMaxSockets;
    }
    configureMaxSockets(http);

    var requestCount = 0;
    var server;

    function log(message){
        if(!pound.userOptions.silent){
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
    if(pound.userOptions.clusterServer){
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
            server.listen(pound.userOptions.serverPort);
        }


    }else{
        console.log('starting non-clustered server');
        //create the server
        server = http.createServer(handleRequest);
        //start the server
        server.listen(pound.userOptions.serverPort);
    }

    console.log('pound server listening on port: %s', pound.userOptions.serverPort);
};