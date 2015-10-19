/*
 * Copyright 2015 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// backbone.transceiver 0.1.1
(function (factory) {

    // Set up Stickit appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd)
        define(['backbone.radio', 'backbone', 'marionette', 'exports'], factory);

    // Next for Node.js or CommonJS.
    else if (typeof exports === 'object')
        factory(require('backbone.radio'), require('backbone'), require('marionette'), exports);

    // Finally, as a browser global.
    else
        factory(Backbone.Radio, Backbone, Marionette);

}(function (Radio, Backbone, Marionette) {
    'use strict';

    var initialize = function(obj) {
        var channels = _.result(obj, 'channels', {});

        _.each(channels, function(channelOptions, channelName) {
            var channel = Radio.channel(channelName),
                replies = _.result(channelOptions, 'reply', {}),
                complies = _.result(channelOptions, 'comply', {}),
                requests = _.result(channelOptions, 'request', {}),
                events = _.result(channelOptions, 'events', {});

            // register request handlers
            _.each(replies, function(response, request) {
                var result = _.isFunction(response) ? _.bind(response, obj) : obj[response];

                channel.reply(request, result, obj);
            });

            // register command handlers
            _.each(complies, function(response, command) {
                var result = _.isFunction(response) ? _.bind(response, obj) : obj[response];

                channel.comply(command, result, obj);
            });

            // define getters that dynamically request data from channel
            _.each(requests, function(prop, request) {
                Object.defineProperty(obj, prop, {
                    get: function() {
                        return channel.request(request);
                    }
                });
            });

            // register event handlers
            _.each(events, function(response, event) {
                var result = _.isFunction(response) ? _.bind(response, obj) : obj[response];

                obj.listenTo(channel, event, result);
            });

            // store channel reference
            obj.channels[channelName + 'Channel'] = channel;
        });
    };

    var extendClass = function(originalConstructor) {
        // store original prototype
        var originalPrototype = originalConstructor.prototype;

        // create new constructor function calling original constructor first
        // and then initializing channels
        var Constructor = function() {
            originalConstructor.apply(this, arguments);

            initialize(this);
        };

        // restore original properties on new constructor
        Constructor.prototype = originalPrototype;
        Constructor.extend = originalConstructor.extend;
        Constructor.__super__ = originalConstructor.__super__;

        return Constructor;
    };

    // extend Backbone and Marionette classes
    Marionette.Object = extendClass(Marionette.Object);
    Marionette.Controller = extendClass(Marionette.Controller);
    Backbone.Router = extendClass(Backbone.Router);
    Backbone.View = extendClass(Backbone.View);

}));
