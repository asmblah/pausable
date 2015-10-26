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

describe('Resumable local variable handling', function () {
    _.each({
        'pausing between accesses to local variable inside IIFE': {
            code: nowdoc(function () {/*<<<EOS
return (function () {
    var myVar = 21,
        result;

    result = myVar + giveMeAsync(2);

    return result;
}());
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
            expectedResult: 23
        }
    }, tools.check);
});
