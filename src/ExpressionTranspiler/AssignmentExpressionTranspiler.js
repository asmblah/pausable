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
    LEFT = 'left',
    OPERATOR = 'operator',
    RIGHT = 'right',
    Syntax = estraverse.Syntax;

function AssignmentExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(AssignmentExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.AssignmentExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var left,
            right,
            transpiler = this;

        left = transpiler.expressionTranspiler.transpile(node[LEFT], node, functionContext, blockContext, {
            assignment: true
        });

        // Expand `A *= B` to `A = A * B`
        if (node[OPERATOR] === '=') {
            right = node[RIGHT];
        } else {
            right = functionContext.createASTNode(node, {
                'type': Syntax.BinaryExpression,
                'operator': node[OPERATOR].charAt(0),
                'left': node[LEFT],
                'right': node[RIGHT]
            });
        }

        right = transpiler.expressionTranspiler.transpile(right, node, functionContext, blockContext);

        return functionContext.createASTNode(node, {
            'type': Syntax.AssignmentExpression,
            'operator': '=',
            'left': left,
            'right': right
        });
    }
});

module.exports = AssignmentExpressionTranspiler;
