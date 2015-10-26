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

function DebuggerStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(DebuggerStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.DebuggerStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        blockContext.prepareStatement().assign({
            'type': Syntax.DebuggerStatement
        });
    }
});

module.exports = DebuggerStatementTranspiler;
