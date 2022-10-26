const EventEmitter = require('events').EventEmitter;
const Ws = require('ws');
const DeepExtend = require('deep-extend');

const ClientConnection = require('./ClientConnection.js');

class Server extends EventEmitter {

    constructor(logger, wsOptions, guacdOptions, clientOptions, callbacks) {
        super();

        this.logger = logger;

        if (wsOptions.hasOwnProperty('server')) {
            this.wsOptions = wsOptions;
        } else {
            this.wsOptions = Object.assign({
                port: 8080
            }, wsOptions);
        }

        this.guacdOptions = Object.assign({
            host: '127.0.0.1',
            port: 4822
        }, guacdOptions);

        this.clientOptions = {};
        DeepExtend(this.clientOptions, {
            maxInactivityTime: 10000,

            crypt: {
                cypher: 'AES-256-CBC',
            },

            connectionDefaultSettings: {
                rdp: {
                    'args': 'connect',
                    'port': '3389',
                    'width': 1024,
                    'height': 768,
                    'dpi': 96,
                },
                vnc: {
                    'args': 'connect',
                    'port': '5900',
                    'width': 1024,
                    'height': 768,
                    'dpi': 96,
                },
                ssh: {
                    'args': 'connect',
                    'port': 22,
                    'width': 1024,
                    'height': 768,
                    'dpi': 96,
                },
                telnet: {
                    'args': 'connect',
                    'port': 23,
                    'width': 1024,
                    'height': 768,
                    'dpi': 96,
                }
            },

            allowedUnencryptedConnectionSettings: {
                rdp: [
                    'width',
                    'height',
                    'dpi',
                    'video',
                    'image',
                    'audio',
                    'color-depth',
                    'initial-program',
                    'client-name',
                    'server-layout',
                    'timezone',
                    'resize-method',
                    'disable-audio',
                    'enable-audio-input',
                    'enable-printing',
                    'printer-name',
                    'enable-drive',
                    'disable-download',
                    'disable-upload',
                    'drive-name',
                    'console-audio',
                    'static-channels',
                    'disable-copy',
                    'disable-paste',
                    'remote-app',
                    'remote-app-dir',
                    'remote-app-args',
                    'wol-send-packet',
                    'wol-mac-addr',
                    'wol-broadcast-addr',
                    'wol-wait-time',
                    'protocol_version',
                ],
                vnc: [
                    'width',
                    'height',
                    'dpi',
                    'video',
                    'image',
                    'audio',
                    'protocol_version'
                ],
                ssh: [
                    'color-scheme',
                    'font-name',
                    'font-size',
                    'width',
                    'height',
                    'dpi',
                    'video',
                    'image',
                    'protocol_version'
                ],
                telnet: [
                    'color-scheme',
                    'font-name',
                    'font-size',
                    'width',
                    'height',
                    'dpi',
                    'video',
                    'image',
                    'protocol_version'
                ]
            }
        }, clientOptions);

        this.callbacks = Object.assign({
            processConnectionSettings: (settings, callback) => callback(undefined, settings)
        }, callbacks);

        this.connectionsCount = 0;
        this.activeConnections = new Map();

        logger.info('Starting guacamole-lite WebSocket Server');

        this.webSocketServer = new Ws.Server(this.wsOptions);
        this.webSocketServer.on('connection', this.newConnection.bind(this));

        process.on('SIGTERM', this.close.bind(this));
        process.on('SIGINT', this.close.bind(this));
    }

    close() {
        this.logger.info('Closing all connections and exiting...');

        this.webSocketServer.close(() => {
            this.activeConnections.forEach((activeConnection) => {
                activeConnection.close();
            });
        });
    }

    /**
     * @param {WebSocket.WebSocket} webSocketConnection
     * @param req
     */
    newConnection(webSocketConnection, req) {
        this.connectionsCount++;
        this.activeConnections.set(this.connectionsCount, new ClientConnection(this, this.connectionsCount, webSocketConnection, req));
    }
}

module.exports = Server;
