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
    BlockContext = require('../BlockContext'),
    BODY = 'body',
    Syntax = estraverse.Syntax;

function BlockStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(BlockStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.BlockStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this,
            ownBlockContext = new BlockContext(functionContext),
            statement = blockContext.prepareStatement();

        transpiler.statementTranspiler.transpileArray(node[BODY], node, functionContext, ownBlockContext);

        statement.assign({
            'type': Syntax.BlockStatement,
            'body': [
                ownBlockContext.getSwitchStatement()
            ]
        });
    }
});

module.exports = BlockStatementTranspiler;
