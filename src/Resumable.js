/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    escodegen = require('escodegen'),
    esprima = require('esprima'),
    PauseException = require('./PauseException'),
    Promise = require('./Promise')

function Resumable(transpiler) {
    this.transpiler = transpiler;
}

_.extend(Resumable, {
    _resumeState_: null,
    PauseException: PauseException
});

_.extend(Resumable.prototype, {
    createPause: function () {
        var pause = new PauseException(function (promise, result, states) {
                var i,
                    lastResult = result,
                    state;

                for (i = 0; i < states.length; i++) {
                    state = states[i];

                    if (state.assignments[state.statementIndex - 1]) {
                        state[state.assignments[state.statementIndex - 1]] = lastResult;
                    }

                    Resumable._resumeState_ = state;

                    try {
                        lastResult = state.func();
                    } catch (e) {
                        if (e instanceof PauseException) {
                            e.setPromise(promise);

                            return;
                        }

                        throw e;
                    }
                }

                promise.resolve();
            });

        return pause;
    },

    execute: function (code, options) {
        var ast = esprima.parse(code),
            expose,
            func,
            names = ['Resumable'],
            promise = new Promise(),
            transpiledCode,
            values = [Resumable];

        options = options || {};
        expose = options.expose || {};

        _.forOwn(expose, function (value, name) {
            names.push(name);
            values.push(value);
        });

        ast = this.transpiler.transpile(ast);

        transpiledCode = escodegen.generate(ast, {
            format: {
                indent: {
                    style: '    ',
                    base: 0
                }
            }
        });

        /*jshint evil:true */
        func = new Function(names, 'return ' + transpiledCode);

        try {
            func.apply(null, values)();
        } catch (e) {
            if (e instanceof PauseException) {
                e.setPromise(promise);
            } else {
                promise.reject(e);
            }

            return promise;
        }

        promise.resolve();

        return promise;
    }
});

module.exports = Resumable;
