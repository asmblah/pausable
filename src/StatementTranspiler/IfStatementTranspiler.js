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
    ALTERNATE = 'alternate',
    CONSEQUENT = 'consequent',
    TEST = 'test',
    Syntax = estraverse.Syntax;

function IfStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(IfStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.IfStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var alternateStatement,
            consequentStatement,
            transpiler = this,
            expression = transpiler.expressionTranspiler.transpile(node[TEST], node, functionContext, blockContext);

        consequentStatement = blockContext.prepareStatement();

        consequentStatement.assign({
            'type': Syntax.IfStatement,
            'test': {
                'type': Syntax.LogicalExpression,
                'operator': '||',
                'left': {
                    'type': Syntax.BinaryExpression,
                    'operator': '>',
                    'left': {
                        'type': Syntax.Identifier,
                        'name': 'statementIndex'
                    },
                    'right': {
                        'type': Syntax.Literal,
                        'value': consequentStatement.getIndex() + 1
                    }
                },
                'right': expression
            },
            'consequent': transpiler.statementTranspiler.transpileBlock(node[CONSEQUENT], node, functionContext)
        });

        if (node[ALTERNATE]) {
            alternateStatement = blockContext.prepareStatement();

            alternateStatement.assign({
                'type': Syntax.IfStatement,
                'test': {
                    'type': Syntax.LogicalExpression,
                    'operator': '||',
                    'left': {
                        'type': Syntax.BinaryExpression,
                        'operator': '>',
                        'left': {
                            'type': Syntax.Identifier,
                            'name': 'statementIndex'
                        },
                        'right': {
                            'type': Syntax.Literal,
                            'value': alternateStatement.getIndex() + 1
                        }
                    },
                    'right': {
                        'type': Syntax.UnaryExpression,
                        'operator': '!',
                        'prefix': true,
                        'argument': expression
                    }
                },
                'consequent': transpiler.statementTranspiler.transpileBlock(node[ALTERNATE], node, functionContext)
            });
        }
    }
});

module.exports = IfStatementTranspiler;
