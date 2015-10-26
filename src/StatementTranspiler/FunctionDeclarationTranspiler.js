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

function FunctionDeclarationTranspiler(statementTranspiler, expressionTranspiler, functionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.functionTranspiler = functionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(FunctionDeclarationTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.FunctionDeclaration;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var newNode = this.functionTranspiler.transpile(node, parent, functionContext, blockContext);

        functionContext.addFunctionDeclaration(newNode);
    }
});

module.exports = FunctionDeclarationTranspiler;
