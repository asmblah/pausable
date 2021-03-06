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

describe('Resumable order of stack frame resumes', function () {
    _.each({
        'stack frames should be resumed in reverse order': {
            code: nowdoc(function () {/*<<<EOS
log('first');
(function first() { // New stack frame
    log('second');
    getMe(21);
    log('third');
    getMe(22); // We'll still be resuming the call stack from the first call
    log('fourth');
}());
log('fifth');
return messages;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var messages = [];

                return {
                    getMe: function (what) {
                        var pause = state.resumable.createPause();

                        setTimeout(function () {
                            pause.resume(what);
                        });

                        pause.now();
                    },
                    log: function (message) {
                        messages.push(message);
                    },
                    messages: messages
                };
            },
            expectedResult: [
                'first',
                'second',
                'third',
                'fourth',
                'fifth'
            ]
        }
    }, tools.check);
});
