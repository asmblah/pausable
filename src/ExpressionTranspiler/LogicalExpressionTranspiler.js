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
    LEFT = 'left',
    OPERATOR = 'operator',
    RIGHT = 'right',
    Syntax = estraverse.Syntax;

function LogicalExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(LogicalExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.LogicalExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var condition,
            left,
            right,
            rightSideBlockContext,
            statement,
            tempName,
            transpiler = this;

        left = transpiler.expressionTranspiler.transpile(node[LEFT], node, functionContext, blockContext);

        statement = blockContext.prepareStatement();

        rightSideBlockContext = new BlockContext(functionContext);

        right = transpiler.expressionTranspiler.transpile(node[RIGHT], node, functionContext, rightSideBlockContext);

        /**
         * Support short-circuit evaluation of the operands -
         * when '&&' and left operand is truthy, evaluate right,
         * when '||' and left operand is truthy, do not,
         * and vice versa.
         */
        condition = node[OPERATOR] === '||' ?
            {
                'type': Syntax.UnaryExpression,
                'operator': '!',
                'prefix': true,
                'argument': left
            } :
            left;

        statement.assign({
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
                        'value': statement.getIndex() + 1
                    }
                },
                'right': condition
            },
            'consequent': {
                'type': Syntax.BlockStatement,
                'body': [
                    rightSideBlockContext.getSwitchStatement()
                ]
            }
        });

        tempName = functionContext.getTempName();

        blockContext.addAssignment(tempName).assign({
            'type': Syntax.LogicalExpression,
            'operator': node[OPERATOR],
            'left': left,
            'right': right
        });

        return {
            'type': Syntax.Identifier,
            'name': tempName
        };
    }
});

module.exports = LogicalExpressionTranspiler;
