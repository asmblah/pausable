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

function ContinueStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ContinueStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ContinueStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var continueStatement,
            labelNode = {
                'type': Syntax.Identifier,
                'name': node[LABEL] ?
                    'label_' + node[LABEL][NAME] :
                    functionContext.getLabel()
            },
            label = node[LABEL] !== null ? node[LABEL][NAME] : null,
            labelableContext = functionContext.getLabelableContext(label);

        continueStatement = blockContext.prepareStatement();
        labelableContext.addContinue(continueStatement);

        continueStatement.assign({
            'type': Syntax.ContinueStatement,
            'label': labelNode
        }, null);
    }
});

module.exports = ContinueStatementTranspiler;
