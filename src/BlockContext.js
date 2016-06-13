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
    CONSEQUENT = 'consequent',
    Syntax = estraverse.Syntax,
    createSwitchCase = function createSwitchCase(statementNode, index, nextIndex) {
        var consequent = [statementNode];

        if (nextIndex !== null) {
            if (!nextIndex) {
                nextIndex = index + 1;
            }

            consequent.push(acorn.parse('statementIndex = ' + nextIndex + ';').body[0]);
        }

        return {
            type: Syntax.SwitchCase,
            test: {
                type: Syntax.Literal,
                value: index
            },
            consequent: consequent
        };
    };

function BlockContext(functionContext) {
    this.functionContext = functionContext;
    this.switchCases = [];
    this.transforms = [];
    this.transformsStack = [];
}

_.extend(BlockContext.prototype, {
    addAssignment: function (name) {
        var context = this,
            index = context.functionContext.getNextStatementIndex();

        return {
            assign: function (expressionNode) {
                if (!expressionNode) {
                    throw new Error('Expression node must be specified');
                }

                context.functionContext.addAssignment(index, name);

                context.switchCases[index] = createSwitchCase(
                    {
                        'type': Syntax.ExpressionStatement,
                        'expression': {
                            'type': Syntax.AssignmentExpression,
                            'operator': '=',
                            'left': {
                                'type': Syntax.Identifier,
                                'name': name
                            },
                            'right': expressionNode
                        }
                    },
                    index
                );
            }
        };
    },

    addResumeThrow: function () {
        var context = this,
            index = context.functionContext.getCurrentStatementIndex();

        return {
            assign: function (expressionNode) {
                var endIndex = context.functionContext.getCurrentStatementIndex() - 1,
                    i;

                if (!expressionNode) {
                    throw new Error('Expression node must be specified');
                }

                // Previous statement needs to skip over the throw:
                // it will only be needed for resumes
                context.appendToLastStatement({
                    'type': Syntax.BreakStatement,
                    'label': null
                });

                // Add a case that simply throws the error,
                // to allow us to easily resume inside a catch block
                for (i = index; i < endIndex; i++) {
                    context.switchCases[i] = {
                        'type': Syntax.SwitchCase,
                        'test': {
                            type: Syntax.Literal,
                            value: i
                        },
                        'consequent': []
                    };
                }

                context.switchCases[endIndex] = {
                    'type': Syntax.SwitchCase,
                    'test': {
                        type: Syntax.Literal,
                        value: endIndex
                    },
                    'consequent': [
                        {
                            'type': Syntax.ThrowStatement,
                            'argument': {
                                'type': Syntax.NewExpression,
                                'callee': {
                                    'type': Syntax.MemberExpression,
                                    'object': {
                                        'type': Syntax.Identifier,
                                        'name': 'Resumable'
                                    },
                                    'property': {
                                        'type': Syntax.Identifier,
                                        'name': 'ResumeException'
                                    },
                                    'computed': false
                                },
                                'arguments': [expressionNode]
                            }
                        }
                    ]
                };
            }
        };
    },

    appendToLastStatement: function (statementNode) {
        var context = this,
            switchCase = context.switchCases[context.switchCases.length - 1];

        if (!switchCase) {
            return;
        }

        if (_.isArray(switchCase)) {
            switchCase[switchCase.length - 1][CONSEQUENT].push(statementNode);
        } else {
            switchCase.push(statementNode);
        }
    },

    getSwitchStatement: function () {
        var switchCases = [];

        _.each(this.switchCases, function (switchCase) {
            if (switchCase) {
                if (_.isArray(switchCase)) {
                    [].push.apply(switchCases, switchCase);
                } else {
                    switchCases.push(switchCase);
                }
            }
        });

        return {
            'type': Syntax.SwitchStatement,
            'discriminant': {
                'type': Syntax.Identifier,
                'name': 'statementIndex'
            },
            'cases': switchCases
        };
    },

    prepareStatement: function () {
        var context = this,
            endIndex = null,
            index = context.functionContext.getNextStatementIndex(),
            transforms = context.transforms.slice();

        context.transforms = [];

        return {
            append: function (statementNode) {
                var switchCase = context.switchCases[index];

                if (!switchCase) {
                    throw new Error('Cannot append as statement has not been assigned yet!');
                }

                if (_.isArray(switchCase)) {
                    switchCase[switchCase.length - 1][CONSEQUENT].push(statementNode);
                } else {
                    switchCase.push(statementNode);
                }
            },

            assign: function (statementNode, nextIndex) {
                var i,
                    switchCases = [];

                for (i = 0; i < transforms.length; i++) {
                    statementNode = transforms[i](statementNode);
                }

                if (!endIndex) {
                    endIndex = context.functionContext.getCurrentStatementIndex();
                }

                for (i = index; i < endIndex - 1; i++) {
                    switchCases.push({
                        type: Syntax.SwitchCase,
                        test: {
                            type: Syntax.Literal,
                            value: i
                        },
                        consequent: i === index ? [
                            acorn.parse('statementIndex = ' + (index + 1) + ';').body[0]
                        ] : []
                    });
                }

                switchCases.push(createSwitchCase(statementNode, endIndex - 1, nextIndex));

                context.switchCases[index] = switchCases;
            },

            captureEndIndex: function () {
                endIndex = context.functionContext.getCurrentStatementIndex();
            },

            getEndIndex: function () {
                return endIndex;
            },

            getIndex: function () {
                return index;
            },

            prepend: function (statementNode) {
                var switchCase = context.switchCases[index];

                if (!switchCase) {
                    throw new Error('Cannot prepend as statement has not been assigned yet!');
                }

                if (_.isArray(switchCase)) {
                    switchCase[switchCase.length - 1][CONSEQUENT].unshift(statementNode);
                } else {
                    switchCase.unshift(statementNode);
                }
            }
        };
    },

    popTransforms: function () {
        this.transforms = this.transformsStack.pop();
    },

    pushTransforms: function () {
        var context = this;

        context.transformsStack.push(context.transforms);
        context.transforms = [];
    },

    transformNextStatement: function (transformer) {
        // Perform the most recent transformation first
        this.transforms.unshift(transformer);
    }
});

module.exports = BlockContext;
