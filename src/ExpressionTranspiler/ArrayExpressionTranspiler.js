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
    ELEMENTS = 'elements',
    Syntax = estraverse.Syntax;

function ArrayExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ArrayExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ArrayExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this;

        return {
            'type': Syntax.ArrayExpression,
            'elements': transpiler.expressionTranspiler.transpileArray(
                node[ELEMENTS],
                node,
                functionContext,
                blockContext
            )
        };
    }
});

module.exports = ArrayExpressionTranspiler;
