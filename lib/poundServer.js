module.exports = function(opts){
    console.log('pound server starting');

    var http = require('http');

    var server = http.createServer(function (req, res) {
        console.log('pound server received request');
        res.writeHead(200, {'Content-Type': 'text/plain'});

        res.write('hello');
        res.end();
    });
    server.listen(opts.serverPort);
};