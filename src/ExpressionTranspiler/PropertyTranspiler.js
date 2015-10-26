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
    KEY = 'key',
    KIND = 'kind',
    VALUE = 'value',
    Syntax = estraverse.Syntax;

function PropertyTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(PropertyTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.Property;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this;

        return {
            'type': Syntax.Property,
            'key': node[KEY],
            'value': transpiler.expressionTranspiler.transpile(
                node[VALUE],
                node,
                functionContext,
                blockContext
            ),
            'kind': node[KIND]
        };
    }
});

module.exports = PropertyTranspiler;
