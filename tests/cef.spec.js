"use strict";

var _ = require('underscore');
var heka = require('../client.js');
var senders = require('../senders');
var cef = require('cef');

var monkeyStdoutWrite = function(fakeWrite) {
    var origWrite = process.stdout.write;
    process.stdout.write = fakeWrite;
    return function() {
        process.stdout.write = origWrite;
    };
};


var get_cef = function(heka_client) {
    var some_func = function(sample) {
        this._capture = sample;
    };

    var config = {
        vendor: 'Mozilla',
        product: 'SomeMozApp',
        version: '0.1-baz',
        syslog_tag: 'addons-stage',
        syslog_facility: 'local4',
        log_factory: heka.Adapters.cef_log_factory(heka_client),
        err_back: some_func
    };
    return cef.getInstance(config);
}

describe('cef', function() {
    var unhook;
    var msgs = [];

    var mockStdoutWrite = function(string, encoding, fd) {
        msgs.push(string);
    };

    beforeEach(function() {
        msgs = [];
        unhook = monkeyStdoutWrite(mockStdoutWrite);
    });

    afterEach(function() {
        unhook();
    });

    it('routes through heka', function() {
        var config = {
            'sender': {'factory': './senders:stdoutSenderFactory'},
            'logger': 'test',
            'severity': 5
        };
        var jsonConfig = JSON.stringify(config);
        var heka_client = heka.clientFromJsonConfig(jsonConfig);

        var cef_client = get_cef(heka_client);
        cef_client.info({name: "something wacky",
                         signature: 1234});
        expect(msgs.length).toBe(1);

        var heka_packet = JSON.parse(msgs[0]);
        expect(heka_packet["payload"].indexOf("CEF:0|Mozilla|SomeMozApp|0.1-baz|1234|something wacky|4")).toBeGreaterThan(-1);
        expect(heka_packet["payload"].indexOf("CEF:-1|Mozilla|SomeMozApp|0.1-baz|1234|something wacky|4")).toBe(-1);

    });
});


