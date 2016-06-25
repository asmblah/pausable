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
        var catchParam,
            catchStartIndex = null,
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
            catchStartIndex = functionContext.getCurrentStatementIndex();

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
                                            'value': catchStartIndex
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
                    catchStatementIndex: catchStartIndex
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
        catchParam = handler ? handler[PARAM] : {
            'type': Syntax.Identifier,
            'name': 'resumableError'
        };
        tryNode[HANDLER] = {
            'type': Syntax.CatchClause,
            'param': catchParam,
            'body': {
                'type': Syntax.BlockStatement,
                'body': catchStatements
            }
        };

        if (finalizer) {
            functionContext.addFinally();

            catchStatements.splice(1, 0, {
                'type': Syntax.ExpressionStatement,
                'expression': {
                    'type': Syntax.AssignmentExpression,
                    'left': {
                        'type': Syntax.Identifier,
                        'name': 'resumableUncaughtError'
                    },
                    'operator': '=',
                    'right': catchParam
                }
            });

            if (handler) {
                catchStatements.push({
                    'type': Syntax.ExpressionStatement,
                    'expression': {
                        'type': Syntax.AssignmentExpression,
                        'left': {
                            'type': Syntax.Identifier,
                            'name': 'resumableUncaughtError'
                        },
                        'operator': '=',
                        'right': {
                            'type': Syntax.Identifier,
                            'name': 'null'
                        }
                    }
                });
            }

            (function () {
                var finallyClauseBlockContext = new BlockContext(functionContext),
                    finallyClauseStatementIndex = functionContext.getCurrentStatementIndex(),
                    finallyStatements,
                    finallySwitch;

                transpiler.statementTranspiler.transpileArray(
                    finalizer[BODY],
                    finalizer,
                    functionContext,
                    finallyClauseBlockContext
                );

                finallySwitch = finallyClauseBlockContext.getSwitchStatement();
                finallyStatements = [
                    {
                        'type': Syntax.IfStatement,
                        'test': {
                            'type': Syntax.Identifier,
                            'name': 'resumablePause'
                        },
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [{
                                'type': Syntax.ThrowStatement,
                                'argument': {
                                    'type': Syntax.Identifier,
                                    'name': 'resumablePause'
                                }
                            }]
                        },
                        'alternate': null
                    },
                    {
                        // Only assign the statement index var if we are inside the try/catch/finally block
                        'type': Syntax.IfStatement,
                        'test': acorn.parse(
                            'statementIndex >= ' + tryStartIndex + ' && statementIndex < ' + finallyClauseStatementIndex
                        ).body[0].expression,
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [{
                                'type': Syntax.ExpressionStatement,
                                'expression': {
                                    'type': Syntax.AssignmentExpression,
                                    'left': {
                                        'type': Syntax.Identifier,
                                        'name': 'statementIndex'
                                    },
                                    'operator': '=',
                                    'right': {
                                        'type': Syntax.Literal,
                                        'value': finallyClauseStatementIndex
                                    }
                                }
                            }]
                        },
                        'alternate': null
                    },
                    finallySwitch
                ];

                finallyStatements.push({
                    'type': Syntax.IfStatement,
                    'test': {
                        'type': Syntax.Identifier,
                        'name': 'resumableUncaughtError'
                    },
                    'consequent': {
                        'type': Syntax.BlockStatement,
                        'body': [{
                            'type': Syntax.ThrowStatement,
                            'argument': {
                                'type': Syntax.Identifier,
                                'name': 'resumableUncaughtError'
                            }
                        }]
                    },
                    'alternate': null
                });
                tryNode[FINALIZER] = {
                    'type': Syntax.BlockStatement,
                    'body': finallyStatements
                };
            }());
        }

        catchStatements.unshift({
            'type': Syntax.IfStatement,
            'test': {
                'type': Syntax.BinaryExpression,
                'left': catchParam,
                'operator': 'instanceof',
                'right': {
                    'type': Syntax.MemberExpression,
                    'object': {
                        'type': Syntax.Identifier,
                        'name': 'Resumable'
                    },
                    'property': {
                        'type': Syntax.Identifier,
                        'name': 'PauseException'
                    },
                    'computed': false
                }
            },
            'consequent': {
                'type': Syntax.BlockStatement,
                'body': (finalizer ? [{
                    'type': Syntax.ExpressionStatement,
                    'expression': {
                        'type': Syntax.AssignmentExpression,
                        'left': {
                            'type': Syntax.Identifier,
                            'name': 'resumablePause'
                        },
                        'operator': '=',
                        'right': catchParam
                    }
                }] : []).concat([
                    {
                        'type': Syntax.ThrowStatement,
                        'argument': catchParam
                    }
                ])
            },
            'alternate': null
        });

        statement.assign(tryNode);
    }
});

module.exports = TryStatementTranspiler;
