'use strict';

const packageFile = require('./package.json');
const GuacamoleLite = require('./lib/Server');
const Https = require('https');
const fs = require('fs');
const { createLogger, transports, format } = require('winston');
const { combine, splat, timestamp, printf } = format;

const PORT = process.env.PORT || 8080;
const CRYPT_SECRET = process.env.CRYPT_SECRET;
const CRYPT_CYPHER = process.env.CRYPT_CYPHER || 'AES-256-CBC';
const GUACD_HOST = process.env.GUACD_HOST || '127.0.0.1';
const GUACD_PORT = process.env.GUACD_PORT || 4822;
const USER_DRIVE_ROOT = process.env.USER_DRIVE_ROOT || '/tmp/drives'
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;

const loggerFormat = printf( ({ level, message, timestamp , ...metadata}) => {
    let msg = `${timestamp} [${level}] : ${message} `
    if(metadata) {
        msg += JSON.stringify(metadata)
    }
    return msg
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.colorize(),
        splat(),
        timestamp(),
        loggerFormat
    ),
    transports: [
        new transports.Console(),
    ]
});

function start(cryptKey, cryptCypher, websocketPort , guacdHost, guacdPort) {
    logger.info('[GUACWS] Starting Server');
    logger.info(`[GUACWS] Version ${packageFile.version}`);

    if (!cryptKey || cryptKey.length === 0) {
        logger.error('[GUACWS] No secret key specified, please specify a key with CRYPT_SECRET environment variable');
        return;
    }

    let httpsServer = undefined;
    if (SSL_CERT_PATH && SSL_KEY_PATH) {
        try {
            const hasCert = fs.existsSync(SSL_CERT_PATH);
            const hasKey = fs.existsSync(SSL_KEY_PATH);

            if (hasCert && hasKey) {
                httpsServer = Https.createServer({
                    cert: fs.readFileSync(SSL_CERT_PATH),
                    key: fs.readFileSync(SSL_KEY_PATH),
                });
            }
        } catch (err) {
            logger.error('[GUACWS] Could not load SSL certificate/key, please check the SSL certificate key and path exist and are valid');
            return;
        }
    }
    const websocketOptions = httpsServer ? { server: httpsServer } : { port: websocketPort };

    const guacdOptions = {
        host: guacdHost,
        port: guacdPort,
    };

    const clientOptions = {
        crypt: {
            cypher: cryptCypher,
            key: cryptKey
        }
    };

    const callbacks = {
        processConnectionSettings: function (settings, callback) {
            if (settings.userFolder) {
                settings.connection['drive-path'] = `${USER_DRIVE_ROOT}/user_${settings.userFolder}`;
            }

            callback(null, settings);
        }
    };

    logger.info(`[GUACWS] WebSocket on ${httpsServer ? 'wss' : 'ws'}://0.0.0.0:${websocketPort}`);
    logger.info(`[GUACWS] GuacD host on ${guacdHost}:${guacdPort}`);
    return new GuacamoleLite(logger, websocketOptions, guacdOptions, clientOptions, callbacks);
}

const server = start(CRYPT_SECRET, CRYPT_CYPHER, PORT, GUACD_HOST, GUACD_PORT);
if (server) {
    logger.info('[GUACWS] WebSocket Tunnel running');
} else {
    logger.error('[GUACWS] Failed to start WebSocket Tunnel');
}

