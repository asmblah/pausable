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

function ReturnStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ReturnStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ReturnStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var expression = node[ARGUMENT] ?
            this.expressionTranspiler.transpile(node[ARGUMENT], node, functionContext, blockContext) :
            null;

        if (functionContext.isInsideTryWithFinallyClause() && !functionContext.isInsideTryFinallyClause()) {
            functionContext.addReturnInTryOutsideFinally();

            // The surrounding function has a try with a finally clause, so make sure
            // we store the return value in the special `resumableReturnValue` variable
            // so that it may be re-returned if a pause is made inside the finally clause
            expression = {
                'type': Syntax.AssignmentExpression,
                'left': {
                    'type': Syntax.Identifier,
                    'name': 'resumableReturnValue'
                },
                'operator': '=',
                'right': expression
            };
        }

        blockContext.prepareStatement().assign({
            'type': Syntax.ReturnStatement,
            'argument': expression
        });
    }
});

module.exports = ReturnStatementTranspiler;
