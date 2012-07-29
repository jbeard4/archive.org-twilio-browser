//this is a small lib for the archive.org API
var async = require('async');

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

function filterUrls(urls,cb,api){

    //get the urls to make sure they actually work
    api.async.filter(urls,function(url,cb){
        var oUrl = api.url.parse(url); 

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
    },cb);
}


module.exports = {
    getPicksOfTheDay : getPicksOfTheDay,
    getDetail  : getDetail,
    getUrlsFromDetail : getUrlsFromDetail,
    filterUrls : filterUrls
};
