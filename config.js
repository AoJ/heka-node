/*
 ***** BEGIN LICENSE BLOCK *****
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Rob Miller (rmiller@mozilla.com)
 *  Victor Ng (vng@mozilla.com)
 *
 ***** END LICENSE BLOCK *****
 */
"use strict";
var clientModule = require('./client');
var globalConfig = {};
var resolver = require('./resolver');

var resolveName = resolver.resolveName;

var getattr = function(obj, attr, defaultValue) {
    defaultValue = typeof(defaultValue) !== 'undefined' ? defaultValue : {};
    var value = typeof(obj[attr]) !== 'undefined' ? obj[attr] : defaultValue;
    return value;
};



var getGlobalConfig = function() {
    return globalConfig;
};

var senderFromConfig = function(config) {
    if (typeof(config.factory) == 'undefined')
    {
        throw new Error("factory attribute is missing from config");
    }

    var senderFactory = resolveName(config.factory);
    if (senderFactory === undefined) {
        throw new Error("Unable to resolve the senderFactory: ["+config.factory+"]")
    }
    return senderFactory(config);
};

var clientFromJsonConfig = function(config, client, clearGlobal) {
    config = JSON.parse(config);
    var senderConfig = getattr(config, 'sender');
    var sender = senderFromConfig(senderConfig);
    var logger = getattr(config, 'logger', '');
    var severity = getattr(config, 'severity', 6);
    var disabledTimers = getattr(config, 'disabledTimers', []);
    var plugins = getattr(config, 'plugins');
    var newGlobals = getattr(config, 'global');

    clearGlobal = typeof(clearGlobal) !== 'undefined' ? clearGlobal : false;
    if (clearGlobal) {
        globalConfig = {};
    };
    for (var attr in newGlobals) {
        if (newGlobals.hasOwnProperty(attr)) {
            globalConfig[attr] = newGlobals[attr];
        };
    };

    var filterNames = getattr(config, 'filters', []);
    var filters = [];
    for (var i=0; i<filterNames.length; i++) {
        var provider = resolveName(filterNames[i][0]);
        var filterfn = provider(filterNames[i][1]);
        filters.push(filterfn);
    };

    if (typeof(client) === 'undefined') {
        client = new clientModule.HekaClient(sender, logger, severity,
                                               disabledTimers, filters);
    } else {
        client.setup(sender, logger, severity, disabledTimers, filters);
    };

    for (var name in plugins) {
        if (plugins.hasOwnProperty(name)) {
            var pluginConfig = plugins[name];
            var provider = resolveName(pluginConfig.provider);
            var pluginMethod = provider(pluginConfig);
            client.addMethod(name, pluginMethod, pluginConfig.override);
        };
    };

    return client;
};

exports.getGlobalConfig = getGlobalConfig;
exports.resolveName = resolveName;
exports.clientFromJsonConfig = clientFromJsonConfig;
