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
    BODY = 'body',
    LABEL = 'label',
    NAME = 'name',
    Syntax = estraverse.Syntax;

function LabeledStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(LabeledStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.LabeledStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var label = node[LABEL],
            transpiler = this;

        blockContext.transformNextStatement(function (node) {
            return {
                'type': Syntax.LabeledStatement,
                'label': {
                    'type': Syntax.Identifier,
                    'name': 'label_' + label[NAME]
                },
                'body': node
            };
        });

        transpiler.statementTranspiler.transpile(node[BODY], node, functionContext, blockContext);
    }
});

module.exports = LabeledStatementTranspiler;
