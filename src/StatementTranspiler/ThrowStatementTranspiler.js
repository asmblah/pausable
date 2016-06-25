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
    ARGUMENT = 'argument',
    Syntax = estraverse.Syntax;

function ThrowStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ThrowStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ThrowStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var expression = this.expressionTranspiler.transpile(node[ARGUMENT], node, functionContext, blockContext);

        blockContext.prepareStatement().assign({
            'type': Syntax.ThrowStatement,
            'argument': expression
        }, null);
    }
});

module.exports = ThrowStatementTranspiler;
