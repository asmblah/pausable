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

describe('Resumable non-function TypeError handling', function () {
    _.each({
        'trying to reference a demeter-chain method that is not callable': {
            code: nowdoc(function () {/*<<<EOS
var first = {
    second: {
        third: {
            fourth: 21 // Not callable
        }
    }
};
return first.second.third.fourth(21);
EOS
*/;}), // jshint ignore:line
            expectedError: new TypeError('first.second.third.fourth is not a function')
        },
        'trying to call a logical expression result that is not callable': {
            code: nowdoc(function () {/*<<<EOS
var first = {
    second: {
        third: {
            fourth: 21 // Not callable
        }
    }
};
return (0 || first.second.third.fourth)(21);
EOS
*/;}), // jshint ignore:line

            // TODO: Improve this summary (see TODO in ReferenceStringifier)
            expectedError: new TypeError('(... || ...) is not a function')
        }
    }, tools.check);
});
