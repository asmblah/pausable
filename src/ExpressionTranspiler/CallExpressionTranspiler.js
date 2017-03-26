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
    PROPERTY = 'property',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function CallExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(CallExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.CallExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var args = node[ARGUMENTS],
            assignments,
            callee,
            callNode,
            transpiler = this,
            tempNameForAssignment;

        functionContext.clearLastAssignments();

        callee = transpiler.expressionTranspiler.transpile(node[CALLEE], node, functionContext, blockContext);

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

            callee = functionContext.createASTNode(node[CALLEE], {
                'type': Syntax.MemberExpression,
                'object': callee,
                'property': functionContext.createASTNode(node[CALLEE][PROPERTY], {
                    'type': Syntax.Identifier,
                    'name': 'call'
                }),
                'computed': false
            });
        }

        callNode = functionContext.createASTNode(node, {
            'type': Syntax.CallExpression,
            'callee': callee,
            'arguments': args
        });

        if (parent[TYPE] === Syntax.ExpressionStatement) {
            return callNode;
        }

        tempNameForAssignment = functionContext.getTempName();
        blockContext.addAssignment(tempNameForAssignment).assign(callNode);

        // Result of function call will be fetchable via this temporary variable
        return functionContext.createASTNode(node, {
            'type': Syntax.Identifier,
            'name': tempNameForAssignment
        });
    }
});

module.exports = CallExpressionTranspiler;
