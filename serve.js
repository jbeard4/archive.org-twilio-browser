//initially, pull from archive.org's main page, eval result. use that to pull down the track, and play it
var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response>' + 
        '    <Say voice="woman" language="fr">Chapeau!</Say>' + 
        '</Response>');
}).listen(1337);
console.log('Server running at http://127.0.0.1:1337/');
