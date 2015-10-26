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

describe('Resumable special function arguments variable handling', function () {
    _.each({
        'arguments should be accessible by index': {
            code: nowdoc(function () {/*<<<EOS
function giveMeTheSecond() {
    return arguments[1];
}

exports.result = giveMeTheSecond(20, 21, 22);
EOS
*/;}), // jshint ignore:line
            expectedExports: {
                result: 21
            }
        }
    }, tools.check);
});
