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
    COMPUTED = 'computed',
    OBJECT = 'object',
    PROPERTY = 'property',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function MemberExpressionTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(MemberExpressionTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.MemberExpression;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var memberExpression,
            object = this.expressionTranspiler.transpile(node[OBJECT], node, functionContext, blockContext),
            property = node[COMPUTED] ?
                this.expressionTranspiler.transpile(node[PROPERTY], node, functionContext, blockContext) :
                node[PROPERTY],
            propertyTempName;

        memberExpression = {
            'type': Syntax.MemberExpression,
            'object': object,
            'property': property,
            'computed': node[COMPUTED]
        };

        if (parent[TYPE] === Syntax.AssignmentExpression) {
            return memberExpression;
        }

        propertyTempName = functionContext.getTempName();

        blockContext.addAssignment(propertyTempName).assign(memberExpression);

        return {
            'type': Syntax.Identifier,
            'name': propertyTempName
        };
    }
});

module.exports = MemberExpressionTranspiler;
