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

describe('Resumable try statement', function () {
    _.each({
        'throwing string as error should execute all statements in catch block': {
            code: nowdoc(function () {/*<<<EOS
exports.first = true;
try {
    exports.second = true;
    throw 'stop now';
    exports.third = true;
} catch (error) {
    exports.fourth = true;
}
exports.fifth = true;
EOS
*/;}), // jshint ignore:line
            expectedExports: {
                first: true,
                second: true,
                fourth: true,
                fifth: true
            }
        },
        'resuming inside catch block': {
            code: nowdoc(function () {/*<<<EOS
exports.first = true;
try {
    throw 'jump';
} catch (error) {
    exports.second = true;
    exports.third = giveMeAsync(21);
    exports.fourth = true;
}
exports.fifth = true;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    giveMeAsync: function (what) {
                        var pause = state.resumable.createPause();

                        setTimeout(function () {
                            pause.resume(what);
                        });

                        pause.now();
                    }
                };
            },
            expectedExports: {
                first: true,
                second: true,
                third: 21,
                fourth: true,
                fifth: true
            }
        }
    }, tools.check);
});
