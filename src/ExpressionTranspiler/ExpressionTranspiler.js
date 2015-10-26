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
    TYPE = 'type',
    hasOwn = {}.hasOwnProperty;

function ExpressionTranspiler() {
    this.transpilers = {};
}

_.extend(ExpressionTranspiler.prototype, {
    addTranspiler: function (transpiler) {
        this.transpilers[transpiler.getNodeType()] = transpiler;
    },

    transpile: function (node, parent, functionContext, blockContext) {
        var transpiler = this;

        if (!hasOwn.call(transpiler.transpilers, node[TYPE])) {
            return node;
        }

        return transpiler.transpilers[node[TYPE]].transpile(node, parent, functionContext, blockContext);
    },

    transpileArray: function (array, parent, functionContext, blockContext) {
        var result = [],
            transpiler = this;

        _.each(array, function (expressionNode) {
            result.push(transpiler.transpile(expressionNode, parent, functionContext, blockContext));
        });

        return result;
    }
});

module.exports = ExpressionTranspiler;
