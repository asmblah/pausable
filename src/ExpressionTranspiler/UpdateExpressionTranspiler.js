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
    COMPUTED = 'computed',
    NAME = 'name',
    OBJECT = 'object',
    OPERATOR = 'operator',
    PREFIX = 'prefix',
    PROPERTY = 'property',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function UpdateExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(UpdateExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.UpdateExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var expression,
            object = null,
            objectTempName = null,
            resultTempName;

        if (node[ARGUMENT][TYPE] === Syntax.MemberExpression) {
            object = this.expressionTranspiler.transpile(
                node[ARGUMENT][OBJECT],
                node,
                functionContext,
                blockContext
            );
            object = {
                'type': Syntax.MemberExpression,
                'object': object,
                'property': node[ARGUMENT][COMPUTED] ?
                    this.expressionTranspiler.transpile(
                        node[ARGUMENT][PROPERTY],
                        node[ARGUMENT],
                        functionContext,
                        blockContext
                    ) :
                    node[ARGUMENT][PROPERTY],
                'computed': node[ARGUMENT][COMPUTED]
            };
            objectTempName = functionContext.getTempName();
            blockContext.addAssignment(objectTempName).assign(object);
            expression = {
                'type': Syntax.Identifier,
                'name': objectTempName
            };
        } else {
            expression = this.expressionTranspiler.transpile(
                node[ARGUMENT],
                node,
                functionContext,
                blockContext
            );
        }

        // Addition/subtraction of 1
        resultTempName = functionContext.getTempName();
        blockContext.addAssignment(resultTempName).assign({
            'type': Syntax.BinaryExpression,
            'left': expression,
            'operator': node[OPERATOR].charAt(0),
            'right': {
                'type': Syntax.Literal,
                'value': 1
            }
        });

        // Assignment back to variable/property
        blockContext.prepareStatement().assign({
            'type': Syntax.ExpressionStatement,
            'expression': {
                'type': Syntax.AssignmentExpression,
                'left': object ? object : node[ARGUMENT],
                'operator': '=',
                'right': {
                    'type': Syntax.Identifier,
                    'name': resultTempName
                }
            }
        });

        return {
            'type': Syntax.Identifier,
            'name': node[PREFIX] ?
                resultTempName :
                functionContext.getLastTempNameForVariable(node[ARGUMENT][NAME])
        };
    }
});

module.exports = UpdateExpressionTranspiler;
