/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    nowdoc = require('nowdoc'),
    tools = require('./tools');

describe('Resumable accessor properties (with getters/setters)', function () {
    _.each({
        'property with getter, inside expression': {
            code: nowdoc(function () {/*<<<EOS
var obj = {};
Object.defineProperty(obj, 'myGetterProp', {
    get: function () {
        return tools.giveMeAsync(21);
    }
});

exports.first = true;
exports.second = obj.myGetterProp + 9;
exports.third = true;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        giveMeAsync: function (what) {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(what);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                first: true,
                second: 30,
                third: true
            }
        },
        'property with setter, inside expression': {
            code: nowdoc(function () {/*<<<EOS
var obj = {};
Object.defineProperty(obj, 'mySetterProp', {
    set: function (newValue) {
        exports.second = tools.giveMeAsync(newValue) + 4;
    }
});

exports.first = true;
obj.mySetterProp = 10;
exports.third = true;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        giveMeAsync: function (what) {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(what);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                first: true,
                second: 14,
                third: true
            }
        }
    }, tools.check);
});
