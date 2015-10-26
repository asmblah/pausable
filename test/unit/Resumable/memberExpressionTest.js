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

describe('Resumable member expression handling', function () {
    _.each({
        'read when object, computed property expression and object property all yield': {
            code: nowdoc(function () {/*<<<EOS
with (scope) {
    return myObject[myIndex + 1];
}
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var myObject = {},
                    scope = {};

                Object.defineProperties(scope, {
                    myObject: {
                        get: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(myObject);
                            });

                            pause.now();
                        }
                    },
                    myIndex: {
                        get: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(4);
                            });

                            pause.now();
                        }
                    }
                });

                Object.defineProperty(myObject, '5', {
                    get: function () {
                        var pause = state.resumable.createPause();

                        setTimeout(function () {
                            pause.resume(21);
                        });

                        pause.now();
                    }
                });

                return {
                    scope: scope
                };
            },
            expectedResult: 21
        },
        'write when object, computed property expression and object property all yield': {
            code: nowdoc(function () {/*<<<EOS
with (scope) {
    myObject[myIndex + 1] = 23;

    return myObject.result;
}
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var myObject = {},
                    scope = {};

                Object.defineProperties(scope, {
                    myObject: {
                        get: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(myObject);
                            });

                            pause.now();
                        }
                    },
                    myIndex: {
                        get: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(20);
                            });

                            pause.now();
                        }
                    }
                });

                Object.defineProperty(myObject, '21', {
                    set: function (newValue) {
                        var pause = state.resumable.createPause();

                        setTimeout(function () {
                            myObject.result = newValue + 4;

                            pause.resume();
                        });

                        pause.now();
                    }
                });

                return {
                    scope: scope
                };
            },
            expectedResult: 27
        }
    }, tools.check);
});
