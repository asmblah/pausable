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
    acorn = require('acorn'),
    estraverse = require('estraverse'),
    BlockContext = require('../BlockContext'),
    BODY = 'body',
    TEST = 'test',
    Syntax = estraverse.Syntax;

function WhileStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(WhileStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.WhileStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var forNode,
            ownBlockContext = new BlockContext(functionContext),
            transpiler = this,
            expression,
            statement;

        functionContext.pushLabelableContext();

        statement = blockContext.prepareStatement();

        expression = transpiler.expressionTranspiler.transpile(node[TEST], node, functionContext, ownBlockContext);

        ownBlockContext.prepareStatement().assign({
            'type': Syntax.IfStatement,
            'test': {
                'type': Syntax.UnaryExpression,
                'operator': '!',
                'prefix': true,
                'argument': expression
            },
            'consequent': {
                'type': Syntax.BlockStatement,
                'body': [
                    {
                        'type': Syntax.BreakStatement,
                        'label': {
                            'type': Syntax.Identifier,
                            'name': functionContext.getLabel()
                        }
                    }
                ]
            }
        });

        transpiler.statementTranspiler.transpileArray(node[BODY][BODY], node, functionContext, ownBlockContext);

        forNode = {
            'type': Syntax.ForStatement,
            'init': null,
            'test': null,
            'update': null,
            'body': {
                'type': Syntax.BlockStatement,
                'body': [
                    ownBlockContext.getSwitchStatement(),
                    acorn.parse('statementIndex = ' + (statement.getIndex() + 1) + ';').body[0]
                ]
            }
        };

        statement.assign(functionContext.isLabelUsed() ? {
            'type': Syntax.LabeledStatement,
            'label': {
                'type': Syntax.Identifier,
                'name': functionContext.getLabel()
            },
            'body': forNode
        } : forNode);

        functionContext.popLabelableContext();
    }
});

module.exports = WhileStatementTranspiler;
