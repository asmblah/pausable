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

describe('Resumable pausing during a resume from a previous pause', function () {
    _.each({
        'pausing while still resuming a previous pause': {
            code: nowdoc(function () {/*<<<EOS
exports.first = true;
(function first() { // New stack frame
    exports.second = true;
    exports.result1 = tools.getMe(21);
    exports.third = true;
    exports.result2 = tools.getMe(22); // We'll still be resuming the call stack from the first call
    exports.fourth = true;
}());
exports.fifth = true;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getMe: function (what) {
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
                second: true,
                result1: 21,
                third: true,
                result2: 22,
                fourth: true,
                fifth: true
            }
        }
    }, tools.check);
});
