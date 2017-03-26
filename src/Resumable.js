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
    // convertSourceMap = require('convert-source-map'),
    // sourceMapToAST = require('sourcemap-to-ast'),
    sourceMapToComment = require('source-map-to-comment'),
    PauseException = require('./PauseException'),
    Promise = require('lie'),
    ResumeException = require('./ResumeException'),
    SourceMapConsumer = require('source-map').SourceMapConsumer,
    SourceMapGenerator = require('source-map').SourceMapGenerator,
    FROM = 'from',
    PARAM = 'param',
    STRICT = 'strict',
    TO = 'to';

function Resumable(transpiler) {
    this.nextAnonymousFileID = 0;
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
        var resumable = this,
            func = resumable.transpile(code, options);

        return resumable.call(func, [], null);
    },

    executeSync: function (args, fn, options) {
        var code = 'return ' + fn.toString(),
            resumable = this,
            func = resumable.transpile(code, options);

        return resumable.callSync(func(), args, null);
    },

    transpile: function (code, options) {
        var ast,
            existingSourceMapMatch,
            expose,
            func,
            hasPath,
            names = ['Resumable'],
            output,
            path,
            prefixedPath,
            resumable = this,
            transpiledCode,
            values = [Resumable];

        options = options || {};
        expose = options.expose || {};
        hasPath = !!options.path;
        path = hasPath ? options.path : '<vm ' + (resumable.nextAnonymousFileID++) + '>.js';
        path = require('path').normalize(path);
        prefixedPath = path;//'prefix/' + path;//'[[pausable]] ' + path;

        ast = acorn.parse(code, {
            'allowReturnOutsideFunction': true,
            'locations': true,
            'sourceFile': prefixedPath
        });

        // // Extract any existing source map from the code
        // // existingSourceMap = convertSourceMap.fromSource(code);
        // existingSourceMap = code.match(/^\/\/# pausable:sourceMap=(.*)$/);
        //
        // // Apply any existing source map mappings to the parsed AST nodes' location data
        // if (existingSourceMap) {
        //     sourceMapToAST(ast, existingSourceMap.toObject());
        // }

        // // Extract any existing source map from the code
        // existingSourceMapMatch = code.match(/^\/\/# pausable:sourceMap=(.*)$/m);
        //
        // // Apply any existing source map mappings to the parsed AST nodes' location data
        // if (existingSourceMapMatch) {
        //     sourceMapToAST(ast, JSON.parse(existingSourceMapMatch[1]));
        // }

        _.forOwn(expose, function (value, name) {
            names.push(name);
            values.push(value);
        });

        ast = resumable.transpiler.transpile(ast);

        output = escodegen.generate(ast, {
            format: {
                indent: {
                    style: '    ',
                    base: 0
                }
            },
            sourceMap: true,
            sourceMapWithCode: true
        });

        // Extract any existing source map from the code
        existingSourceMapMatch = code.match(/^\/\/# pausable:sourceMap=(.*)$/m);

        // Apply any existing source map mappings to the parsed AST nodes' location data
        if (existingSourceMapMatch) {
            var consumer = new SourceMapConsumer(JSON.parse(existingSourceMapMatch[1])),
                sourceContent = consumer.sourceContentFor(path, true);

            if (sourceContent !== null) {
                output.map.setSourceContent(prefixedPath, sourceContent);
            }

            output.map.applySourceMap(
                consumer,
                path
            );

            // var rawSourceMap = JSON.parse(existingSourceMapMatch[1]),
            //     consumer = new SourceMapConsumer(_.extend(rawSourceMap, {/*sourceRoot: '[[pausable]]'*/})),
            //     generator = SourceMapGenerator.fromSourceMap(consumer),
            //     sourceContent = consumer.sourceContentFor(path, true);
            //
            // // if (sourceContent !== null) {
            // //     generator.setSourceContent(prefixedPath, sourceContent);
            // // }
            //
            // generator.applySourceMap(
            //     new SourceMapConsumer(output.map.toJSON()),
            //     path
            // );
            //
            // // FIXME
            // output = {
            //     code: output.code,
            //     map: generator
            // };
        }

        if (!hasPath) {
            // Make sure the code is in the source map
            output.map.setSourceContent(prefixedPath, code);
        }

        transpiledCode = 'return ' + output.code;

        if (options[STRICT]) {
            transpiledCode = '"use strict"; ' + transpiledCode;
        }

        // Append a source map comment containing the entire source map data as a data: URI,
        // in the form `//# sourceMappingURL=data:application/json;base64,...`
        transpiledCode += '\n\n' + sourceMapToComment(output.map.toJSON()) + '\n';

        // /*jshint evil:true */
        // func = new Function(names, transpiledCode);
        //
        // return func.apply(null, values);


        // Use eval(...) rather than the Function constructor, otherwise Chrome's debugger
        // won't recognise the source map comment
        /*jshint evil:true */
        func = (0, eval)('(function (' + names + ') {' + transpiledCode + '})');

        return func.apply(null, values);
    }
});

module.exports = Resumable;
