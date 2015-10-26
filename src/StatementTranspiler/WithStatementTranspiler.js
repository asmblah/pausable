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
    OBJECT = 'object',
    Syntax = estraverse.Syntax;

function WithStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(WithStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.WithStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this,
            object = this.expressionTranspiler.transpile(node[OBJECT], node, functionContext, blockContext),
            ownBlockContext = new BlockContext(functionContext),
            statement = blockContext.prepareStatement();

        transpiler.statementTranspiler.transpileArray(node[BODY][BODY], node, functionContext, ownBlockContext);

        statement.assign({
            'type': Syntax.WithStatement,
            'object': object,
            'body': {
                'type': Syntax.BlockStatement,
                'body': [
                    ownBlockContext.getSwitchStatement()
                ]
            }
        });
    }
});

module.exports = WithStatementTranspiler;
