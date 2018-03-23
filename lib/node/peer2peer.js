const WebSocket = require('ws');

class Peer2Peer{
    constructor(){
        this.wss = new WebSocket.Server({port:3000});
        this.peers = [];
        this.initServer();
    }

    initServer(){
        this.wss.on('connection', function connection(ws, req) {
            console.log("incoming peer connection: %s [%s]",req.connection.address, req.connection.remotePort);
            
            ws.on('message', function incoming(message) {
                let obj = JSON.parse(message);
                //peers have to be on the same version of protocol to connect
                if (obj.version==='bbc1.0')
                    handleMessage(this, obj);
            });
        });
    }

    handleMessage(peer, message){
        switch(message.type){
            case 'type':
                //Do something
                break;
        }
    }
}

module.exports = Peer2Peer;