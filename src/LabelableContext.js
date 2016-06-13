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

/**
 * @param {string|null} label
 * @param {int} index
 * @constructor
 */
function LabelableContext(label, index) {
    this.continueStatements = [];
    this.index = index;
    this.label = label;
    this.labelAssigned = label || null;
    this.labelUsed = false;
}

_.extend(LabelableContext.prototype, {
    /**
     * Adds a new `continue` statement to the list for this context
     *
     * @param {object} statement
     */
    addContinue: function (statement) {
        this.continueStatements.push(statement);
    },

    /**
     * Returns the original label used for this context, if set
     * (will be null if no label was set)
     *
     * @returns {string|null}
     */
    getLabel: function () {
        return this.label;
    },

    /**
     * Returns the label to use in the generated output code.
     * Will be the assigned label prefixed with `label_*` or a generated name
     * in the form `labelN` if no label was explicitly specified
     *
     * @returns {string}
     */
    getPrefixedLabel: function () {
        var context = this;

        context.labelUsed = true;

        return context.labelAssigned !== null ?
            'label_' + context.labelAssigned :
            'label' + context.index;
    },

    /**
     * Surrounds an AST statement node with a labeled statement for this context, if needed
     *
     * @param {object} statementNode
     * @returns {object}
     */
    getLabeledStatement: function (statementNode) {
        var context = this;

        if (!context.labelUsed || context.labelAssigned !== null) {
            return statementNode;
        }

        return {
            'type': Syntax.LabeledStatement,
            'label': {
                'type': Syntax.Identifier,
                'name': context.getPrefixedLabel()
            },
            'body': statementNode
        };
    },

    /**
     * Prefixes all `continue` statements in the labelable context with a jump to the provided statement
     *
     * @param {int} targetStatementIndex
     */
    prefixContinuesWithJumpTo: function (targetStatementIndex) {
        var context = this;

        _.each(context.continueStatements, function (continueStatement) {
            continueStatement.prepend({
                'type': Syntax.ExpressionStatement,
                'expression': {
                    'type': Syntax.AssignmentExpression,
                    'operator': '=',
                    'left': {
                        'type': Syntax.Identifier,
                        'name': 'statementIndex'
                    },
                    'right': {
                        'type': Syntax.Literal,
                        'value': targetStatementIndex
                    }
                }
            });
        });
    }
});

module.exports = LabelableContext;
