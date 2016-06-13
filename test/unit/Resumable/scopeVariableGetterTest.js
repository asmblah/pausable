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

describe('Resumable scope variables with getters', function () {
    _.each({
        'scope variable imported from object using with(...) via getter, inside expression': {
            code: nowdoc(function () {/*<<<EOS
var obj = {};
Object.defineProperty(obj, 'myVar', {
    get: function () {
        return tools.giveMeAsync(21);
    }
});

with (obj) {
    return myVar + 6;
}
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
            expectedResult: 27
        }
    }, tools.check);
});
