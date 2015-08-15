/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    acorn = require('acorn'),
    estraverse = require('estraverse'),
    BlockContext = require('../BlockContext'),
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
        var expression = this.expressionTranspiler.transpile(node[ARGUMENT], node, functionContext, blockContext);

        blockContext.prepareStatement().assign({
            'type': Syntax.ReturnStatement,
            'argument': expression
        });
    }
});

module.exports = ReturnStatementTranspiler;
