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
    DECLARATIONS = 'declarations',
    ID = 'id',
    INIT = 'init',
    NAME = 'name',
    Syntax = estraverse.Syntax;

function VariableDeclarationTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(VariableDeclarationTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.VariableDeclaration;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this;

        _.each(node[DECLARATIONS], function (declaration) {
            var expression;

            functionContext.addVariable(declaration[ID][NAME]);

            if (declaration[INIT] !== null) {
                expression = transpiler.expressionTranspiler.transpile(
                    declaration[INIT],
                    node,
                    functionContext,
                    blockContext
                );

                blockContext.prepareStatement().assign({
                    'type': Syntax.ExpressionStatement,
                    'expression': {
                        'type': Syntax.AssignmentExpression,
                        'operator': '=',
                        'left': declaration[ID],
                        'right': expression
                    }
                });
            }
        });
    }
});

module.exports = VariableDeclarationTranspiler;
