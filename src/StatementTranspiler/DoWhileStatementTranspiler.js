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
    LABEL = 'label',
    NAME = 'name',
    TEST = 'test',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function DoWhileStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(DoWhileStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.DoWhileStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var forNode,
            ownBlockContext = new BlockContext(functionContext),
            transpiler = this,
            expression,
            statement,
            label = parent[TYPE] === Syntax.LabeledStatement ?
                parent[LABEL][NAME] :
                null;

        functionContext.pushLabelableContext(label);

        statement = blockContext.prepareStatement();

        transpiler.statementTranspiler.transpileArray(node[BODY][BODY], node, functionContext, ownBlockContext);

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

        forNode = {
            'type': Syntax.ForStatement,
            'init': null,
            'test': null,
            'update': null,
            'body': {
                'type': Syntax.BlockStatement,
                'body': [
                    acorn.parse('statementIndex = ' + (statement.getIndex() + 1) + ';').body[0],
                    ownBlockContext.getSwitchStatement()
                ]
            }
        };

        statement.assign(functionContext.getLabeledStatement(forNode));

        functionContext.popLabelableContext();
    }
});

module.exports = DoWhileStatementTranspiler;
