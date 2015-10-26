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
    LABEL = 'label',
    Syntax = estraverse.Syntax;

function ContinueStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ContinueStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ContinueStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var label = node[LABEL] ?
            node[LABEL] :
            {
                'type': Syntax.Identifier,
                'name': functionContext.getLabel()
            };

        blockContext.prepareStatement().assign({
            'type': Syntax.ContinueStatement,
            'label': label
        });
    }
});

module.exports = ContinueStatementTranspiler;
