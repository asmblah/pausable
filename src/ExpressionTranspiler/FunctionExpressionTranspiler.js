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
    Syntax = estraverse.Syntax;

function FunctionExpressionTranspiler(statementTranspiler, expressionTranspiler, functionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.functionTranspiler = functionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(FunctionExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.FunctionExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        return this.functionTranspiler.transpile(node, parent, functionContext, blockContext);
    }
});

module.exports = FunctionExpressionTranspiler;
