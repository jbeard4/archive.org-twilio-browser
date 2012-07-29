var http = require('http'),
    urlModule = require('url');

function playPick(res,api){

    function handleError(err){
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(err.message);
    }

    api.archive.getPicksOfTheDay(function(err,picks){
        if(err) return handleError(err);

        api.archive.getDetail(picks.etree.identifier,function(err,detail){
            if(err) return handleError(err);

            var urls = api.archive.getUrlsFromDetail(detail).
                            filter(function(url){return url.match(/.mp3$/);}).
                            filter(function(url){return !url.match(/_vbr.mp3$/);});  //filter out vbr-encoded mp3s

            //get the urls to make sure they actually work
            api.archive.filterUrls(urls,function(goodUrls){

                var result = '<Response>' +
                        '<Say>Playing the archive dot org Live music picks</Say>' +
                        '<Say>Press star to listen to the next song. Press a digit to return to the main menu.</Say>' +
                        '<Say>' +  picks.etree.title + '</Say>' +
                        '<Say>Please wait while the songs are loaded</Say>' +
                        goodUrls.map(function(url){return '<Gather numDigits="1" finishOnKey="*" action="/" method="GET" ><Play>' + url + "</Play></Gather>";})  + 
                        '<Redirect method="GET">/</Redirect>' + 
                    '</Response>';

                console.log("returning result",result);

                res.writeHead(200, {'Content-Type': 'application/xml'});
                res.end(result);
            },api);

        });
    }); 

}
