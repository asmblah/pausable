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
    acorn = require('acorn'),
    estraverse = require('estraverse'),
    BlockContext = require('../BlockContext'),
    BLOCK = 'block',
    BODY = 'body',
    HANDLER = 'handler',
    FINALIZER = 'finalizer',
    NAME = 'name',
    PARAM = 'param',
    Syntax = estraverse.Syntax;

function TryStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(TryStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.TryStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var catchStatementIndex,
            handler = node[HANDLER],
            ownBlockContext = new BlockContext(functionContext),
            resultHandler = null,
            statement,
            transpiler = this,
            tryEndIndex,
            tryNode,
            tryStartIndex;

        statement = blockContext.prepareStatement();

        tryStartIndex = functionContext.getCurrentStatementIndex();
        transpiler.statementTranspiler.transpileArray(node[BLOCK][BODY], node, functionContext, ownBlockContext);
        tryEndIndex = functionContext.getCurrentStatementIndex();

        if (handler) {
            catchStatementIndex = functionContext.getCurrentStatementIndex();

            (function () {
                var catchClauseBlockContext = new BlockContext(functionContext),
                    catchParameter = functionContext.getTempName(),
                    resumeThrowStatement = ownBlockContext.addResumeThrow();

                transpiler.statementTranspiler.transpileArray(handler[BODY][BODY], handler, functionContext, catchClauseBlockContext);

                resultHandler = {
                    'type': Syntax.CatchClause,
                    'param': handler[PARAM],
                    'body': {
                        'type': Syntax.BlockStatement,
                        'body': [
                            {
                                'type': Syntax.IfStatement,
                                'test': acorn.parse(handler[PARAM][NAME] + ' instanceof Resumable.PauseException').body[0].expression,
                                'consequent': {
                                    'type': Syntax.BlockStatement,
                                    'body': [
                                        {
                                            'type': Syntax.ThrowStatement,
                                            'argument': handler[PARAM]
                                        }
                                    ]
                                }
                            },
                            catchClauseBlockContext.getSwitchStatement()
                        ]
                    }
                };

                functionContext.addCatch({
                    tryStartIndex: tryStartIndex,
                    tryEndIndex: tryEndIndex - 1,
                    catchParameter: catchParameter,
                    catchStatementIndex: catchStatementIndex
                });

                resumeThrowStatement.assign({
                    'type': Syntax.Identifier,
                    'name': catchParameter
                });
            }());
        }

        tryNode = {
            'type': Syntax.TryStatement,
            'block': {
                'type': Syntax.BlockStatement,
                'body': [
                    ownBlockContext.getSwitchStatement()
                ]
            }
        };

        if (handler) {
            tryNode[HANDLER] = resultHandler;
        }

        if (node[FINALIZER]) {
            tryNode[FINALIZER] = node[FINALIZER];
        }

        statement.assign(tryNode);
    }
});

module.exports = TryStatementTranspiler;
