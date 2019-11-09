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
    CALLEE = 'callee',
    COMPUTED = 'computed',
    OBJECT = 'object',
    OPERATOR = 'operator',
    PROPERTY  = 'property',
    TYPE = 'type',
    Syntax = estraverse.Syntax;

function ReferenceStringifier() {
}

_.extend(ReferenceStringifier.prototype, {
    /**
     * Takes any reference expression and "stringifies" it
     * to make it human-readable.
     *
     * Examples:
     *  - `myVar` (AST) -> `myVar` (string)
     *  - `myFunc(arg1, arg2)` (AST) -> `myFunc(...)` (string)
     *  - `myObj.myProp` (AST) -> `myObj.myProp` (string)
     *  - `myFunc(arg1, arg2).myMethod(arg3)` (AST) -> `myFunc(...).myMethod(...)` (string)
     *
     * @param {object} referenceNode A Parser API JS expression AST node
     * @return {*}
     */
    stringify: function (referenceNode) {
        var stringifier = this;

        if (referenceNode[TYPE] === Syntax.ArrayExpression) {
            return '[...]';
        }

        if (referenceNode[TYPE] === Syntax.CallExpression) {
            return stringifier.stringify(referenceNode[CALLEE]) + '(...)';
        }

        if (referenceNode[TYPE] === Syntax.FunctionExpression) {
            return '(intermediate value)';
        }

        if (referenceNode[TYPE] === Syntax.Identifier) {
            return referenceNode.name;
        }

        if (referenceNode[TYPE] === Syntax.Literal) {
            return referenceNode.value instanceof RegExp ?
                referenceNode.value.toString() :
                JSON.stringify(referenceNode.value);
        }

        if (referenceNode[TYPE] === Syntax.LogicalExpression) {
            // TODO: Summarise the computed property expression, Chrome-style.
            //       Example: `(1234 || 345 || tools[1]).getOne()`
            //             -> `TypeError: (1234 || 345 || tools[1]).getOne is not a function`
            return '(... ' + referenceNode[OPERATOR] + ' ...)';
        }

        if (referenceNode[TYPE] === Syntax.MemberExpression) {
            return stringifier.stringify(referenceNode[OBJECT]) + (
                referenceNode[COMPUTED] ?
                    // TODO: Summarise the computed property expression, Chrome-style.
                    //       Example: `tools[a.b * 1 - 0].getOne()`
                    //             -> `TypeError: tools[((a.b * 1) - 0)].getOne is not a function`
                    '[...]' :
                    '.' + referenceNode[PROPERTY].name
            );
        }

        if (referenceNode[TYPE] === Syntax.ObjectExpression) {
            return '{...}';
        }

        if (referenceNode[TYPE] === Syntax.SequenceExpression) {
            return '(..,..)';
        }

        if (referenceNode[TYPE] === Syntax.ThisExpression) {
            return 'this';
        }

        throw new Error(
            'ReferenceStringifier :: Unsupported reference node expression type "' + referenceNode[TYPE] + '"'
        );
    }
});

module.exports = ReferenceStringifier;
