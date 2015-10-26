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
    PROPERTIES = 'properties',
    Syntax = estraverse.Syntax;

function ObjectExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ObjectExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ObjectExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this;

        return {
            'type': Syntax.ObjectExpression,
            'properties': transpiler.expressionTranspiler.transpileArray(
                node[PROPERTIES],
                node,
                functionContext,
                blockContext
            )
        };
    }
});

module.exports = ObjectExpressionTranspiler;
