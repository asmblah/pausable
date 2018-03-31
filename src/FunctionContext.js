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
    hasOwn = {}.hasOwnProperty,
    DECLARATIONS = 'declarations',
    ID = 'id',
    NAME = 'name',
    LabelableContext = require('./LabelableContext'),
    Syntax = estraverse.Syntax;

function FunctionContext() {
    this.assignmentVariables = {};
    this.catches = [];
    this.functionDeclarations = [];
    this.labelableContext = null;
    this.labelableContextStack = [];
    this.lastAssignments = [];
    this.lastTempNames = {};
    this.nextStatementIndex = 0;
    this.nextTempIndex = 0;
    this.parameters = [];
    this.returnInTryOutsideFinally = false;
    this.tryFinallyClauseDepth = 0;
    this.tryWithFinallyClause = false;
    this.tryWithFinallyClauseDepth = 0;
    this.variables = [];
}

_.extend(FunctionContext.prototype, {
    addAssignment: function (index, variableName) {
        var context = this;

        context.assignmentVariables[index] = variableName;
        context.lastAssignments.push(variableName);
    },

    addCatch: function (data) {
        this.catches.push(data);
    },

    addFunctionDeclaration: function (declaration) {
        this.functionDeclarations.push(declaration);
    },

    addParameter: function (name) {
        this.parameters.push(name);
    },

    /**
     * Marks the current function as having a return statement.
     * If the return statement is inside a `try..finally`,
     * then the special `resumableReturnValue` variable will be added to the transpiled output.
     */
    addReturnInTryOutsideFinally: function () {
        var context = this;

        if (context.tryWithFinallyClauseDepth > 0) {
            context.addVariable('resumableReturnValue');
        }

        context.returnInTryOutsideFinally = true;
    },

    addVariable: function (name) {
        this.variables.push(name);
    },

    clearLastAssignments: function () {
        this.lastAssignments = [];
    },

    getCurrentStatementIndex: function () {
        return this.nextStatementIndex;
    },

    /**
     * Called when the transpiler enters the `finally` clause of a `try` statement
     */
    enterTryFinallyClause: function () {
        this.tryFinallyClauseDepth++;
    },

    /**
     * Called when the transpiler first enters a `try` statement that contains a `finally` clause
     */
    enterTryWithFinallyClause: function () {
        var context = this;

        if (context.tryWithFinallyClauseDepth === 0) {
            context.addVariable('resumableUncaughtError');
            context.tryWithFinallyClause = true;
        }

        context.tryWithFinallyClauseDepth++;
    },

    getLabel: function () {
        var context = this,
            labelableContext = context.labelableContext;

        return labelableContext.getPrefixedLabel();
    },

    getLabelableContext: function (label) {
        var context = this,
            i;

        if (!label) {
            return context.labelableContext;
        }

        if (context.labelableContext.getLabel() === label) {
            return context.labelableContext;
        }

        for (i = context.labelableContextStack.length - 1; i >= 0; i--) {
            if (context.labelableContextStack[i].getLabel() === label) {
                return context.labelableContextStack[i];
            }
        }

        return null;
    },

    getLabeledStatement: function (statementNode) {
        return this.labelableContext.getLabeledStatement(statementNode);
    },

    getLastAssignments: function () {
        var context = this,
            lastAssignments = context.lastAssignments;

        context.lastAssignments = [];

        return lastAssignments;
    },

    getNextStatementIndex: function () {
        return this.nextStatementIndex++;
    },

    getStatements: function (switchStatement) {
        var assignmentProperties = [],
            catchesProperties,
            declaration = acorn.parse('var statementIndex = 0;').body[0],
            functionContext = this,
            functionSetup = [],
            index,
            statements = [],
            stateProperties = [],
            stateSetup = acorn.parse('if (Resumable._resumeState_) { statementIndex = Resumable._resumeState_.statementIndex; }').body[0];

        // Make sure the variables are always output in alphabetical order, for consistency
        functionContext.variables.sort();

        _.each(functionContext.variables, function (name) {
            declaration[DECLARATIONS].push({
                'type': Syntax.VariableDeclarator,
                'id': {
                    'type': Syntax.Identifier,
                    'name': name
                },
                'init': null
            });
        });

        if (functionContext.catches.length > 0) {
            catchesProperties = [];
            _.each(functionContext.catches, function (catchData) {
                catchesProperties.push({
                    'type': Syntax.Property,
                    'kind': 'init',
                    'key': {
                        'type': Syntax.Identifier,
                        'name': catchData.catchStatementIndex
                    },
                    'value': {
                        type: Syntax.ObjectExpression,
                        properties: [
                            {
                                'type': Syntax.Property,
                                'kind': 'init',
                                'key': {
                                    'type': Syntax.Identifier,
                                    'name': 'from'
                                },
                                'value': {
                                    type: Syntax.Literal,
                                    value: catchData.tryStartIndex
                                }
                            },
                            {
                                'type': Syntax.Property,
                                'kind': 'init',
                                'key': {
                                    'type': Syntax.Identifier,
                                    'name': 'to'
                                },
                                'value': {
                                    type: Syntax.Literal,
                                    value: catchData.tryEndIndex
                                }
                            },
                            {
                                'type': Syntax.Property,
                                'kind': 'init',
                                'key': {
                                    'type': Syntax.Identifier,
                                    'name': 'param'
                                },
                                'value': {
                                    type: Syntax.Literal,
                                    value: catchData.catchParameter
                                }
                            }
                        ]
                    }
                });
            });

            stateProperties.push({
                'type': Syntax.Property,
                'kind': 'init',
                'key': {
                    'type': Syntax.Identifier,
                    'name': 'catches'
                },
                'value': {
                    type: Syntax.ObjectExpression,
                    properties: catchesProperties
                }
            });
        }

        if (functionContext.tryWithFinallyClause) {
            functionSetup.push({
                'type': Syntax.VariableDeclaration,
                'declarations': [{
                    'type': Syntax.VariableDeclarator,
                    'id': {
                        'type': Syntax.Identifier,
                        'name': 'resumablePause'
                    },
                    'init': {
                        'type': Syntax.Literal,
                        'value': null
                    }
                }],
                'kind': 'var'
            });
        }

        for (index = 0; index < functionContext.nextTempIndex; index++) {
            stateProperties.push({
                'type': Syntax.Property,
                'kind': 'init',
                'key': {
                    'type': Syntax.Identifier,
                    'name': 'temp' + index
                },
                'value': {
                    'type': Syntax.Identifier,
                    'name': 'temp' + index
                }
            });

            declaration.declarations.push({
                'type': Syntax.VariableDeclarator,
                'id': {
                    'type': Syntax.Identifier,
                    'name': 'temp' + index
                },
                'init': null
            });

            stateSetup.consequent.body.push({
                'type': Syntax.ExpressionStatement,
                'expression': {
                    'type': Syntax.AssignmentExpression,
                    'operator': '=',
                    'left': {
                        'type': Syntax.Identifier,
                        'name': 'temp' + index,
                    },
                    'right': acorn.parse('Resumable._resumeState_.temp' + index).body[0].expression
                }
            });
        }

        stateSetup.consequent.body.push(acorn.parse('Resumable._resumeState_ = null;').body[0]);

        _.forOwn(functionContext.assignmentVariables, function (variableName, statementIndex) {
            assignmentProperties.push({
                'type': Syntax.Property,
                'kind': 'init',
                'key': {
                    'type': Syntax.Literal,
                    'value': statementIndex
                },
                'value': {
                    'type': Syntax.Literal,
                    'value': variableName
                }
            });
        });

        statements.push(declaration);
        [].push.apply(statements, functionContext.functionDeclarations);
        statements.push({
            type: Syntax.ReturnStatement,
            argument: {
                type: Syntax.CallExpression,
                arguments: [
                    {
                        type: Syntax.ThisExpression
                    },
                    {
                        type: Syntax.Identifier,
                        name: 'arguments'
                    }
                ],
                callee: {
                    type: Syntax.MemberExpression,
                    object: {
                        type: Syntax.FunctionExpression,
                        id: {
                            type: Syntax.Identifier,
                            name: 'resumableScope'
                        },
                        params: [],
                        body: {
                            type: Syntax.BlockStatement,
                            body: functionSetup.concat([
                                stateSetup,
                                {
                                    type: Syntax.TryStatement,
                                    block: {
                                        type: Syntax.BlockStatement,
                                        body: [
                                            switchStatement
                                        ]
                                    },
                                    handler: {
                                        type: Syntax.CatchClause,
                                        param: {
                                            type: Syntax.Identifier,
                                            name: 'e'
                                        },
                                        body: {
                                            type: Syntax.BlockStatement,
                                            body: [
                                                {
                                                    type: Syntax.IfStatement,
                                                    test: acorn.parse('e instanceof Resumable.PauseException').body[0].expression,
                                                    consequent: {
                                                        type: Syntax.BlockStatement,
                                                        body: [
                                                            {
                                                                type: Syntax.ExpressionStatement,
                                                                expression: {
                                                                    type: Syntax.CallExpression,
                                                                    callee: {
                                                                        type: Syntax.MemberExpression,
                                                                        object: {
                                                                            type: Syntax.Identifier,
                                                                            name: 'e'
                                                                        },
                                                                        property: {
                                                                            type: Syntax.Identifier,
                                                                            name: 'add'
                                                                        },
                                                                        computed: false
                                                                    },
                                                                    arguments: [
                                                                        {
                                                                            type: Syntax.ObjectExpression,
                                                                            properties: [
                                                                                {
                                                                                    type: Syntax.Property,
                                                                                    kind: 'init',
                                                                                    key: {
                                                                                        type: Syntax.Identifier,
                                                                                        name: 'func'
                                                                                    },
                                                                                    value: {
                                                                                        type: Syntax.Identifier,
                                                                                        name: 'resumableScope'
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: Syntax.Property,
                                                                                    kind: 'init',
                                                                                    key: {
                                                                                        type: Syntax.Identifier,
                                                                                        name: 'statementIndex'
                                                                                    },
                                                                                    value: {
                                                                                        type: Syntax.BinaryExpression,
                                                                                        operator: '+',
                                                                                        left: {
                                                                                            type: Syntax.Identifier,
                                                                                            name: 'statementIndex'
                                                                                        },
                                                                                        right: {
                                                                                            type: Syntax.Literal,
                                                                                            value: 1
                                                                                        }
                                                                                    }
                                                                                },
                                                                                {
                                                                                    type: Syntax.Property,
                                                                                    kind: 'init',
                                                                                    key: {
                                                                                        type: Syntax.Identifier,
                                                                                        name: 'assignments'
                                                                                    },
                                                                                    value: {
                                                                                        type: Syntax.ObjectExpression,
                                                                                        properties: assignmentProperties
                                                                                    }
                                                                                }
                                                                            ].concat(stateProperties)
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                {
                                                    type: Syntax.ThrowStatement,
                                                    argument: {
                                                        type: Syntax.Identifier,
                                                        name: 'e'
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ])
                        }
                    },
                    property: {
                        type: Syntax.Identifier,
                        name: 'apply'
                    }
                }
            }
        });

        return statements;
    },

    getTempName: function () {
        return 'temp' + this.nextTempIndex++;
    },

    getTempNameForVariable: function (variableName, blockContext) {
        var context = this,
            tempName;

        tempName = context.getTempName();

        context.lastTempNames[variableName] = tempName;

        blockContext.addAssignment(tempName).assign({
            'type': Syntax.Identifier,
            'name': variableName
        });

        return tempName;
    },

    getLastTempName: function () {
        return 'temp' + (this.nextTempIndex - 1);
    },

    getLastTempNameForVariable: function (variableName) {
        var context = this;

        // Return the variable's name if it has not been assigned a temporary variable
        if (!hasOwn.call(context.lastTempNames, variableName)) {
            return variableName;
        }

        return context.lastTempNames[variableName];
    },

    /**
     * Returns true if this function contains a return statement, false otherwise
     *
     * @return {boolean}
     */
    hasReturnInTryOutsideFinally: function () {
        return this.returnInTryOutsideFinally;
    },

    hasVariableDefined: function (name) {
        var isDefined = false;

        _.each(this.functionDeclarations, function (functionDeclaration) {
            if (functionDeclaration[ID] && functionDeclaration[ID][NAME] === name) {
                isDefined = true;
                return false;
            }
        });

        _.each(this.variables, function (variable) {
            if (variable === name) {
                isDefined = true;
            }
        });

        return isDefined;
    },

    /**
     * Determines whether the transpiler is currently inside the `finally` clause of a `try` statement
     *
     * @return {boolean}
     */
    isInsideTryFinallyClause: function () {
        return this.tryFinallyClauseDepth > 0;
    },

    /**
     * Determines whether the transpiler is currently anywhere inside a `try` statement
     * that also contains a `finally` clause (including inside the `finally` clause itself)
     *
     * @return {boolean}
     */
    isInsideTryWithFinallyClause: function () {
        return this.tryWithFinallyClauseDepth > 0;
    },

    /**
     * Called when the transpiler leaves the `finally` clause of a `try` statement
     */
    leaveTryFinallyClause: function () {
        var context = this;

        context.tryFinallyClauseDepth--;
        context.tryWithFinallyClauseDepth--;
    },

    popLabelableContext: function () {
        var context = this;

        context.labelableContext = context.labelableContextStack.pop();
    },

    pushLabelableContext: function (label) {
        var context = this,
            labelableContextIndex = context.labelableContextStack.length,
            labelableContext = new LabelableContext(label, labelableContextIndex);

        context.labelableContextStack.push(context.labelableContext);
        context.labelableContext = labelableContext;

        return labelableContext;
    }
});

module.exports = FunctionContext;
