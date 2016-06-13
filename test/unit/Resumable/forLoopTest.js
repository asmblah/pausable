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

describe('Resumable for loop', function () {
    _.each({
        'for loop with pause before continue': {
            code: nowdoc(function () {/*<<<EOS
var result = [];

for (var i = 0; i < 4; i++) {
    result.push(i * tools.giveMeAsync(2));
    continue;
    result.push('[UNREACHABLE]');
}

return result;
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
            expectedResult: [0, 2, 4, 6]
        }
    }, tools.check);
});
