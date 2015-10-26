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
    EXPRESSIONS = 'expressions',
    Syntax = estraverse.Syntax;

function SequenceExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(SequenceExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.SequenceExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var expressions = [],
            transpiler = this;

        _.each(node[EXPRESSIONS], function (expression) {
            expressions.push(
                transpiler.expressionTranspiler.transpile(
                    expression,
                    node,
                    functionContext,
                    blockContext
                )
            );
        });

        return {
            'type': Syntax.SequenceExpression,
            'expressions': expressions
        };
    }
});

module.exports = SequenceExpressionTranspiler;
