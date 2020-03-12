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
    CAUGHT_ERROR_VARIABLE = 'resumableError',
    HANDLER = 'handler',
    FINALIZER = 'finalizer',
    NAME = 'name',
    PARAM = 'param',
    PAUSE_EXCEPTION_VARIABLE = 'resumablePause',
    UNCAUGHT_ERROR_VARIABLE = 'resumableUncaughtError',
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
        var catchStartIndex = null,
            catchStatements = [],
            handler = node[HANDLER],
            catchParam = handler ? handler[PARAM] : {
                'type': Syntax.Identifier,
                'name': CAUGHT_ERROR_VARIABLE
            },
            hasCatch = handler && handler[BODY][BODY].length > 0,
            finalizer = node[FINALIZER],
            catchParameter,
            ownBlockContext = new BlockContext(functionContext),
            statement,
            transpiler = this,
            tryEndIndex,
            tryNode,
            tryStartIndex;

        if (finalizer) {
            functionContext.enterTryWithFinallyClause();

            if (!handler && !functionContext.hasVariableDefined(UNCAUGHT_ERROR_VARIABLE)) {
                functionContext.addVariable(UNCAUGHT_ERROR_VARIABLE, {
                    'type': Syntax.MemberExpression,
                    'object': {
                        'type': Syntax.Identifier,
                        'name': 'Resumable'
                    },
                    'property': {
                        'type': Syntax.Identifier,
                        'name': 'UNSET'
                    },
                    'computed': false
                });
            }
        }

        statement = blockContext.prepareStatement();

        tryStartIndex = functionContext.getCurrentStatementIndex();
        transpiler.statementTranspiler.transpileArray(node[BLOCK][BODY], node, functionContext, ownBlockContext);
        tryEndIndex = functionContext.getCurrentStatementIndex();

        if (hasCatch) {
            catchStartIndex = functionContext.getCurrentStatementIndex();
            catchParameter = functionContext.getTempName(finalizer ? {
                'type': Syntax.MemberExpression,
                'object': {
                    'type': Syntax.Identifier,
                    'name': 'Resumable'
                },
                'property': {
                    'type': Syntax.Identifier,
                    'name': 'UNSET'
                },
                'computed': false
            } : null);

            (function () {
                var catchClauseBlockContext = new BlockContext(functionContext),
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
                    }
                );

                catchStatements.push(
                    {
                        'type': Syntax.TryStatement,
                        'block': {
                            'type': Syntax.BlockStatement,
                            'body': [
                                catchClauseBlockContext.getSwitchStatement()
                            ]
                        },
                        'handler': {
                            'type': Syntax.CatchClause,
                            'param': {
                                'type': Syntax.Identifier,
                                'name': CAUGHT_ERROR_VARIABLE
                            },
                            'body': {
                                'type': Syntax.BlockStatement,
                                'body': [{
                                    'type': Syntax.IfStatement,
                                    'test': {
                                        'type': Syntax.BinaryExpression,
                                        'left': {
                                            'type': Syntax.Identifier,
                                            'name': CAUGHT_ERROR_VARIABLE
                                        },
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
                                        'body': [{
                                            'type': Syntax.ExpressionStatement,
                                            'expression': {
                                                'type': Syntax.AssignmentExpression,
                                                'left': {
                                                    'type': Syntax.Identifier,
                                                    'name': PAUSE_EXCEPTION_VARIABLE
                                                },
                                                'operator': '=',
                                                'right': {
                                                    'type': Syntax.Identifier,
                                                    'name': CAUGHT_ERROR_VARIABLE
                                                }
                                            }
                                        }, {
                                            'type': Syntax.ExpressionStatement,
                                            'expression': {
                                                'type': Syntax.AssignmentExpression,
                                                'left': {
                                                    'type': Syntax.Identifier,
                                                    'name': catchParameter
                                                },
                                                'operator': '=',
                                                'right': catchParam
                                            }
                                        }]
                                    },
                                    'alternate': {
                                        'type': Syntax.BlockStatement,
                                        'body': [{
                                            'type': Syntax.ExpressionStatement,
                                            'expression': {
                                                'type': Syntax.AssignmentExpression,
                                                'left': {
                                                    'type': Syntax.Identifier,
                                                    'name': catchParameter
                                                },
                                                'operator': '=',
                                                'right': {
                                                    'type': Syntax.Identifier,
                                                    'name': CAUGHT_ERROR_VARIABLE
                                                }
                                            }
                                        }]
                                    }
                                }, {
                                    'type': Syntax.ThrowStatement,
                                    'argument': {
                                        'type': Syntax.Identifier,
                                        'name': CAUGHT_ERROR_VARIABLE
                                    }
                                }]
                            }
                        }
                    }
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
        tryNode[HANDLER] = {
            'type': Syntax.CatchClause,
            'param': catchParam,
            'body': {
                'type': Syntax.BlockStatement,
                'body': catchStatements
            }
        };

        if (finalizer) {
            functionContext.enterTryFinallyClause();

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
                            'name': PAUSE_EXCEPTION_VARIABLE
                        },
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [{
                                'type': Syntax.ThrowStatement,
                                'argument': {
                                    'type': Syntax.Identifier,
                                    'name': PAUSE_EXCEPTION_VARIABLE
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

                if (!handler) {
                    finallyStatements.push({
                        'type': Syntax.IfStatement,
                        'test': {
                            'type': Syntax.BinaryExpression,
                            'left': {
                                'type': Syntax.Identifier,
                                'name': UNCAUGHT_ERROR_VARIABLE
                            },
                            'operator': '!==',
                            'right': {
                                'type': Syntax.MemberExpression,
                                'object': {
                                    'type': Syntax.Identifier,
                                    'name': 'Resumable'
                                },
                                'property': {
                                    'type': Syntax.Identifier,
                                    'name': 'UNSET'
                                },
                                'computed': false
                            }
                        },
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [{
                                'type': Syntax.ThrowStatement,
                                'argument': {
                                    'type': Syntax.Identifier,
                                    'name': UNCAUGHT_ERROR_VARIABLE
                                }
                            }]
                        },
                        'alternate': null
                    });
                }

                if (functionContext.hasReturnInTryOutsideFinally()) {
                    finallyStatements.push({
                        'type': Syntax.IfStatement,
                        'test': {
                            'type': Syntax.BinaryExpression,
                            'left': {
                                /*
                                 * If an error has been thrown, we won't want to cancel that by returning
                                 * from inside the finally clause, but that will have been handled at this point
                                 * by the re-throw just above here.
                                 */
                                'type': Syntax.Identifier,
                                'name': 'resumableReturnValue'
                            },
                            'operator': '!==',
                            'right': {
                                'type': Syntax.MemberExpression,
                                'object': {
                                    'type': Syntax.Identifier,
                                    'name': 'Resumable'
                                },
                                'property': {
                                    'type': Syntax.Identifier,
                                    'name': 'UNSET'
                                },
                                'computed': false
                            }
                        },
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [{
                                'type': Syntax.ReturnStatement,
                                'argument': {
                                    'type': Syntax.Identifier,
                                    'name': 'resumableReturnValue'
                                }
                            }]
                        },
                        'alternate': null
                    });
                }

                if (hasCatch) {
                    finallyStatements.push({
                        'type': Syntax.IfStatement,
                        'test': {
                            'type': Syntax.BinaryExpression,
                            'left': {
                                'type': Syntax.Identifier,
                                'name': catchParameter
                            },
                            'operator': '!==',
                            'right': {
                                'type': Syntax.MemberExpression,
                                'object': {
                                    'type': Syntax.Identifier,
                                    'name': 'Resumable'
                                },
                                'property': {
                                    'type': Syntax.Identifier,
                                    'name': 'UNSET'
                                },
                                'computed': false
                            }
                        },
                        'consequent': {
                            'type': Syntax.BlockStatement,
                            'body': [{
                                'type': Syntax.ThrowStatement,
                                'argument': {
                                    'type': Syntax.Identifier,
                                    'name': catchParameter
                                }
                            }]
                        },
                        'alternate': null
                    });
                }

                tryNode[FINALIZER] = {
                    'type': Syntax.BlockStatement,
                    'body': finallyStatements
                };
            }());

            functionContext.leaveTryFinallyClause();
        }

        if (!handler) {
            catchStatements.unshift({
                'type': Syntax.ThrowStatement,
                'argument': catchParam
            });
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
                            'name': PAUSE_EXCEPTION_VARIABLE
                        },
                        'operator': '=',
                        'right': catchParam
                    }
                }] : []).concat(handler ? [
                    {
                        'type': Syntax.ThrowStatement,
                        'argument': catchParam
                    }
                ] : [])
            },
            'alternate': handler ?
                null :
                {
                    'type': Syntax.BlockStatement,
                    'body': [{
                        'type': Syntax.ExpressionStatement,
                        'expression': {
                            'type': Syntax.AssignmentExpression,
                            'left': {
                                'type': Syntax.Identifier,
                                'name': UNCAUGHT_ERROR_VARIABLE
                            },
                            'operator': '=',
                            'right': catchParam
                        }
                    }]
                }
        });

        statement.assign(tryNode);
    }
});

module.exports = TryStatementTranspiler;
