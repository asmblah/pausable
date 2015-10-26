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
    BlockContext = require('./BlockContext'),
    FunctionContext = require('./FunctionContext'),
    BODY = 'body',
    ID = 'id',
    NAME = 'name',
    PARAMS = 'params',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function FunctionTranspiler(statementTranspiler) {
    this.statementTranspiler = statementTranspiler;
}

_.extend(FunctionTranspiler.prototype, {
    transpile: function (node) {
        var newNode,
            transpiler = this,
            ownFunctionContext = new FunctionContext(),
            ownBlockContext = new BlockContext(ownFunctionContext),
            statements = [];

        _.each(node[PARAMS], function (param) {
            ownFunctionContext.addParameter(param[NAME]);
        });

        if (node[BODY][BODY].length > 0) {
            transpiler.statementTranspiler.transpileArray(node[BODY][BODY], node, ownFunctionContext, ownBlockContext);
            statements = ownFunctionContext.getStatements(ownBlockContext.getSwitchStatement());
        }

        newNode = {
            'type': node[TYPE],
            'id': node[ID],
            'params': node[PARAMS],
            'body': {
                'type': Syntax.BlockStatement,
                'body': statements
            }
        };

        return newNode;
    }
});

module.exports = FunctionTranspiler;
