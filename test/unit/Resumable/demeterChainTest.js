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

describe('Resumable demeter chain', function () {
    _.each({
        'calling method on return value then method on that return value': {
            code: nowdoc(function () {/*<<<EOS
exports.result = (function () {
    return {
        first: function () {
            return {
                second: function () {
                    return tools.giveMe(7);
                }
            };
        }
    };
}())
    .first()
    .second();
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        giveMe: function (what) {
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
                result: 7
            }
        }
    }, tools.check);
});
