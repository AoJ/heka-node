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
 *  Victor Ng (vng@mozilla.com)
 *
 ***** END LICENSE BLOCK *****
 */
"use strict"

/*
 * This module provides adapters for third party logging libraries to
 * use heka-node as a transport.  For now, we support only :
 *
 *  * node-cef for CEF messages
 *  * raven-node for raven messages
 *
 */

var strftime = require('strftime');
var os = require('os');

var cef_log_factory = function cef_closure(heka_client) {
    var wrapped = function(syslog_config) {
        var requiredHekaSyslogOptions = ['syslog_options',
                                         'syslog_facility',
                                         'syslog_ident',
                                         'syslog_priority'];
        var self = this;

        // Bind in the syslog configuration
        self._syslog_config = {};
        // The only syslog options we really care about are the
        // ident and facility fields
        self._syslog_config['syslog_ident'] = syslog_config.tag || "node_cef";
        self._syslog_config['syslog_facility'] = syslog_config.facility|| "local4";
        self._syslog_config['syslog_priority'] = "";
        self._syslog_config['syslog_options'] = "";


        // A replacement object for syslog which transports over
        // heka instead
        var heka_not_syslog = {
            heka_transport: function(){
                return heka_client;
            },
            log: function(message, severity) {
                var timestamp = new Date();
                var hostname = os.hostname();

                message = strftime.strftimeUTC("%b %d %H:%M:%S", timestamp) + " " + hostname + " " + message;

                var heka_cef_opts = {fields: {cef_meta: self._syslog_config},
                                     payload: message,
                                     timestamp: timestamp,
                                     severity: severity};
                this.heka_transport().heka('cef', heka_cef_opts);
            },
            syslog_config: function() {
                /*
                 * This provides access to the identity tag and the facility level
                 */
                return self._syslog_config;
            }
        }
        return heka_not_syslog;
    };
    return wrapped;
}

exports.cef_log_factory = cef_log_factory;

