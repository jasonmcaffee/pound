module.exports = function(opts){
    //modules
    var http = require('http');

    //create namespace for pound related variables
    var pound = {
        openConnections:0,
        highestOpenConnectionsAtOneTime: 0,
        requestErrorCount: 0, //when req on 'error' is triggered, this will be incremented
        startMilliseconds: 0  //helps determine how long processing took
    };

    /**
     * Main function will generate the desired number of requests to the url(s).
     * @param options - object which contains url, requestType, numberOfRequests, etc.
     */
    function main(options){
        //ensure we don't have the 5 open socket limit.
        configureMaxSockets(http);

        console.log('pound is now going to make %s requests to url: %s', options.numberOfRequests, options.url);
        pound.startMilliseconds = new Date().getTime();

        //generate the desired number of requests.
        for(var i=0; i < options.numberOfRequests; ++i){
            makeRequest(options, responseEndCallback, i);
        }

        //determine when processing has completed.
        var callbackCount = 0; //helps establish when we've finished.
        //callback for each request. last request will trigger summary.
        function responseEndCallback(requestId){
            if(++callbackCount >= options.numberOfRequests){
                finishedProcess();
            }
        }

        //listen for ctrl+c. print a report and exit the process gracefully.
        process.on('SIGINT', finishedProcess);
    }

    /**
     * when all responses have completed, or ctrl+c is used, print a summary.
     */
    function finishedProcess(){
        var endMilliseconds = new Date().getTime();
        var totalMilliseconds = endMilliseconds - pound.startMilliseconds;
        console.log('pound completed %s requests in %s ms. highest number of open connections was %s. request errors: %s', opts.numberOfRequests, totalMilliseconds, pound.highestOpenConnectionsAtOneTime, pound.requestErrorCount);
        process.exit();
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

        //seperate the base url from the path.
        var firstSlashIndex = url.indexOf('/');
        if(firstSlashIndex >= 0){
            path = url.substr(firstSlashIndex);
            url = url.substr(0, firstSlashIndex);
        }

        //create the request options for the http.request api.
        var requestOptions = {
            hostname: url,
            port: options.port,
            path: path,
            method: options.requestMethod
        };

        //initiate the request
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

        //log request errors.
        req.on('error', function(e) {
            pound.requestErrorCount++;
            console.warn('problem with request to url: %s   message: %s', this.url, e.message);
        }.bind({url:url}));

        //TODO: allow for request timeouts?
        //    req.setTimeout(options.requestTimeout, function(e){
        //        console.log('timeout for url %s', this.url);
        //        this.req.end();
        //        this.req.destroy();
        //    }.bind({url:url, req:req}));

        // write data to request body
        //req.write('data\n');
        //req.write('data\n');
        req.end();
    }

    //run the program
    main(opts);
};

