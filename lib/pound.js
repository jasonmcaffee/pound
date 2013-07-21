//modules
var http = require('http');

module.exports = function(opts){
    //create namespace for pound vars
    var pound = {
        openConnections:0,
        highestOpenConnectionsAtOneTime: 0,
        requestErrorCount: 0 //when req on 'error' is triggered, this will be incremented
    };


    /**
     * Beginning of program
     * @param options - object which contains url, requestType, numberOfRequests, etc.
     */
    function main(options){
        console.log('main');

        configureMaxSockets(http);

        console.log('making %s requests to url: %s', options.numberOfRequests, options.url);
        var startMilliseconds = new Date().getTime();

        function finishedProcess(){
            var endMilliseconds = new Date().getTime();
            var totalMilliseconds = endMilliseconds - startMilliseconds;
            console.log('pound completed %s requests in %s ms. highest number of open connections was %s. request errors: %s', options.numberOfRequests, totalMilliseconds, pound.highestOpenConnectionsAtOneTime, pound.requestErrorCount);
            process.exit();
        }

        //listen for ctrl+c
        process.on('SIGINT', finishedProcess);

        var callbackCount = 0; //helps establish when we've finished.
        //print out summary when the last request is made.
        function responseEndCallback(requestId){
            if(++callbackCount >= options.numberOfRequests){
                finishedProcess();
            }
        }
        for(var i=0; i < options.numberOfRequests; ++i){
            makeRequest(options, responseEndCallback, i);
        }

    }

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

    /**
     * makes a single http request using the provided options
     *
     * @param options - url, etc
     * @param responseEndCallback - will be executed when response 'end' event occurs.
     */
    function makeRequest(options, responseEndCallback, requestId){
        //console.log('making request to url: ' + options.url);
        var url = options.url,
            path = '';

        if(!options.url){
            var randomIndex=Math.floor(Math.random()*options.urls.length);//randomly select an index in the urls array
            url = options.urls[randomIndex];
            //console.log('url: %s randomIndex: %s', url, randomIndex);
        }

        var firstSlashIndex = url.indexOf('/');
        if(firstSlashIndex >= 0){
            path = url.substr(firstSlashIndex);
            url = url.substr(0, firstSlashIndex);
        }
        var requestOptions = {
            hostname: url,
            port: options.port,
            path: path,
            method: options.requestMethod
        };

        var req = http.request(requestOptions, function(res) {
            pound.openConnections++;//increment count to keep track
            //console.log('open connections %s - open', pound.openConnections);
            pound.highestOpenConnectionsAtOneTime = pound.openConnections > pound.highestOpenConnectionsAtOneTime ? pound.openConnections : pound.highestOpenConnectionsAtOneTime;

            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');

            res.on('end', function(){
                pound.openConnections--;
                //console.log('open connections %s - close', pound.openConnections);
                if(responseEndCallback){
                    responseEndCallback(this.requestId);
                }
                //console.log('response is complete.');
            }.bind({requestId:requestId}));

            res.on('data', function (chunk) {
                //console.log('\n\n\n\n\nBODY: ' + chunk);
            });
        }.bind({requestId:requestId}));

        req.on('error', function(e) {
            pound.requestErrorCount++;
            console.warn('problem with request to url: %s   message: %s', this.url, e.message);
        }.bind({url:url}));

//    req.setTimeout(options.requestTimeout, function(e){
//        console.log('timeout for url %s', this.url);
//        this.req.end();
//        this.req.destroy();
//    }.bind({url:url, req:req}));
        // write data to request body
        req.write('data\n');
        req.write('data\n');
        req.end();
    }

    main(opts);

//console.log('pound.js has completed');
};

