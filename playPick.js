var http = require('http'),
    archive = require('./archive-lib'),
    async = require('async'),
    urlModule = require('url');

function playPick(res){

    function handleError(err){
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(err.message);
    }

    archive.getPicksOfTheDay(function(err,picks){
        if(err) return handleError(err);

        archive.getDetail(picks.etree.identifier,function(err,detail){
            if(err) return handleError(err);

            var urls = archive.getUrlsFromDetail(detail).
                            filter(function(url){return url.match(/.mp3$/);}).
                            filter(function(url){return !url.match(/_vbr.mp3$/);});  //filter out vbr-encoded mp3s

            //get the urls to make sure they actually work
            async.filter(urls,function(url,cb){
                var oUrl = urlModule.parse(url); 

                var opt = {
                    host : oUrl.host,
                    path : oUrl.path,
                    port : 80,
                    protocol : oUrl.protocol,
                    method : 'HEAD'
                };
                
                console.log("requesting ",url,opt);
                var req = http.request(opt,function(res){
                    console.log("received response to url",url,res.statusCode);
                    cb(res.statusCode === 200);
                });
                req.on("error",function(e){
                    console.log("Received http error when requesting url.",e);
                    cb(false);
                });
                req.end();
            },function(goodUrls){
                if(err) return handleError(err);

                res.writeHead(200, {'Content-Type': 'application/xml'});
                res.end(
                    '<Response>' +
                        '<Say>Playing the archive dot org Live music picks</Say>' +
                        '<Say>' +  picks.etree.title + '</Say>' +
                        '<Say>Please wait while the songs are loaded</Say>' +
                        goodUrls.map(function(url){return "<Play>" + url + "</Play>";}).join("\n") + 
                        "<Redirect>http://jacobbeard.net:1337/</Redirect>" + 
                    '</Response>');
                });

        });
    }); 

}
