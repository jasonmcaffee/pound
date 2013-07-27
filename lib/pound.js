/**
 * Client module provides the ability to send multiple requests.
 * Several options are available regarding how the requests can be made, how often they're made, etc.
 * The starting point for processing is the 'main' function found below.
 * Typically this module is simply used as a function. Usage example can be found in /bin/pound.
 *
 * todo: provide callback option for each request, as well as when all requests are complete.
 * todo: don't always call process.exit, as other modules may be using this. (make it an option)
 * @param opts
 */
module.exports = function(opts){
    //modules
    var http = require('http');

    //create namespace for pound related variables
    var pound = {
        openConnections:0,
        highestOpenConnectionsAtOneTime: 0,
        requestErrorCount: 0, //when req on 'error' is triggered, this will be incremented
        startMilliseconds: 0,  //helps determine how long processing took
        responsesReceived: 0, //total number of responses received
        requestsGenerated: 0, //total number of requests generated.
        requestIntervalId: false, //if requests per second option is used, this will hold the interval id so we can stop it.
        requestsAttempted: 0,
        statusUpdateIntervalId: false
    };

    /**
     * Main function will generate the desired number of requests to the url(s).
     * @param options - object which contains url, requestType, numberOfRequests, etc.
     */
    function main(options){
        //ensure we don't have the 5 open socket limit.
        configureMaxSockets(http);  //<-- this shouldn't be needed.

        console.log('pound is now going to make %s requests to url: %s', options.numberOfRequests, options.url);
        pound.startMilliseconds = new Date().getTime();

        if(options.requestsPerSecond > 0){
            var interval = 1000 / options.requestsPerSecond;   // 200 rps == once every 5 milliseconds
            console.log('will generate a request once every %s milliseconds', interval);
            pound.requestIntervalId = setInterval(function(){
                //console.log('interval running..');

                if(pound.requestsAttempted++ < options.numberOfRequests){
                    makeRequest(options, responseEndCallback, pound.requestsAttempted);
                }else{
                    clearInterval(pound.requestIntervalId);
                }
            }, interval);
        }else{
            //generate the desired number of requests.
            for(; pound.requestsAttempted < options.numberOfRequests; ++pound.requestsAttempted){
                makeRequest(options, responseEndCallback, pound.requestsAttempted);
            }
        }


        //determine when processing has completed.
        var callbackCount = 0; //helps establish when we've finished.
        //callback for each request. last request will trigger summary.
        function responseEndCallback(requestId){
            //if(++callbackCount >= options.numberOfRequests){
            if(pound.responsesReceived + pound.requestErrorCount >= options.numberOfRequests){
                console.log('################### done processing #######################');
                printTotals();
                clearInterval(pound.requestIntervalId);
                clearInterval(pound.statusUpdateIntervalId);
            }
        }

        //listen for ctrl+c. print a report and exit the process gracefully.
        process.on('SIGINT', finishedProcess);

        startStatusUpdates();
    }

    /**
     * Will print totals once every N seconds
     */
    function startStatusUpdates(){
        if(!opts.printStatusUpdateEveryNseconds){return;}
        var intervalCount = 1;
        pound.statusUpdateIntervalId = setInterval(function(){
            console.log('============= status update %s ==================', intervalCount++);
            printTotals();
        }, opts.printStatusUpdateEveryNseconds * 1000);

    }
    function printTotals(){
        var endMilliseconds = new Date().getTime();
        var totalMilliseconds = endMilliseconds - pound.startMilliseconds;
        console.log('pound completed %s requests in %s ms. \nreceived responses: %s. \nhighest number of open connections was: %s. \nrequest errors: %s',
            pound.requestsGenerated,  totalMilliseconds,
            pound.responsesReceived,
            pound.highestOpenConnectionsAtOneTime,
            pound.requestErrorCount);
    }
    /**
     * when all responses have completed, or ctrl+c is used, print a summary.
     */
    function finishedProcess(){
        console.log('xxxxxxxxxxxxxxxxxxxx process manually terminated xxxxxxxxxxxxxxxxxxxxxx')
        printTotals();
        clearInterval(pound.statusUpdateIntervalId);
        process.exit();
    }

    /**
     * Deprecated do to global agent causing ECONNRESET issues???
     * Max sockets by default is 5, but we want more than that.
     * http://stackoverflow.com/questions/16472497/nodejs-max-socket-pooling-settings
     *
     * Set os limits
     * http://stackoverflow.com/questions/7578594/how-to-increase-limits-on-sockets-on-osx-for-load-testing
     *
     */
    function configureMaxSockets(http){
        http.globalAgent.maxSockets = 10240;//Infinity;
    }

    /**
     * makes a single http request using the provided options
     *
     * @param options - url, etc
     * @param responseEndCallback - will be executed when the response is received.
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

        //try using agent to get around ECONNRESET. seems to work!
        //var agent = new http.Agent();
        //agent.maxSockets = 20;    //1 socket = 1936/2000 success. 10 socket = 1995/2000 success. 20 socket = 2000/2000 success!
        var agent = options.useAgents ? agentProvider.getAgent() : false;     //false;//

        //create the request options for the http.request api.
        var requestOptions = {
            hostname: url,
            port: options.port,
            path: path,
            method: options.requestMethod,
            agent:agent, //try to fix ECONNRESET, socket closed issue.
            headers:{
                'connection':'close',
                'requestid': requestId
            }
        };

        //initiate the request
        var req = http.request(requestOptions, function(res) {
            //console.log('creating request');
            pound.openConnections++;//increment count to keep track
            pound.requestsGenerated++;
            //console.log('open connections %s - open', pound.openConnections);
            pound.highestOpenConnectionsAtOneTime = pound.openConnections > pound.highestOpenConnectionsAtOneTime ? pound.openConnections : pound.highestOpenConnectionsAtOneTime;

            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            //res.setEncoding('utf8');

            //Indicates that the underlaying connection was terminated before response.end() was called or able to flush.
            res.on('close', function(){
                console.log('response close called');
            });

            res.on('end', function(){
                pound.openConnections--;
            });
            //then you must consume the data from the response object, either by calling response.read() whenever there is a 'readable' event
            res.on('readable', function(message){
                //console.log('readable event fired');
                res.read();
            });

        }.bind({requestId:requestId}));

        //wait for the response
        /**
         * http://nodejs.org/docs/latest/api/http.html#http_class_http_agent
         * If no 'response' handler is added, then the response will be entirely discarded. However, if you add a 'response' event handler, then you must consume the data from the response object,
         * either by calling response.read() whenever there is a 'readable' event, or by adding a 'data' handler, or by calling the .resume() method.
         * Until the data is consumed, the 'end' event will not fire.
         */
        req.on('response', function(resp){
            //console.log('response received');
            //pound.openConnections--;
            pound.responsesReceived++;
            //console.log('open connections %s - close', pound.openConnections);
            if(responseEndCallback){
                responseEndCallback(this.requestId);
            }
        });

        //log request errors.
        req.on('error', function(e) {
            pound.requestErrorCount++;
            console.warn('problem with requestId: %s to url: %s   message: %s \n complete: %s', this.requestId, this.url, e.message, JSON.stringify(e));
        }.bind({url:url, requestId:requestId}));

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

    //todo: this isn't firing for the ECONNRESET error.
    process.on('error', function(err){
        console.log('process error: ' + JSON.stringify(err));
    });

    //run the program
    main(opts);
};

/**
 * agentProvider will create and return a new agent every N calls to getAgent (i.e. when a request is made).
 * @type {*}
 */
var httpForAgent = require('http');
var agentProvider = {
    agentEveryNRequests:20,//new agent will be created after N getAgent calls
    _agentRequestCount:0,
    _currentAgent:false,
    getAgent: function(){
        if(!this._currentAgent || ++this._agentRequestCount % this.agentEveryNRequests == 0){
            //console.log('creating a new agent');
            this._currentAgent = new httpForAgent.Agent();
            this._currentAgent.maxSockets = this.agentEveryNRequests;
        }
        return this._currentAgent;
    },
    agentPool: []
};



//            res.on('end', function(){
//                pound.openConnections--;
//                pound.responsesReceived++;
//                //console.log('open connections %s - close', pound.openConnections);
//                if(responseEndCallback){
//                    responseEndCallback(this.requestId);
//                }
//
//                //console.log('response is complete.');
//            }.bind({requestId:requestId}));

//            res.on('data', function (chunk) {
//                //console.log('\n\n\n\n\nBODY: ' + chunk);
//            });

