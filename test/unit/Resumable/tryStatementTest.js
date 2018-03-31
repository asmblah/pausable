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
        },
        'empty catch block when no error is thrown': {
            code: nowdoc(function () {/*<<<EOS
exports.first = true;
try {
    exports.second = true;
} catch (error) {
}
exports.third = true;
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
                third: true
            }
        },
        'try with both catch and finally blocks when an error is thrown': {
            code: nowdoc(function () {/*<<<EOS
exports.first = true;
try {
    exports.second = true;
    throw 'jump';
    exports.third = true;
} catch (error) {
    exports.fourth = error;
} finally {
    exports.fifth = true;
}
exports.sixth = true;
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
                fourth: 'jump',
                fifth: true,
                sixth: true
            }
        },
        'try with both catch and finally blocks when no error is thrown': {
            code: nowdoc(function () {/*<<<EOS
exports.first = giveMeAsync(1);
try {
    exports.second = giveMeAsync(2);
} catch (error) {
    exports.third = giveMeAsync(3);
} finally {
    exports.fourth = giveMeAsync(4);
}
exports.fifth = giveMeAsync(5);
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
                first: 1,
                second: 2,
                fourth: 4,
                fifth: 5
            }
        },
        'try with only finally block when no error is thrown': {
            code: nowdoc(function () {/*<<<EOS
exports.out = 'start';

exports.first = giveMeAsync(1);
exports.out += ' first';
try {
    exports.out += ' second';
    exports.second = giveMeAsync(2);
    exports.out += ' third';
} finally {
    exports.out += ' fourth';
    exports.third = giveMeAsync(3);
    exports.out += ' fifth';
}
exports.out += ' sixth';
exports.fourth = giveMeAsync(4);
exports.out += ' seventh';
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
                first: 1,
                second: 2,
                third: 3,
                fourth: 4,
                out: 'start first second third fourth fifth sixth seventh'
            }
        },
        'try with both catch and finally blocks when error is rethrown': {
            code: nowdoc(function () {/*<<<EOS
exports.first = giveMeAsync(1);
try {
    exports.second = giveMeAsync(2);
    throw 'jump';
    exports.third = giveMeAsync(3);
} catch (error) {
    exports.fourth = error;
    throw error;
    exports.fifth = true; // Should not be reached
} finally {
    exports.sixth = giveMeAsync(6);
}
exports.seventh = giveMeAsync(7);
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
            // An error should still be raised because we re-throw it inside the catch
            expectedError: 'jump',
            expectedExports: {
                first: 1,
                second: 2,
                fourth: 'jump',
                sixth: 6
            }
        },
        'return inside finally when catch rethrows should discard the error': {
            code: nowdoc(function () {/*<<<EOS
exports.first = giveMeAsync(1);
try {
    exports.second = giveMeAsync(2);
    throw 'jump';
    exports.third = giveMeAsync(3);
} catch (error) {
    exports.fourth = error;
    throw error;
    exports.fifth = true; // Should not be reached
} finally {
    exports.sixth = giveMeAsync(6);
    return 'my final result';
}
exports.seventh = giveMeAsync(7);
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
                first: 1,
                second: 2,
                fourth: 'jump',
                sixth: 6
            },
            expectedResult: 'my final result'
        },
        'return inside finally when no catch is present should discard the error': {
            code: nowdoc(function () {/*<<<EOS
exports.first = giveMeAsync(1);
try {
    exports.second = giveMeAsync(2);
    throw 'jump';
    exports.third = giveMeAsync(3);
} finally {
    exports.fourth = giveMeAsync(4);
    return 'my final result';
}
exports.fifth = giveMeAsync(5);
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
                first: 1,
                second: 2,
                fourth: 4
            },
            expectedResult: 'my final result'
        },
        'nested try with catch and finally that throws again': {
            code: nowdoc(function () {/*<<<EOS
exports.first = giveMeAsync(1);
try {
    exports.second = giveMeAsync(2);
    try {
        exports.third = giveMeAsync(3);
        throw 'jump';
        exports.fourth = giveMeAsync(4);
    } finally {
        exports.fifth = giveMeAsync(5);
        throw 'inner';
    }
    exports.sixth = giveMeAsync(6);
} finally {
    exports.seventh = giveMeAsync(7);
    return 'my final result';
}
exports.eighth = giveMeAsync(8);
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
                first: 1,
                second: 2,
                third: 3,
                fifth: 5,
                seventh: 7
            },
            expectedResult: 'my final result'
        },
        'return inside try when finally clause pauses': {
            code: nowdoc(function () {/*<<<EOS
exports.first = giveMeAsync(1);
try {
    exports.second = giveMeAsync(2);
    return giveMeAsync('my result from inside the try');
    exports.third = giveMeAsync(3);
} finally {
    exports.fourth = giveMeAsync(4);
}
exports.fifth = giveMeAsync(5);
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
                first: 1,
                second: 2,
                fourth: 4
            },
            expectedResult: 'my result from inside the try'
        }
    }, tools.check);
});
