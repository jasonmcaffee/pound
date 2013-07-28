#!/usr/bin/env node

console.log('bin pound running...');

//modules
var pound = require('../lib/pound');
var poundServer = require('../lib/poundServer');


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
    server:false, //if true we will run the server instead of the client.
    serverPort:9090, //port the server should run on.
    useAgents:false, //use agents will create an agent every n requests
    requestsPerSecond: 0, //if set will ensure that N requests are evenly distributed over a second.
    sendRequestsInBursts: false, //if set, requestsPerSecond will all be sent out at once, rather than evenly distributed over the second.
    burstIntervalMs: 200, //how often bursts should be sent
    requestsPerBurst: 100, //how many requests should be sent in a burst
    printStatusUpdateEveryNseconds: 5 //prints a status update every n seconds
};

/**
 * Takes arguments passed in from the console and puts them into the options object.
 * e.g. node pound url='http://www.google.com' numberOfRequests=30
 * {url:'http://www.google.com', numberOfRequests:20}
 */
function getOptionsFromProcessArguments(){
    var poundArguments = process.argv.splice(2);
    poundArguments.forEach(function (val, index, array) {
        console.log(index + ': ' + val);

        if(val.indexOf('=') < 0){return;}

        //expect the args to be in 'name=val' format
        var optionNameValueArr = val.split('=');
        var optionName = optionNameValueArr[0];
        var optionValue = optionNameValueArr[1];

        if(optionValue.indexOf(',') >= 0){
            optionValue = optionValue.split(',');
        }


        defaults[optionName] = optionValue;
    });
    return defaults;
}

var userOptions = getOptionsFromProcessArguments();
//console.log(JSON.stringify(userOptions));

//run the program
if(userOptions.server){
    console.log('running the pound server');
    poundServer(userOptions);
}else{
    console.log('running the pound client');
    pound(userOptions);
}



