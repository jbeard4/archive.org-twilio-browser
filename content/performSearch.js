var keypadMap = {
    0 : ['+'],
    1 : [],
    2 : ['a','b','c'],
    3 : ['d','e','f'],
    4 : ['g','h','i'],
    5 : ['j','k','l'],
    6 : ['m','n','o'],
    7 : ['p','q','r','s'],
    8 : ['t','u','v'],
    9 : ['w','x','y','z']
};

var searchNumberToLabelMap = {
    1 : "creator",  //artist
    2 : "title"  //song
};

function performSearch(searchNumber,searchTerm,res,api){
    //ok, first compute all combinations of letters from the search term.
    var letters = [];

    for(var i = 0; i < searchTerm.length; i++){
        letters.push(keypadMap[searchTerm.charAt(i)]);
    }
    console.log("letters",letters);

    var combinations = [];

    for(i=0; i < letters[0].length; i++){
        for(var j=0; j < letters[1].length; j++){
            for(var k=0; k < letters[2].length; k++){
                combinations.push([letters[0][i],letters[1][j],letters[2][k]]);
            }
        }
    }

    console.log("combinations",combinations);

    //craft the query!
    var combinationStrings = combinations.map(function(c){return c.join("") + "*";});

    var q = searchNumberToLabelMap[searchNumber] + ':(' +   combinationStrings.join(" OR ")  + ') AND mediatype:etree';
    var url = 'http://archive.org/advancedsearch.php?&fl[]=identifier,title&rows=10&output=json&q=' + encodeURIComponent(q); 

    console.log("q",q);
    console.log("url",url);

    api.http.get(url,function(req){
        var s = "";
        req.on("data",function(data){
            s += data;
        });

        req.on("end",function(){
            var results = JSON.parse(s);

            //console.log(results.response.docs);

            //get the identifiers out and play the results
            //get details
            var docs = results.response.docs;

            var noMatchTxt = '<Response>' +
                            '<Say>Sorry, nothing matched that search.</Say>' +
                            '<Redirect method="GET">artist-not-found</Redirect>' + 
                        '</Response>';

            if(!docs.length){
                res.writeHead(200, {'Content-Type': 'application/xml'});
                console.log("returning result",noMatchTxt);
                res.end(noMatchTxt);
            }else{
    
                var tryDoc = function(){

                    var doc = docs.pop();

                    if(doc){

                        api.archive.getDetail(doc.identifier,function(err,detail){

                            var urls = api.archive.getUrlsFromDetail(detail).
                                        filter(function(url){return url.match(/.mp3$/);}).
                                        filter(function(url){return !url.match(/_vbr.mp3$/);});  //filter out vbr-encoded mp3s

                            //get the urls to make sure they actually work
                            api.archive.filterUrls(urls,function(goodUrls){
                                if(urls.length){
                                    console.log("urls to play",urls); 

                                    var result = '<Response>' +
                                            '<Say>Playing the songs you selected.</Say>' +
                                            '<Say>Press star to listen to the next song. Press a digit to return to the main menu.</Say>' +
                                            '<Say>' +  doc.title.replace("&"," and ") + '</Say>' +
                                            '<Say>Please wait while the songs are loaded</Say>' +
                                            goodUrls.map(function(url){return '<Gather numDigits="1" finishOnKey="*" action="/" method="GET" ><Play>' + url + "</Play></Gather>";}).join("\n")  + 
                                            '<Redirect method="GET">search-complete</Redirect>' + 
                                        '</Response>';

                                    console.log("returning result",result);

                                    res.writeHead(200, {'Content-Type': 'application/xml'});
                                    res.end(result);
                                }else{
                                    //try the next doc
                                    tryDoc();
                                }

                            },api);

                        });
                    }else{
                        res.writeHead(200, {'Content-Type': 'application/xml'});
                        console.log("returning result",noMatchTxt);
                        res.end(noMatchTxt);
                    }
                };
                tryDoc();
            }
        });
    });
}

/*
if(require.main === module){
    performSearch(process.argv[2],process.argv[3],{
        archive:require('./archive-lib'),
        async:require('async'),
        http:require('http'),
        url:require('url')
    });
}
*/
