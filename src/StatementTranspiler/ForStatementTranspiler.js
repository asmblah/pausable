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
    INIT = 'init',
    LABEL = 'label',
    NAME = 'name',
    TEST = 'test',
    TYPE = 'type',
    UPDATE = 'update',
    Syntax = estraverse.Syntax;

function ForStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(ForStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.ForStatement;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var forNode,
            ownBlockContext = new BlockContext(functionContext),
            transpiler = this,
            expression,
            statement,
            label = parent[TYPE] === Syntax.LabeledStatement ?
                parent[LABEL][NAME] :
                null,
            labelableContext,
            updateIndex;

        labelableContext = functionContext.pushLabelableContext(label);

        // 'Init' expression
        if (node[INIT]) {
            blockContext.pushTransforms();

            // Init can be a variable declaration, eg. `for (var i = 0; ...)`
            if (node[INIT][TYPE] === Syntax.VariableDeclaration) {
                transpiler.statementTranspiler.transpile(
                    node[INIT],
                    node,
                    functionContext,
                    blockContext
                );
            } else {
                expression = transpiler.expressionTranspiler.transpile(
                    node[INIT],
                    node,
                    functionContext,
                    blockContext
                );
                blockContext.prepareStatement().assign({
                    'type': Syntax.ExpressionStatement,
                    'expression': expression
                });
            }
            blockContext.popTransforms();
        }

        statement = blockContext.prepareStatement();

        // 'Test' expression
        if (node[TEST]) {
            expression = transpiler.expressionTranspiler.transpile(
                node[TEST],
                node,
                functionContext,
                ownBlockContext
            );
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
        }

        transpiler.statementTranspiler.transpileArray(
            node[BODY][BODY],
            node,
            functionContext,
            ownBlockContext
        );

        // 'Update' expression
        if (node[UPDATE]) {
            updateIndex = functionContext.getCurrentStatementIndex();
            expression = transpiler.expressionTranspiler.transpile(
                node[UPDATE],
                node,
                functionContext,
                ownBlockContext
            );
            ownBlockContext.prepareStatement().assign({
                'type': Syntax.ExpressionStatement,
                'expression': expression
            });

            labelableContext.prefixContinuesWithJumpTo(updateIndex);
        }

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

        statement.assign(functionContext.getLabeledStatement(forNode));

        functionContext.popLabelableContext();
    }
});

module.exports = ForStatementTranspiler;
