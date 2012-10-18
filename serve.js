//initially, pull from archive.org's main page, eval result. use that to pull down the track, and play it
var http = require('http'),
    fs = require('fs'),
    scion = require('scion'),
    xmldom = require('xmldom'),
    urlModule = require('url');

var sessions = {};

//hook up custom action
scion.ext.actionCodeGeneratorModule.gen.actionTags[""].Response = function(action){
    var s = "_event.data.response.writeHead(200, {'Content-Type': 'application/xml'});\n" + 
        "_event.data.response.end(" + JSON.stringify((new xmldom.XMLSerializer()).serializeToString(action)) + ");";
    //console.log("generated Response",s);
    return s;
}; 

scion.pathToModel('./archive.xml',function(err,model){
    if(err) throw err;

    http.createServer(function (req, res) {

        //do everything as GET
        var url = urlModule.parse(req.url,true);
        var sid = url.query.CallSid;

        //pull out the session or create if not created
        var session = sessions[sid];
        if(!session){
            console.log("creating new SCXML session");
            session = sessions[sid] = new scion.SCXML(model);
            session.start();
            session.gen("init",{
                http:http,
                url:urlModule,
                archive:require('./archive-lib'),
                async:require('async')
            });
        }else{
            console.log("using existing session");
        }

        //transform this into a statecharts event and pass into the state machine
        var event = {
            name : url.pathname,
            data : {
                request : req,
                response : res,
                params : url.query
            }
        };

        console.log("sending event",event);

        var conf = session.gen(event);

        console.log("new conf",conf);
        
    }).listen(1337);
    console.log('Server running at http://127.0.0.1:1337/');
});

