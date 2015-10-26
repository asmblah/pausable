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

describe('Resumable function call', function () {
    _.each({
        'with "or" expression inside argument when left is falsy': {
            code: nowdoc(function () {/*<<<EOS
function returnIt(value) {
    return value;
}

exports.result = returnIt(0 || 4);
EOS
*/;}), // jshint ignore:line
            expectedExports: {
                result: 4
            }
        },
        'with "or" expression inside argument when left is truthy': {
            code: nowdoc(function () {/*<<<EOS
function returnIt(value) {
    return value;
}

exports.result = returnIt(3 || 4);
EOS
*/;}), // jshint ignore:line
            expectedExports: {
                result: 3
            }
        }
    }, tools.check);
});
