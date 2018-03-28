const WebSocket = require('ws');
const EventEmiter = require('events');

class Peer2Peer{
    constructor(port){
        this.wss = new WebSocket.Server({port:port});
        this.eventEmiter = new EventEmiter();
        this.peers = [];
        this.initServer();
    }

    initServer(){
        var self = this;
        this.wss.on('connection', function connection(ws, req) {
            console.log("incoming peer connection: %s [%s]", req.connection.remoteAddress, req.connection.remotePort);

            ws.on('message', function incoming(message) {
                self.handleMessage(ws, JSON.parse(message));
            });
        });
    }

    connect(ip, port){
        console.log(`conencting to... ${ip}:${port}`);
        const ws = new WebSocket(`ws://${ip}:${port}`);

        ws.on('open', () => {
            ws.send(JSON.stringify({
                type: 'connect'
            }));
        });
        
        var self = this;
        ws.on('message', (message) => {
            self.handleMessage(ws, JSON.parse(message));
        });
    }

    handleMessage(peer, message){
        switch(message.type){
            case 'type':
                //Do something
                //https://en.bitcoin.it/wiki/Protocol_documentation#Message_types
                break;
            case 'connect':
                this.eventEmiter.emit('peerConnected', peer);
                console.log(`Peer connected ${peer._socket.remoteAddress}:${peer._socket.remotePort}`);

                //if message contains ack that means WE initiated connection, else this is incoming connection
                if(message.ack == true)
                    this.peers.push(peer);
                else{
                    message.ack = true
                    peer.send(JSON.stringify(message));
                }
                break;
        }
    }
}

module.exports = Peer2Peer;