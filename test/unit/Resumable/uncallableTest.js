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

describe('Resumable attempt to call uncallable function/method', function () {
    _.each({
        'uncallable function': {
            code: nowdoc(function () {/*<<<EOS
var iAmNotCallable = {};

exports.result = iAmNotCallable();
EOS
*/;}), // jshint ignore:line
            expectedError: new TypeError('iAmNotCallable is not a function')
        },
        'non-method property of object': {
            code: nowdoc(function () {/*<<<EOS
var myObject = {
    iAmNotCallable: {}
};

exports.result = myObject.iAmNotCallable(21);
EOS
*/;}), // jshint ignore:line
            expectedError: new TypeError('myObject.iAmNotCallable is not a function')
        },
        'non-method property of object returned from last expression of sequence expression': {
            code: nowdoc(function () {/*<<<EOS
var myObject = {
    iAmNotCallable: {}
};

exports.result = ('first expr', 'second expr', myObject).iAmNotCallable(21);
EOS
*/;}), // jshint ignore:line
            expectedError: new TypeError('(..,..).iAmNotCallable is not a function')
        }
    }, tools.check);
});
