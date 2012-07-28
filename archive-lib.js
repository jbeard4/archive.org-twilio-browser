//this is a small lib for the archive.org API

var ar = "http://archive.org/";

var http=require('http');    

function getPicksOfTheDay(cb){
    http.get(ar + "index.php?output=json", function(res){

        var s = "";
        res.on("data",function(data){
            s += data;
        });
        res.on("end",function(){
            var o = eval("(" + s + ")");    //this is evil, but there API doesn't return real JSON, so...
            cb(null,o.picks);
        });
    }).on("error",function(err){cb(err);});
}

function getDetail(identifier,cb){
    http.get(ar + "details/" + identifier + "?output=json",function(res){
        var s = "";
        res.on("data",function(data){
            s += data;
        });

        res.on("end",function(){
            var o = JSON.parse(s);
            cb(null,o);
        });
    }).on("error",function(err){cb(err);});
}

function getUrlsFromDetail(detail,cb){
    var server = detail.server;
    var dir = detail.dir;
    var urls = [];

    for(var file in detail.files){
        //TODO: filter files to make sure it's an mp3
        var url = "http://" + server + dir + file;
        urls.push(url);
    }

    return urls;
}

module.exports = {
    getPicksOfTheDay : getPicksOfTheDay,
    getDetail  : getDetail,
    getUrlsFromDetail : getUrlsFromDetail
};
