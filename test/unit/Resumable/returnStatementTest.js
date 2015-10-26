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

describe('Resumable return statement', function () {
    _.each({
        'return of IIFE return value': {
            code: nowdoc(function () {/*<<<EOS
exports.result = (function () {
    return (function () {
        return tools.giveMe(21);
    }());
}());
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
                result: 21
            }
        }
    }, tools.check);
});
