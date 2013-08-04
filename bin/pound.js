#!/usr/bin/env node
console.log('bin pound running...');

//modules
var pound = require('../lib/pound');
var poundServer = require('../lib/poundServer');

//grab array of process arguments, excluding the first 2 (e.g. node pound)
var poundArguments = process.argv.splice(2);
/**
 * Takes arguments passed in from the console and puts them into the options object.
 * e.g. node pound url='http://www.google.com' numberOfRequests=30
 * {url:'http://www.google.com', numberOfRequests:20}
 */
function getOptionsFromProcessArguments(){
    var optionsFromProcess = {};
    //var poundArguments = process.argv.splice(2);
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
        optionsFromProcess[optionName] = optionValue;
    });
    return optionsFromProcess;
}

var userOptions = getOptionsFromProcessArguments();
console.log(JSON.stringify(userOptions));

//run the program
if(userOptions.server){
    console.log('running the pound server');
    poundServer(userOptions, poundArguments);
}else{
    console.log('running the pound client');
    pound(userOptions);
}



