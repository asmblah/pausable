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
    EXPRESSION = 'expression',
    Syntax = estraverse.Syntax;

function ExpressionStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ExpressionStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ExpressionStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var expression = this.expressionTranspiler.transpile(node[EXPRESSION], node, functionContext, blockContext);

        blockContext.prepareStatement().assign({
            'type': Syntax.ExpressionStatement,
            'expression': expression
        });
    }
});

module.exports = ExpressionStatementTranspiler;
