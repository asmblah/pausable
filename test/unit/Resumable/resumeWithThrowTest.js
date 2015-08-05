/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    nowdoc = require('nowdoc'),
    tools = require('./tools');

describe('Resumable resuming from pause by throwing an error', function () {
    _.each({
        'throwing an error inside try..catch': {
            code: nowdoc(function () {/*<<<EOS
exports.first = true;
try {
    exports.before = true;
    tools.throwMe(21);
    exports.after = true;
} catch (error) {
    exports.error = error;
}
exports.second = true;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        throwMe: function (what) {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.throw(what);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                first: true,
                before: true,
                error: 21,
                second: true
            }
        },
        'throwing an error inside scope nested inside try..catch': {
            code: nowdoc(function () {/*<<<EOS
exports.first = true;
try {
    exports.before = true;
    (function (what) {
        exports.subBefore = true;
        tools.throwMe(what);
        exports.subAfter = true;
    }(23));
    exports.after = true;
} catch (error) {
    exports.error = error;
}
exports.second = true;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        throwMe: function (what) {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.throw(what);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                first: true,
                before: true,
                subBefore: true,
                error: 23,
                second: true
            }
        }
    }, tools.check);
});
