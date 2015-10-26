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
    expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    sinon = require('sinon'),
    tools = require('./tools');

describe('Resumable', function () {
    _.each({
        'when no pauses are used': {
            code: nowdoc(function () {/*<<<EOS
exports.result = 21;
EOS
*/;}), // jshint ignore:line
            expectedExports: {
                result: 21
            }
        },
        'when one pause is used with a single expression': {
            code: nowdoc(function () {/*<<<EOS
exports.result = tools.getResult();
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getResult: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(22);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: 22
            }
        },
        'when two pauses are used with a single expression': {
            code: nowdoc(function () {/*<<<EOS
exports.result = tools.getFirst() + 4 + tools.getSecond();
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getFirst: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(2);
                            });

                            pause.now();
                        },
                        getSecond: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(3);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: 9
            }
        },
        'when pause occurs inside function call': {
            code: nowdoc(function () {/*<<<EOS
function getIt() {
    return tools.getValue() + 2;
}

exports.result = getIt() + 10;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getValue: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(21);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: 33
            }
        },
        'when pause occurs inside function defined via declaration with closure-bound variables': {
            code: nowdoc(function () {/*<<<EOS
function getIt() {
    var myResult;

    function doGet() {
        myResult = tools.getValue() + 2;
    }

    doGet();

    return myResult;
}

exports.result = getIt() + 10;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getValue: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(21);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: 33
            }
        },
        'when pause occurs inside function defined via expression with closure-bound variables': {
            code: nowdoc(function () {/*<<<EOS
function getIt() {
    var myResult,
        doGet = function () {
            myResult = tools.getValue() + 2;
        };

    doGet();

    return myResult;
}

exports.result = getIt() + 10;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getValue: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(21);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: 33
            }
        },
        'when pause occurs inside if (...) {...} statement with condition that becomes falsy before resume': {
            code: nowdoc(function () {/*<<<EOS
var allow = true;

function getIt() {
    if (allow) {
        allow = false;

        var result = tools.getValue();

        return result + 2;
    }
}

exports.result = getIt();
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getValue: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(20);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: 22
            }
        },
        'multiple variable declarators in one declaration, with inits that yield': {
            code: nowdoc(function () {/*<<<EOS
var first = tools.addOneTo(4),
second = tools.addOneTo(5);

exports.result = first + ',' + second;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        addOneTo: function (to) {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(to + 1);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: '5,6'
            }
        },
        'while loop with condition that becomes falsy before resume': {
            code: nowdoc(function () {/*<<<EOS
var go = true,
result = 0;

while (go) {
    go = false;
    result += tools.addOneTo(1);
    go = true;

    if (result === 6) {
        break;
    }
}

exports.result = result;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        addOneTo: function (to) {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(to + 1);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedExports: {
                result: 6
            }
        },
        'logical OR (||) operator with short-circuit evaluation, where left operand evaluates to truthy': {
            code: nowdoc(function () {/*<<<EOS
var result = tools.truthy() || otherTools.falsy();

exports.result = result;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var falsy = sinon.stub().returns(false),
                    truthy = sinon.stub().returns(true),
                    getOtherTools = sinon.stub(),
                    expose = {
                        tools: {
                            truthy: truthy
                        }
                    };

                getOtherTools.returns({
                    falsy: falsy
                });

                Object.defineProperty(expose, 'otherTools', {
                    get: getOtherTools
                });

                state.getOtherTools = getOtherTools;
                state.falsy = falsy;
                state.truthy = truthy;

                return expose;
            },
            expectedExports: {
                result: true
            },
            expect: function () {
                it('should only call the .truthy() method, not the .falsy() method', function () {
                    expect(this.truthy).to.have.been.calledOnce;
                    expect(this.falsy).not.to.have.been.called;
                });

                it('should not attempt to read the object variable for the right operand', function () {
                    expect(this.getOtherTools).not.to.have.been.called;
                });
            }
        },
        'logical OR (||) operator with short-circuit evaluation, where left operand evaluates to falsy but right operand truthy': {
            code: nowdoc(function () {/*<<<EOS
var result = tools.falsy() || tools.truthy();

exports.result = result;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var falsy = sinon.stub().returns(false),
                    truthy = sinon.stub().returns(true);

                state.falsy = falsy;
                state.truthy = truthy;

                return {
                    tools: {
                        falsy: falsy,
                        truthy: truthy
                    }
                };
            },
            expectedExports: {
                result: true
            },
            expect: function () {
                it('should call both the .falsy() and .truthy() methods', function () {
                    expect(this.falsy).to.have.been.calledOnce;
                    expect(this.truthy).to.have.been.calledOnce;
                });
            }
        },
        'logical OR (||) operator with short-circuit evaluation, where left and right operands both evaluate to falsy': {
            code: nowdoc(function () {/*<<<EOS
var result = tools.falsy() || tools.alsoFalsy();

exports.result = result;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var falsy = sinon.stub().returns(false),
                    alsoFalsy = sinon.stub().returns(false);

                state.falsy = falsy;
                state.alsoFalsy = alsoFalsy;

                return {
                    tools: {
                        falsy: falsy,
                        alsoFalsy: alsoFalsy
                    }
                };
            },
            expectedExports: {
                result: false
            },
            expect: function () {
                it('should call both the .falsy() and .alsoFalsy() methods', function () {
                    expect(this.falsy).to.have.been.calledOnce;
                    expect(this.alsoFalsy).to.have.been.calledOnce;
                });
            }
        },
        'logical AND (&&) operator with short-circuit evaluation, where left operand evaluates to falsy': {
            code: nowdoc(function () {/*<<<EOS
var result = tools.falsy() && otherTools.truthy();

exports.result = result;
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                var falsy = sinon.stub().returns(false),
                    truthy = sinon.stub().returns(true),
                    getOtherTools = sinon.stub(),
                    expose = {
                        tools: {
                            falsy: falsy
                        }
                    };

                getOtherTools.returns({
                    truthy: truthy
                });

                Object.defineProperty(expose, 'otherTools', {
                    get: getOtherTools
                });

                state.getOtherTools = getOtherTools;
                state.falsy = falsy;
                state.truthy = truthy;

                return expose;
            },
            expectedExports: {
                result: false
            },
            expect: function () {
                it('should only call the .falsy() method, not the .truthy() method', function () {
                    expect(this.falsy).to.have.been.calledOnce;
                    expect(this.truthy).not.to.have.been.called;
                });

                it('should not attempt to read the object variable for the right operand', function () {
                    expect(this.getOtherTools).not.to.have.been.called;
                });
            }
        },
        'throwing error synchronously, no pause': {
            code: nowdoc(function () {/*<<<EOS
throw new Error('Good, I have worked sync');
EOS
*/;}), // jshint ignore:line
            expectedError: new Error('Good, I have worked sync')
        },
        'throwing error after async pause': {
            code: nowdoc(function () {/*<<<EOS
tools.getNumber();

throw new Error('Good, I have worked async');
EOS
*/;}), // jshint ignore:line
            expose: function (state) {
                return {
                    tools: {
                        getNumber: function () {
                            var pause = state.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(21);
                            });

                            pause.now();
                        }
                    }
                };
            },
            expectedError: new Error('Good, I have worked async')
        }
    }, tools.check);
});
