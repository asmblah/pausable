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
    escodegen = require('escodegen'),
    acorn = require('acorn'),
    PauseException = require('./PauseException'),
    Promise = require('bluebird'),
    ResumeException = require('./ResumeException'),
    FROM = 'from',
    PARAM = 'param',
    STRICT = 'strict',
    TO = 'to';

function Resumable(transpiler) {
    this.transpiler = transpiler;
}

_.extend(Resumable, {
    _resumeState_: null,
    PauseException: PauseException,
    ResumeException: ResumeException
});

_.extend(Resumable.prototype, {
    call: function (func, args, thisObj) {
        return new Promise(function (resolve, reject) {
            var result;

            try {
                result = func.apply(thisObj, args);
            } catch (e) {
                if (e instanceof PauseException) {
                    e.setPromise(resolve, reject);
                } else {
                    reject(e);
                }

                return;
            }

            resolve(result);
        });
    },

    callSync: function (func, args, thisObj) {
        var result;

        try {
            result = func.apply(thisObj, args);
        } catch (e) {
            if (e instanceof PauseException) {
                throw new Error('Resumable.callSync() :: Main thread must not pause');
            }

            throw e;
        }

        return result;
    },

    createPause: function () {
        var pause = new PauseException(function (resolve, reject, error, result, states) {
                var i = 0,
                    lastResult = result,
                    state;

                if (error) {
                    /*jshint loopfunc: true */
                    for (; i < states.length; i++) {
                        state = states[i];

                        _.each(state.catches, function (data, catchStatementIndex) {
                            if (state.statementIndex < data[FROM] || state.statementIndex > data[TO]) {
                                return;
                            }

                            state.statementIndex = catchStatementIndex * 1;
                            state[data[PARAM]] = error;
                            error = null;

                            Resumable._resumeState_ = state;

                            try {
                                lastResult = state.func();
                            } catch (e) {
                                if (e instanceof PauseException) {
                                    e.setPromise(resolve, reject);

                                    return false;
                                }

                                throw e;
                            }

                            return false;
                        });

                        if (error === null) {
                            break;
                        }
                    }

                    if (i === states.length) {
                        // Error was not handled by anything up the call stack
                        reject(error);
                        return;
                    }
                }

                function handleNextState() {
                    if (i === states.length) {
                        resolve(lastResult);
                        return;
                    }

                    state = states[i];
                    i++;

                    if (state.assignments[state.statementIndex - 1]) {
                        state[state.assignments[state.statementIndex - 1]] = lastResult;
                    }

                    Resumable._resumeState_ = state;

                    try {
                        lastResult = state.func();
                    } catch (e) {
                        if (e instanceof PauseException) {
                            e.setPromise(
                                function (result) {
                                    lastResult = result;
                                    handleNextState();
                                },
                                function (error) {
                                    // FIXME: Probably needs to call catch handlers
                                    reject(error);
                                }
                            );

                            return;
                        }

                        throw e;
                    }

                    handleNextState();
                }

                handleNextState();
            });

        return pause;
    },

    execute: function (code, options) {
        var ast = acorn.parse(code, {'allowReturnOutsideFunction': true}),
            expose,
            func,
            names = ['Resumable'],
            resumable = this,
            transpiledCode,
            values = [Resumable];

        options = options || {};
        expose = options.expose || {};

        _.forOwn(expose, function (value, name) {
            names.push(name);
            values.push(value);
        });

        ast = resumable.transpiler.transpile(ast);

        transpiledCode = escodegen.generate(ast, {
            format: {
                indent: {
                    style: '    ',
                    base: 0
                }
            }
        });

        transpiledCode = 'return ' + transpiledCode;

        if (options[STRICT]) {
            transpiledCode = '"use strict"; ' + transpiledCode;
        }

        /*jshint evil:true */
        func = new Function(names, transpiledCode);

        return resumable.call(func.apply(null, values), [], null);
    },

    executeSync: function (args, fn, options) {
        var code = 'return ' + fn.toString(),
            ast = acorn.parse(code, {'allowReturnOutsideFunction': true}),
            expose,
            func,
            names = ['Resumable'],
            resumable = this,
            transpiledCode,
            values = [Resumable];

        options = options || {};
        expose = options.expose || {};

        _.forOwn(expose, function (value, name) {
            names.push(name);
            values.push(value);
        });

        ast = resumable.transpiler.transpile(ast);

        transpiledCode = escodegen.generate(ast, {
            format: {
                indent: {
                    style: '    ',
                    base: 0
                }
            }
        });

        transpiledCode = 'return ' + transpiledCode;

        if (options[STRICT]) {
            transpiledCode = '"use strict"; ' + transpiledCode;
        }

        /*jshint evil:true */
        func = new Function(names, transpiledCode);

        return resumable.callSync(func.apply(null, values)(), args, null);
    }
});

module.exports = Resumable;
