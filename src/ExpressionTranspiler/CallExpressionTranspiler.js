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
    estraverse = require('estraverse'),
    ARGUMENTS = 'arguments',
    CALLEE = 'callee',
    OBJECT = 'object',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

/**
 * @param {StatementTranspiler} statementTranspiler
 * @param {ExpressionTranspiler} expressionTranspiler
 * @param {ReferenceStringifier} referenceStringifier
 * @constructor
 */
function CallExpressionTranspiler(statementTranspiler, expressionTranspiler, referenceStringifier) {
    /**
     * @type {ExpressionTranspiler}
     */
    this.expressionTranspiler = expressionTranspiler;
    /**
     * @type {ReferenceStringifier}
     */
    this.referenceStringifier = referenceStringifier;
    /**
     * @type {StatementTranspiler}
     */
    this.statementTranspiler = statementTranspiler;
}

_.extend(CallExpressionTranspiler.prototype, {
    /**
     * Fetches the type of Parser API AST node that this transpiler is for
     *
     * @return {string}
     */
    getNodeType: function () {
        return Syntax.CallExpression;
    },

    /**
     * Transpiles a function or method call by recursively transpiling the callee and any arguments
     * into separate switch cases to allow for any pauses
     *
     * @param {object} node Parser API CallExpression AST node to transpile
     * @param {object} parent Parser API AST node that this call node belongs to
     * @param {FunctionContext} functionContext
     * @param {BlockContext} blockContext
     * @return {object} Resulting Parser API AST node to transpile this call to
     */
    transpile: function (node, parent, functionContext, blockContext) {
        var args = node[ARGUMENTS],
            assignments,
            callee,
            calleeCall,
            callNode,
            originalCallableName,
            tempCallableName,
            transpiler = this,
            tempNameForAssignment;

        functionContext.clearLastAssignments();

        callee = transpiler.expressionTranspiler.transpile(node[CALLEE], node, functionContext, blockContext);
        calleeCall = callee;

        assignments = functionContext.getLastAssignments();

        args = transpiler.expressionTranspiler.transpileArray(args, node, functionContext, blockContext);

        if (node[CALLEE][TYPE] === Syntax.MemberExpression) {
            // Change callee to a '... .call(...)' to preserve thisObj
            args = [
                assignments.length > 1 ?
                    {
                        'type': Syntax.Identifier,
                        'name': assignments[assignments.length - 2]
                    } :
                    node[CALLEE][OBJECT]
            ].concat(args);

            calleeCall = {
                'type': Syntax.MemberExpression,
                'object': callee,
                'property': {
                    'type': Syntax.Identifier,
                    'name': 'call'
                },
                'computed': false
            };
        }

        callNode = {
            'type': Syntax.CallExpression,
            'callee': calleeCall,
            'arguments': args
        };

        originalCallableName = transpiler.referenceStringifier.stringify(node[CALLEE]);
        tempCallableName = transpiler.referenceStringifier.stringify(callee);

        if (tempCallableName !== originalCallableName) {
            /*
             * The reference that is being called has been renamed (eg. to `temp9`),
             * so if it is not callable (eg. when trying to call an undefined method),
             * we need to inject this test so that we can throw a readable TypeError instead
             */
            callNode = {
                'type': Syntax.SequenceExpression,
                'expressions': [
                    {
                        'type': Syntax.CallExpression,
                        'callee': {
                            'type': Syntax.MemberExpression,
                            'object': {
                                'type': Syntax.Identifier,
                                'name': 'Resumable'
                            },
                            'property': {
                                'type': Syntax.Identifier,
                                'name': 'checkCallable'
                            }
                        },
                        'arguments': [
                            {
                                'type': Syntax.Literal,
                                'value': originalCallableName
                            },
                            {
                                'type': Syntax.Identifier,
                                'name': tempCallableName
                            }
                        ]
                    },
                    callNode
                ]
            };
        }

        if (parent[TYPE] === Syntax.ExpressionStatement) {
            return callNode;
        }

        tempNameForAssignment = functionContext.getTempName();
        blockContext.addAssignment(tempNameForAssignment).assign(callNode);

        return {
            'type': Syntax.Identifier,
            'name': tempNameForAssignment
        };
    }
});

module.exports = CallExpressionTranspiler;
