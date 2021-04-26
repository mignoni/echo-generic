const log4js = require("log4js");
const loggerPublicKey = log4js.getLogger("PublicKey");
loggerPublicKey.level = "info";

const ms = require('ms');
const request = require('request');

function certToPEM(cert) {
    cert = cert.match(/.{1,64}/g).join('\n');
    cert = "-----BEGIN CERTIFICATE-----\n" + cert;
    cert = cert + "\n-----END CERTIFICATE-----\n";
    return cert;
}

function getPublicKeyFromJwks(domain, callback) {
    let options = {
        url: 'https://' + domain + '/.well-known/jwks.json',
        json: true
    };

    loggerPublicKey.info('Loading public key from: https://' + domain + '/.well-known/jwks.json')
    request(options, function (err, res) {
        if (err || res.statusCode < 200 || res.statusCode >= 300) {
            return callback(res && res.body || err);
        }

        let key = res.body.keys.find((key) => key.alg === 'RS256');
        if (!key) {
            return callback(new Error('Unable to find public key for: ' + domain));
        }

        return callback(null, certToPEM(key.x5c[0]));
    });
}

module.exports = function (domain) {
    if (!domain) {
        throw new Error('The domain is required in order to load the public key.');
    }

    let jwksError = null;
    let jwksPublicKey = null;

    // Fetch the public key every 10 hours to support key rotation.
    const getPublicKey = function () {
        getPublicKeyFromJwks(domain, function (err, publicKey) {
            if (err) {
                jwksError = err;
                loggerPublicKey.error('Error loading public key for: ' + domain, err);
            } else {
                jwksPublicKey = publicKey;
                loggerPublicKey.info('Loaded public key for: ' + domain);
            }
        });
    };
    getPublicKey();
    setInterval(getPublicKey, ms('10h'));

    // Function to return the public key.
    return function (req, header, payload, cb) {
        if (!jwksPublicKey) {
            return cb(err || new Error('Public key not available.'));
        }

        return cb(null, jwksPublicKey);
    }
};
