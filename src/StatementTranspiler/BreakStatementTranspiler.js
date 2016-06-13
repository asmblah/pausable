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
    NAME = 'name',
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
        var label = {
                'type': Syntax.Identifier,
                'name': node[LABEL] ?
                    'label_' + node[LABEL][NAME] :
                    functionContext.getLabel()
            };

        blockContext.prepareStatement().assign({
            'type': Syntax.BreakStatement,
            'label': label
        }, null);
    }
});

module.exports = BreakStatementTranspiler;
