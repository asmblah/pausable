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
    BlockContext = require('../BlockContext'),
    FunctionContext = require('../FunctionContext'),
    BODY = 'body',
    Syntax = estraverse.Syntax;

function ProgramTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ProgramTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.Program;
    },

    transpile: function (node) {
        var transpiler = this,
            functionContext = new FunctionContext(),
            blockContext = new BlockContext(functionContext);

        transpiler.statementTranspiler.transpileArray(node[BODY], node, functionContext, blockContext);

        return {
            'type': Syntax.Program,
            'body': [
                {
                    'type': Syntax.ExpressionStatement,
                    'expression': {
                        'type': Syntax.FunctionExpression,
                        'id': null,
                        'params': [],
                        'body': {
                            'type': Syntax.BlockStatement,
                            'body': functionContext.getStatements(blockContext.getSwitchStatement())
                        }
                    }
                }
            ]
        };
    }
});

module.exports = ProgramTranspiler;
