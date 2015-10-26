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
    LEFT = 'left',
    NAME = 'name',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function IdentifierTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(IdentifierTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.Identifier;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var isDefined = functionContext.hasVariableDefined(node[NAME]) ||
            (
                parent[TYPE] === Syntax.AssignmentExpression &&
                node === parent[LEFT]
            );

        return {
            'type': Syntax.Identifier,
            'name': isDefined ?
                node[NAME] :
                functionContext.getTempNameForVariable(node[NAME], blockContext)
        };
    }
});

module.exports = IdentifierTranspiler;
