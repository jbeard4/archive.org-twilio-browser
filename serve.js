//initially, pull from archive.org's main page, eval result. use that to pull down the track, and play it
var http = require('http'),
    fs = require('fs'),
    scion = require('scion'),
    xmldom = require('xmldom'),
    urlModule = require('url'),
    io = require('socket.io'),
    sttic = require('node-static'),
    fs = require('fs'),
    path = require('path');

var sessions = {};
var sockets = [];

//hook up custom action
scion.ext.actionCodeGeneratorModule.gen.actionTags[""].Response = function(action){
    var s = "_event.data.response.writeHead(200, {'Content-Type': 'application/xml'});\n" + 
        "_event.data.response.end(" + JSON.stringify((new xmldom.XMLSerializer()).serializeToString(action)) + ");";
    //console.log("generated Response",s);
    return s;
}; 

function dumpSessionsHTML(res){
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(
        '<html><head></head><body><ul><h1>Active Sessions:</h1>' + 
            Object.keys(sessions).map(function(sid){
                return '<li><a href="/scxml-viz-client/index.html?sid=' + sid + '">' + sid + '</a></li>';
            }).join('\n') + 
        '</ul></body></html>');
}



var file = new sttic.Server(path.join(__dirname,'content'));


scion.pathToModel('./content/archive.xml',function(err,model){
    if(err) throw err;

    var server = http.createServer(function (req, res) {

        console.log('received request',req);

        //do everything as GET
        var url = urlModule.parse(req.url,true);

        var m, sid, session;

        if(url.pathname === "/sessions" && req.method === "GET"){
            dumpSessionsHTML(res);
        }else if(url.pathname === '/configuration' && req.method === "GET"){
            sid = url.query.sid;
            session = sessions[sid];
            if(!sid){
                res.writeHead(400,{'Content-Type' : 'text/plain'});
                res.end('Session id not specificed.');
            }else if(!session){
                res.writeHead(404,{'Content-Type' : 'text/plain'});
                res.end('Session not found for session id ' + sid);
            }else{
                res.writeHead(200,{'Content-Type' : 'application/json'});
                res.end(JSON.stringify(session.getFullConfiguration()));
            }
        }else if(url.query.CallSid){

            sid = url.query.CallSid;

            if(url.query.CallStatus === 'completed'){
                delete sessions[sid];   //TODO: send this into the state maichne as an event as well, such that it transitions to final state and cleans itself up.
            }else{

                //pull out the session or create if not created
                session = sessions[sid];
                if(!session){
                    console.log("creating new SCXML session");
                    session = sessions[sid] = new scion.SCXML(model);

                    //TODO: find a way to filter sockets to interested clients
                    session.registerListener({
                        onEntry : function(stateId){
                            sockets.forEach(function(socket){socket.emit('onEntry', {stateId:stateId,sessionId:sid});});
                        },
                        onExit : function(stateId){
                            sockets.forEach(function(socket){socket.emit('onExit', {stateId:stateId,sessionId:sid});});
                        }
                    }); 

                    session.start();
                    //FIXME: refactor this so that we don't need to pass modules through
                    session.gen("init",{
                        http:http,
                        url:urlModule,
                        archive:require('./content/archive-lib'),
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
            }
        }else{
            //assume static files
            file.serve(req, res);
        }
        
    });
    server.listen(1337);
    console.log('Server running at http://127.0.0.1:1337/');

    var ioServer = io.listen(server,{log : false});        //start up node-sockets server as well

    ioServer.sockets.on('connection', function (socket) {
        sockets.push(socket);
    });

    ioServer.sockets.on('disconnect', function (socket) {
        sockets.splice(sockets.indexOf(socket),1);
    });

});

