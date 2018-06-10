const WebSocket = require('ws');
const EventEmiter = require('events');
const Block = require('../blockchain/block');
const config = require('../config');

class Peer2Peer extends EventEmiter{
    constructor(port){
        super();
        this._server = new WebSocket.Server({port:port});
        this.peers = [];
        this.initServer();
    }

    initServer(){
        this._server.on('connection', function connection(peer, req) {
            console.log("incoming peer connection: %s [%s]", req.connection.remoteAddress, req.connection.remotePort);
            peer.on('message', (message)=>{
                this.emit('message', peer, JSON.parse(message));
            });
        }.bind(this));
    }

    connect(peerSocket){
        console.log(`conencting to... ${peerSocket}`);
        const peer = new WebSocket(`ws://${peerSocket}`);

        peer.on('open', () => {
            peer.send(JSON.stringify({
                type: 'handshake',
                version: config.version
            }));
        });

        peer.on('message', function handle(message){
            this.emit('message', peer, JSON.parse(message));
        }.bind(this));
    }

    //data is json object
    broadcast(type, data, sourcePeer){
        const message = {
            type: type,
            data: data
        };
        this.peers.forEach((peer) => {
            if (peer !== sourcePeer)
                this.write(peer, message);
        });
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