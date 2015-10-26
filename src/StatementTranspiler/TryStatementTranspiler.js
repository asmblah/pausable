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
        var catchStatementIndex = null,
            catchStatements = [],
            handler = node[HANDLER],
            hasCatch = handler && handler[BODY][BODY].length > 0,
            finalizer = node[FINALIZER],
            ownBlockContext = new BlockContext(functionContext),
            statement,
            transpiler = this,
            tryEndIndex,
            tryNode,
            tryStartIndex;

        statement = blockContext.prepareStatement();

        tryStartIndex = functionContext.getCurrentStatementIndex();
        transpiler.statementTranspiler.transpileArray(node[BLOCK][BODY], node, functionContext, ownBlockContext);
        tryEndIndex = functionContext.getCurrentStatementIndex();

        if (hasCatch) {
            catchStatementIndex = functionContext.getCurrentStatementIndex();

            (function () {
                var catchClauseBlockContext = new BlockContext(functionContext),
                    catchParameter = functionContext.getTempName(),
                    resumeThrowStatement = ownBlockContext.addResumeThrow();

                transpiler.statementTranspiler.transpileArray(handler[BODY][BODY], handler, functionContext, catchClauseBlockContext);

                catchStatements.push(
                    {
                        'type': Syntax.IfStatement,
                        'test': acorn.parse(handler[PARAM][NAME] + ' instanceof Resumable.ResumeException').body[0].expression,
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [
                                {
                                    'type': Syntax.ExpressionStatement,
                                    'expression': {
                                        'type': Syntax.AssignmentExpression,
                                        'operator': '=',
                                        'left': handler[PARAM],
                                        'right': {
                                            'type': Syntax.MemberExpression,
                                            'object': handler[PARAM],
                                            'property': {
                                                'type': Syntax.Identifer,
                                                'name': 'error'
                                            },
                                            'computed': false
                                        }
                                    }
                                }
                            ]
                        },
                        'alternate': {
                            'type': Syntax.BlockStatement,
                            'body': [
                                {
                                    'type': Syntax.ExpressionStatement,
                                    'expression': {
                                        'type': Syntax.AssignmentExpression,
                                        'operator': '=',
                                        'left': {
                                            'type': Syntax.Identifier,
                                            'name': 'statementIndex'
                                        },
                                        'right': {
                                            'type': Syntax.Literal,
                                            'value': catchStatementIndex
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    catchClauseBlockContext.getSwitchStatement()
                );

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
            tryNode[HANDLER] = {
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
                        }
                    ].concat(catchStatements)
                }
            };
        }

        if (finalizer) {
            (function () {
                var finallyClauseBlockContext = new BlockContext(functionContext),
                    finallyClauseStatementIndex = functionContext.getCurrentStatementIndex();

                transpiler.statementTranspiler.transpileArray(
                    finalizer[BODY],
                    finalizer,
                    functionContext,
                    finallyClauseBlockContext
                );

                // Jump over the catch block if present to the finalizer
                if (catchStatementIndex !== null) {
                    tryNode[BLOCK][BODY].push({
                        'type': Syntax.IfStatement,
                        'test': acorn.parse('statementIndex === ' + catchStatementIndex).body[0].expression,
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [
                                acorn.parse('statementIndex = ' + finallyClauseStatementIndex + ';').body[0]
                            ]
                        }
                    });
                }

                tryNode[FINALIZER] = {
                    'type': Syntax.BlockStatement,
                    'body': [
                        finallyClauseBlockContext.getSwitchStatement()
                    ]
                };
            }());
        }

        statement.assign(tryNode);
    }
});

module.exports = TryStatementTranspiler;
