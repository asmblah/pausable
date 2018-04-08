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
    estraverse = estraverse,
    ArrayExpressionTranspiler = require('./ExpressionTranspiler/ArrayExpressionTranspiler'),
    AssignmentExpressionTranspiler = require('./ExpressionTranspiler/AssignmentExpressionTranspiler'),
    BinaryExpressionTranspiler = require('./ExpressionTranspiler/BinaryExpressionTranspiler'),
    BlockStatementTranspiler = require('./StatementTranspiler/BlockStatementTranspiler'),
    BreakStatementTranspiler = require('./StatementTranspiler/BreakStatementTranspiler'),
    CallExpressionTranspiler = require('./ExpressionTranspiler/CallExpressionTranspiler'),
    ContinueStatementTranspiler = require('./StatementTranspiler/ContinueStatementTranspiler'),
    DebuggerStatementTranspiler = require('./StatementTranspiler/DebuggerStatementTranspiler'),
    DoWhileStatementTranspiler = require('./StatementTranspiler/DoWhileStatementTranspiler'),
    EmptyStatementTranspiler = require('./StatementTranspiler/EmptyStatementTranspiler'),
    ExpressionStatementTranspiler = require('./StatementTranspiler/ExpressionStatementTranspiler'),
    ExpressionTranspiler = require('./ExpressionTranspiler/ExpressionTranspiler'),
    ForStatementTranspiler = require('./StatementTranspiler/ForStatementTranspiler'),
    FunctionDeclarationTranspiler = require('./StatementTranspiler/FunctionDeclarationTranspiler'),
    FunctionExpressionTranspiler = require('./ExpressionTranspiler/FunctionExpressionTranspiler'),
    FunctionTranspiler = require('./FunctionTranspiler'),
    IdentifierTranspiler = require('./ExpressionTranspiler/IdentifierTranspiler'),
    IfStatementTranspiler = require('./StatementTranspiler/IfStatementTranspiler'),
    LabeledStatementTranspiler = require('./StatementTranspiler/LabeledStatementTranspiler'),
    LogicalExpressionTranspiler = require('./ExpressionTranspiler/LogicalExpressionTranspiler'),
    MemberExpressionTranspiler = require('./ExpressionTranspiler/MemberExpressionTranspiler'),
    ObjectExpressionTranspiler = require('./ExpressionTranspiler/ObjectExpressionTranspiler'),
    ProgramTranspiler = require('./StatementTranspiler/ProgramTranspiler'),
    ReferenceStringifier = require('./ReferenceStringifier'),
    PropertyTranspiler = require('./ExpressionTranspiler/PropertyTranspiler'),
    ReturnStatementTranspiler = require('./StatementTranspiler/ReturnStatementTranspiler'),
    SequenceExpressionTranspiler = require('./ExpressionTranspiler/SequenceExpressionTranspiler'),
    StatementTranspiler = require('./StatementTranspiler/StatementTranspiler'),
    ThrowStatementTranspiler = require('./StatementTranspiler/ThrowStatementTranspiler'),
    TryStatementTranspiler = require('./StatementTranspiler/TryStatementTranspiler'),
    UpdateExpressionTranspiler = require('./ExpressionTranspiler/UpdateExpressionTranspiler'),
    VariableDeclarationTranspiler = require('./StatementTranspiler/VariableDeclarationTranspiler'),
    WhileStatementTranspiler = require('./StatementTranspiler/WhileStatementTranspiler'),
    WithStatementTranspiler = require('./StatementTranspiler/WithStatementTranspiler');

function Transpiler() {
    var expressionTranspiler = new ExpressionTranspiler(),
        statementTranspiler = new StatementTranspiler(),
        functionTranspiler = new FunctionTranspiler(statementTranspiler),
        referenceStringifier = new ReferenceStringifier();

    _.each([
        BlockStatementTranspiler,
        BreakStatementTranspiler,
        ContinueStatementTranspiler,
        DebuggerStatementTranspiler,
        DoWhileStatementTranspiler,
        EmptyStatementTranspiler,
        ExpressionStatementTranspiler,
        ForStatementTranspiler,
        IfStatementTranspiler,
        LabeledStatementTranspiler,
        ProgramTranspiler,
        ReturnStatementTranspiler,
        ThrowStatementTranspiler,
        TryStatementTranspiler,
        VariableDeclarationTranspiler,
        WhileStatementTranspiler,
        WithStatementTranspiler
    ], function (Class) {
        statementTranspiler.addTranspiler(new Class(statementTranspiler, expressionTranspiler));
    });

    statementTranspiler.addTranspiler(
        new FunctionDeclarationTranspiler(
            statementTranspiler,
            expressionTranspiler,
            functionTranspiler
        )
    );

    _.each([
        ArrayExpressionTranspiler,
        AssignmentExpressionTranspiler,
        BinaryExpressionTranspiler,
        CallExpressionTranspiler,
        IdentifierTranspiler,
        LogicalExpressionTranspiler,
        MemberExpressionTranspiler,
        ObjectExpressionTranspiler,
        PropertyTranspiler,
        SequenceExpressionTranspiler,
        UpdateExpressionTranspiler
    ], function (Class) {
        expressionTranspiler.addTranspiler(new Class(
            statementTranspiler,
            expressionTranspiler,
            referenceStringifier
        ));
    });

    expressionTranspiler.addTranspiler(
        new FunctionExpressionTranspiler(
            statementTranspiler,
            expressionTranspiler,
            functionTranspiler
        )
    );

    this.expressionTranspiler = expressionTranspiler;
    this.statementTranspiler = statementTranspiler;
}

_.extend(Transpiler.prototype, {
    transpile: function (ast) {
        return this.statementTranspiler.transpile(ast, null);
    }
});

module.exports = Transpiler;
