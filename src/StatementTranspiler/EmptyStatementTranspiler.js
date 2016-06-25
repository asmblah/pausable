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
    Syntax = estraverse.Syntax;

function EmptyStatementTranspiler(statementTranspiler, expressionTranspiler) {
    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(EmptyStatementTranspiler.prototype, {
    getNodeType: function () {
        return Syntax.EmptyStatement;
    },

    transpile: function () {
        // Discard empty statements
    }
});

module.exports = EmptyStatementTranspiler;
