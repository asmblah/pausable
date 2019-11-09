/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var estraverse = require('estraverse'),
    expect = require('chai').expect,
    ReferenceStringifier = require('../../src/ReferenceStringifier'),
    Syntax = estraverse.Syntax;

describe('ReferenceStringifier', function () {
    beforeEach(function () {
        this.stringifier = new ReferenceStringifier();
    });

    describe('stringify()', function () {
        it('should return a square-bracketed ellipsis for an array literal', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.ArrayExpression,
                'elements': [
                    {
                        'type': Syntax.Literal,
                        'value': 'firstElement'
                    },
                    {
                        'type': Syntax.Literal,
                        'value': 'secondElement'
                    }
                ]
            }))
                .to.equal('[...]');
        });

        it('should replace any args with an ellipsis for a function/method call AST node', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.CallExpression,
                'callee': {
                    'type': Syntax.Identifier,
                    'name': 'myFunc'
                },
                'arguments': [
                    {
                        'type': Syntax.Literal,
                        'value': 'first arg'
                    },
                    {
                        'type': Syntax.Literal,
                        'value': 'second arg'
                    }
                ]
            }))
                .to.equal('myFunc(...)');
        });

        it('should use `(intermediate value)` for an IIFE AST node', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.CallExpression,
                'callee': {
                    'type': Syntax.FunctionExpression,
                    'id': {
                        'type': Syntax.Identifier,
                        'name': 'myFunc'
                    },
                    'params': [],
                    'defaults': [],
                    'body': {
                        'type': Syntax.ReturnStatement,
                        'argument': {
                            'type': Syntax.Literal,
                            'value': 'my result'
                        }
                    }
                },
                'arguments': [
                    {
                        'type': Syntax.Literal,
                        'value': 'first arg'
                    },
                    {
                        'type': Syntax.Literal,
                        'value': 'second arg'
                    }
                ]
            }))
                .to.equal('(intermediate value)(...)');
        });

        it('should just extract the name from an Identifier AST node', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.Identifier,
                'name': 'myVar'
            }))
                .to.equal('myVar');
        });

        it('should format a literal string as expected', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.Literal,
                'value': 'my " string'
            }))
                .to.equal('"my \\" string"');
        });

        it('should format a literal boolean as expected', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.Literal,
                'value': false
            }))
                .to.equal('false');
        });

        it('should format a literal null as expected', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.Literal,
                'value': null
            }))
                .to.equal('null');
        });

        it('should format a literal number as expected', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.Literal,
                'value': 4321.2
            }))
                .to.equal('4321.2');
        });

        it('should format a literal regex as expected', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.Literal,
                'value': /my\sregexp?/gi
            }))
                .to.equal('/my\\sregexp?/gi');
        });

        it('should build a parenthesized property path for a logical expression', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.LogicalExpression,
                'left': {
                    'type': Syntax.Identifier,
                    'name': 'leftOperand'
                },
                'operator': '||',
                'right': {
                    'type': Syntax.Identifier,
                    'name': 'rightOperand'
                }
            }))
                .to.equal('(... || ...)');
        });

        it('should build a dotted property path for an uncomputed member expression', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.MemberExpression,
                'object': {
                    'type': Syntax.Identifier,
                    'name': 'myObject'
                },
                'computed': false,
                'property': {
                    'type': Syntax.Identifier,
                    'name': 'myProp'
                }
            }))
                .to.equal('myObject.myProp');
        });

        it('should build a square-bracketed property path for a computed member expression', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.MemberExpression,
                'object': {
                    'type': Syntax.Identifier,
                    'name': 'myObject'
                },
                'computed': true,
                'property': {
                    'type': Syntax.Identifier,
                    'name': 'myVarContainingAPropName'
                }
            }))
                .to.equal('myObject[...]');
        });

        it('should return a braced ellipsis for an object literal', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.ObjectExpression,
                'properties': [
                    {
                        'type': Syntax.Property,
                        'key': {
                            'type': Syntax.Identifier,
                            'name': 'firstKey'
                        },
                        'value': {
                            'type': Syntax.Literal,
                            'value': 'firstValue'
                        }
                    },
                    {
                        'type': Syntax.Property,
                        'key': {
                            'type': Syntax.Identifier,
                            'name': 'secondKey'
                        },
                        'value': {
                            'type': Syntax.Literal,
                            'value': 'secondValue'
                        }
                    }
                ]
            }))
                .to.equal('{...}');
        });

        it('should return a comma-separated set of ellipses for a sequence expression', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.SequenceExpression,
                'expressions': [
                    {
                        'type': Syntax.Identifier,
                        'name': 'firstExpr'
                    },
                    {
                        'type': Syntax.Identifier,
                        'name': 'secondExpr'
                    }
                ]
            }))
                .to.equal('(..,..)');
        });

        it('should use `this` for this', function () {
            expect(this.stringifier.stringify({
                'type': Syntax.ThisExpression
            }))
                .to.equal('this');
        });

        it('should throw when given an unsupported AST node type', function () {
            expect(function () {
                this.stringifier.stringify({
                    'type': 'not-valid'
                });
            }.bind(this))
                .to.throw('ReferenceStringifier :: Unsupported reference node expression type "not-valid"');
        });
    });
});
