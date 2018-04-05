const WebSocket = require('ws');
const EventEmiter = require('events');
const Block = require('../blockchain/block');

//store version in config or something

class Peer2Peer extends EventEmiter{
    constructor(port){
        super();
        this._server = new WebSocket.Server({port:port});
        this.peers = [];
        this.VERSION = 'bbc1.0';
        this.initServer();
    }

    initServer(){
        const self = this;
        this._server.on('connection', function connection(peer, req) {
            console.log("incoming peer connection: %s [%s]", req.connection.remoteAddress, req.connection.remotePort);

            peer.on('message', function incoming(message) {
                self.emit('message', peer, JSON.parse(message));
            });
        });
    }

    connect(peerSocket){
        console.log(`conencting to... ${peerSocket}`);
        const peer = new WebSocket(`ws://${peerSocket}`);
        const self = this;

        peer.on('open', () => {
            peer.send(JSON.stringify({
                type: 'handshake',
                version: this.VERSION
            }));
        });

        peer.on('message', (message) => {
            self.emit('message', peer, JSON.parse(message));
        });
    }

    broadcast(type, data){
        const message = {
            type: type,
            data: data
        };
        const self = this;
        this.peers.forEach(peer => {
            self.write(peer, message);
        })
    }

    write(peer, message){
        try{
            peer.send(JSON.stringify(message));
        } catch (error) { //no longer there
            console.log('Write to peer ' + error);
            this.peers = this.peers.filter((p) => {
                return p !== peer;
            });
        }
    }
}

module.exports = Peer2Peer;