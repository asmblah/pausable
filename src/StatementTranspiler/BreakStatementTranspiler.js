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

function BreakStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(BreakStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.BreakStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var label = node[LABEL] ?
            node[LABEL] :
            {
                'type': Syntax.Identifier,
                'name': functionContext.getLabel()
            };

        blockContext.prepareStatement().assign({
            'type': Syntax.BreakStatement,
            'label': label
        });
    }
});

module.exports = BreakStatementTranspiler;
