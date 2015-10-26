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

function BinaryExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(BinaryExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.BinaryExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var left,
            right,
            transpiler = this;

        left = transpiler.expressionTranspiler.transpile(node[LEFT], node, functionContext, blockContext);
        right = transpiler.expressionTranspiler.transpile(node[RIGHT], node, functionContext, blockContext);

        return {
            'type': Syntax.BinaryExpression,
            'operator': node[OPERATOR],
            'left': left,
            'right': right
        };
    }
});

module.exports = BinaryExpressionTranspiler;
