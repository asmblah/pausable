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

describe('Resumable non-object TypeError handling', function () {
    _.each({
        'trying to reference a demeter-chain property of a property that is undefined': {
            code: nowdoc(function () {/*<<<EOS
var first = {};
return first.second.third.fourth;
EOS
*/;}), // jshint ignore:line
            expectedError: new TypeError('Cannot read property \'third\' of undefined')
        }
    }, tools.check);
});
