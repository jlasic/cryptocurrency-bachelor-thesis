const WebSocket = require('ws');
const EventEmiter = require('events');

class Peer2Peer{
    constructor(port){
        this._server = new WebSocket.Server({port:port});
        this.eventEmiter = new EventEmiter();
        this.peers = [];
        this.initServer();
    }

    initServer(){
        var self = this;
        this._server.on('connection', function connection(peer, req) {
            console.log("incoming peer connection: %s [%s]", req.connection.remoteAddress, req.connection.remotePort);

            peer.on('message', function incoming(message) {
                self.handleMessage(peer, JSON.parse(message));
            });
        });
    }

    connect(peerSocket){
        console.log(`conencting to... ${peerSocket}`);
        const peer = new WebSocket(`ws://${peerSocket}`);

        peer.on('open', () => {
            peer.send(JSON.stringify({
                type: 'connect'
            }));
        });
        
        var self = this;
        peer.on('message', (message) => {
            self.handleMessage(peer, JSON.parse(message));
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