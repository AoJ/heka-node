var raven = require('raven');
var util = require('util');
var Transport = raven.transports.Transport;

function HekaRavenTransport(heka_client) {
    this.heka_client = heka_client;
}
util.inherits(HekaRavenTransport, Transport);

HekaRavenTransport.prototype.send = function(client, message, headers) {
    var timestamp = new Date();
    console.log
    var fields = {'epoch_timestamp': timestamp.getTime(),
                  'msg': '',
                  'dsn': client.raw_dsn,
                }

    var heka_raven_opts = {fields: fields,
                           logger: 'raven-node', // TODO: override 
                           payload: message,
                           timestamp: timestamp,
                           severity: 3}; // SEVERITY.ERROR};

    this.heka_client.heka('sentry', heka_raven_opts)
}

exports.HekaRavenTransport = HekaRavenTransport;


