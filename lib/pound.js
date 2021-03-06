/**
 * Client module provides the ability to send multiple requests.
 * Several options are available regarding how the requests can be made, how often they're made, etc.
 * The starting point for processing is the 'main' function found below.
 * Typically this module is simply used as a function. Usage example can be found in /bin/pound.
 *
 * todo: provide callback option for each request, as well as when all requests are complete.
 * todo: don't always call process.exit, as other modules may be using this. (make it an option)
 * todo: allow this to be called from any module. stop assuming its being called from bin. (see above todos)
 * todo: add folder for performance snapshots for cpu, disk io, ram, etc.
 * @param opts - object literal with options.
 */
module.exports = function(opts){
    //modules
    var http = require('http');
    var util = require('../lib/util');

    //defaults
    var defaults = {
        //url: 'www.yahoo.com',
        urls: [
            'www.google.com', 'www.reddit.com', 'www.amazon.com', 'www.costco.com', 'www.bing.com',
            'www.cnn.com', 'www.apple.com', 'www.qvc.com', 'www.cbsnews.com', 'www.linkedin.com',
            'www.ask.com','www.youtube.com', 'www.wikipedia.org', 'www.cnet.com', 'www.adobe.com',
            'ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
            'www.akamai.com/css/akammaintab.css',
            'www.costco.com/wcsstore/CostcoGLOBALSAS/css/ui-lightness/jquery-ui-1.8.10.custom.css',
            'www.limelight.com/includes/Awesome_-_Script_-_zrssfeed',
            'www.edgecast.com/js/sitewide.js'],  //randomly request to these urls.
        requestMethod: 'GET',
        numberOfRequests: 20,
        port: 80,
        requestTimeout : 1000,
        headers: {},
        verbose:false, //for logging
        useAgents:false, //use agents will create an agent every n requests
        requestsPerSecond: 0, //if set will ensure that N requests are evenly distributed over a second.
        sendRequestsInBursts: false, //if set, requestsPerSecond will all be sent out at once, rather than evenly distributed over the second.
        burstIntervalMs: 200, //how often bursts should be sent
        requestsPerBurst: 100, //how many requests should be sent in a burst
        printStatusUpdateEveryNseconds: 5, //prints a status update every n seconds
        agentEveryNrequests: 20, //a new agent will be created every N requests.
        connectionHeader: 'close', //the connection request header value. keep-alive, close, etc.
        globalAgentMaxSockets: 10000 //max sockets for globalAgent
    };

    //create a namespace for pound related variables
    var pound = {
        openConnections:0,
        highestOpenConnectionsAtOneTime: 0,
        requestErrorCount: 0, //when req on 'error' is triggered, this will be incremented
        startMilliseconds: 0,  //helps determine how long processing took
        responsesReceived: 0, //total number of responses received
        requestsGenerated: 0, //total number of requests generated.
        requestIntervalId: false, //if requests per second option is used, this will hold the interval id so we can stop it.
        requestsAttempted: 0,
        requestsPerSecond: 0, //how many requests are being generated per second
        statusUpdateIntervalId: false,
        responsesPerSecond: 0 //how many responses are being received per second
    };

    /**
     * Main function will generate the desired number of requests to the url(s).
     * @param options - object which contains url, requestType, numberOfRequests, etc.
     */
    function main(options){
        //ensure we don't have the 5 open socket limit.
        configureMaxSockets(http);  //<-- this shouldn't be needed.

        //configure the agent provider (kept intentionally out of export so it can be moved to its own file)
        agentProvider.agentEveryNRequests = options.agentEveryNrequests;
        agentProvider.maxSockets = options.agentMaxSockets;

        console.log('pound is now going to make %s requests to url: %s', options.numberOfRequests, options.url);
        pound.startMilliseconds = new Date().getTime();

        if(options.sendRequestsInBursts){
            console.log('sending requests in bursts');
            pound.requestIntervalId = setInterval(function(){

                for(var x=0; x < options.requestsPerBurst; ++x){
                    if(pound.requestsAttempted++ >= options.numberOfRequests){
                        clearInterval(pound.requestIntervalId);
                        return;
                    }
                    makeRequest(options, responseEndCallback, pound.requestsAttempted);
                }
            }, options.burstIntervalMs);
        }else if(options.requestsPerSecond > 0){
            var interval = 1000 / options.requestsPerSecond;   // 200 rps == once every 5 milliseconds
            console.log('will generate a request once every %s milliseconds', interval);
            pound.requestIntervalId = setInterval(function(){
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

        //start printing metrics every N seconds to the console.
        startStatusUpdates();
    }

    /**
     * Will print totals once every N seconds
     */
    function startStatusUpdates(){
        if(!pound.userOptions.printStatusUpdateEveryNseconds){return;}
        var intervalCount = 1;
        pound.statusUpdateIntervalId = setInterval(function(){
            console.log('============= status update %s ==================', intervalCount++);
            printTotals();
        }, pound.userOptions.printStatusUpdateEveryNseconds * 1000);

    }

    /**
     * Prints totals to the console.
     */
    function printTotals(){
        var endMilliseconds = new Date().getTime();
        var totalMilliseconds = endMilliseconds - pound.startMilliseconds;
        console.log('pound completed %s requests in %s ms. \nreceived responses: %s. \nhighest number of open connections was: %s. \nrequest errors: %s' +
                '\nrequests per second: %s. \nresponses per second: %s',
            pound.requestsGenerated,  totalMilliseconds,
            pound.responsesReceived,
            pound.highestOpenConnectionsAtOneTime,
            pound.requestErrorCount,
            pound.requestsPerSecond,
            pound.responsesPerSecond);
    }

    /**
     * when ctrl+c is used, print a summary.
     */
    function finishedProcess(){
        console.log('xxxxxxxxxxxxxxxxxxxx process manually terminated xxxxxxxxxxxxxxxxxxxxxx')
        printTotals();
        clearInterval(pound.statusUpdateIntervalId);
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
        http.globalAgent.maxSockets = pound.userOptions.globalAgentMaxSockets;//Infinity;
    }

    /**
     * makes a single http request using the provided options.
     * collects metrics which are used in status updates, process exit, process finished, etc.
     *
     * todo: add response time, connect time, response size
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
                'connection': options.connectionHeader,  //'close' or 'keep-alive'
                'requestid': requestId
            }
        };

        //initiate the request
        var req = http.request(requestOptions, function(res) {
            //console.log('creating request');
            pound.openConnections++;//increment count to keep track
            pound.requestsGenerated++;
            pound.requestsPerSecond = pound.requestsGenerated / ((new Date().getTime() - pound.startMilliseconds) / 1000);
            //console.log('open connections %s - open', pound.openConnections);
            pound.highestOpenConnectionsAtOneTime = pound.openConnections > pound.highestOpenConnectionsAtOneTime ? pound.openConnections : pound.highestOpenConnectionsAtOneTime;

            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            //res.setEncoding('utf8');

            //Indicates that the underlaying connection was terminated before response.end() was called or able to flush.
            res.on('close', function(){   // this isn't getting called.
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
            pound.responsesPerSecond = pound.responsesReceived / ((new Date().getTime() - pound.startMilliseconds) / 1000);
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
    process.on('uncaughtException', function(err) {
        console.log('Caught exception: ' + err);
    });

    //run the program
    pound.userOptions = util.extend(opts, defaults, false);
    main(pound.userOptions);
};


/**
 * agentProvider will create and return a new agent every N calls to getAgent (i.e. when a request is made).
 * todo: move to another file?
 * @type {*}
 */
var httpForAgent = require('http');
var agentProvider = {
    agentEveryNRequests:20,//new agent will be created after N getAgent calls
    agentMaxSockets:20,
    _agentRequestCount:0,
    _currentAgent:false,
    getAgent: function(){
        if(!this._currentAgent || ++this._agentRequestCount % this.agentEveryNRequests == 0){
            //console.log('creating a new agent');
            this._currentAgent = new httpForAgent.Agent();
            this._currentAgent.maxSockets = this.agentMaxSockets;
        }
        return this._currentAgent;
    },
    agentPool: []
};

