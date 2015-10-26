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
    hasOwn = {}.hasOwnProperty,
    BlockContext = require('../BlockContext'),
    BODY = 'body',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function StatementTranspiler(expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.transpilers = {};
}

_.extend(StatementTranspiler.prototype, {
    addTranspiler: function (transpiler) {
        this.transpilers[transpiler.getNodeType()] = transpiler;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this;

        if (!hasOwn.call(transpiler.transpilers, node[TYPE])) {
            throw new Error('Unsupported type "' + node[TYPE] + '"');
        }

        return transpiler.transpilers[node[TYPE]].transpile(node, parent, functionContext, blockContext);
    },

    transpileBlock: function (node, parent, functionContext) {
        var transpiler = this,
            ownBlockContext = new BlockContext(functionContext);

        if (node[TYPE] === Syntax.BlockStatement) {
            transpiler.transpileArray(node[BODY], parent, functionContext, ownBlockContext);
        } else {
            transpiler.transpile(node, parent, functionContext, ownBlockContext);
        }

        return {
            'type': Syntax.BlockStatement,
            'body': [
                ownBlockContext.getSwitchStatement()
            ]
        };
    },

    transpileArray: function (array, parent, functionContext, blockContext) {
        var transpiler = this;

        _.each(array, function (statementNode) {
            transpiler.transpile(statementNode, parent, functionContext, blockContext);
        });
    }
});

module.exports = StatementTranspiler;
