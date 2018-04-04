const WebSocket = require('ws');
const EventEmiter = require('events');
const Block = require('../blockchain/block');

//store version in config or something
const _VERSION = 'bbc1.0';

class Peer2Peer extends EventEmiter{
    constructor(port){
        super();
        this._server = new WebSocket.Server({port:port});
        this.peers = [];
        this.initServer();
    }

    initServer(){
        const self = this;
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
                type: 'version',
                version: _VERSION,
                serverPort: this._server.options.port
            }));
        });
        
        const self = this;
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
            case 'version':
                peer.serverPort = message.serverPort;

                //if message doest contain ack that means this is incoming connection
                if(!message.ack){
                    message.ack = true
                    message.version = _VERSION
                    message.serverPort = this._server.options.port;
                    peer.send(JSON.stringify(message));
                }

                if (message.version === _VERSION){
                    console.log(`Peer connected ${peer._socket.remoteAddress}:${peer._socket.remotePort}`);
                    this.peers.push(peer);
                    this.emit('peerConnected', peer); 
                }
                break;
        }
    }
}

module.exports = Peer2Peer;