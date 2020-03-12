/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    FunctionContext = require('../../src/FunctionContext');

describe('FunctionContext', function () {
    beforeEach(function () {
        this.functionContext = new FunctionContext();
    });

    describe('addReturnInTryOutsideFinally()', function () {
        it('should add a `resumableReturnValue` variable to the context when the try has a finally clause', function () {
            this.functionContext.enterTryWithFinallyClause();

            this.functionContext.addReturnInTryOutsideFinally();

            expect(this.functionContext.hasVariableDefined('resumableReturnValue')).to.be.true;
            expect(this.functionContext.getVariableValueAST('resumableReturnValue')).to.deep.equal({
                'type': 'MemberExpression',
                'object': {
                    'type': 'Identifier',
                    'name': 'Resumable'
                },
                'property': {
                    'type': 'Identifier',
                    'name': 'UNSET'
                },
                'computed': false
            });
        });

        it('should not add a `resumableReturnValue` variable to the context when the try does not have a finally clause', function () {
            this.functionContext.addReturnInTryOutsideFinally();

            expect(this.functionContext.hasVariableDefined('resumableReturnValue')).to.be.false;
        });
    });

    describe('addVariable()', function () {
        it('should define the variable with a null value AST if not specified', function () {
            this.functionContext.addVariable('myVar');

            expect(this.functionContext.hasVariableDefined('myVar')).to.be.true;
            expect(this.functionContext.getVariableValueAST('myVar')).to.be.null;
        });

        it('should define the variable with the given value AST when specified', function () {
            this.functionContext.addVariable('myVar', {
                'type': 'MyNodeType'
            });

            expect(this.functionContext.hasVariableDefined('myVar')).to.be.true;
            expect(this.functionContext.getVariableValueAST('myVar')).to.deep.equal({
                'type': 'MyNodeType'
            });
        });
    });

    describe('enterTryFinallyClause()', function () {
        beforeEach(function () {
            this.functionContext.enterTryWithFinallyClause();
        });

        it('should mark the context as having entered the finally clause', function () {
            this.functionContext.enterTryFinallyClause();

            expect(this.functionContext.isInsideTryWithFinallyClause()).to.be.true;
            expect(this.functionContext.isInsideTryFinallyClause()).to.be.true;
        });

        it('should be able to enter a nested finally clause', function () {
            this.functionContext.enterTryFinallyClause();
            this.functionContext.enterTryWithFinallyClause(); // Enter a nested try

            this.functionContext.enterTryFinallyClause(); // Enter the nested try's finally clause

            expect(this.functionContext.isInsideTryWithFinallyClause()).to.be.true;
            expect(this.functionContext.isInsideTryFinallyClause()).to.be.true;
        });
    });

    describe('getVariableValueAST()', function () {
        it('should return null when the variable was defined with no value AST', function () {
            this.functionContext.addVariable('myVar');

            expect(this.functionContext.getVariableValueAST('myVar')).to.be.null;
        });

        it('should return the value AST the variable was defined with', function () {
            this.functionContext.addVariable('myVar', {type: 'MyType'});

            expect(this.functionContext.getVariableValueAST('myVar')).to.deep.equal({type: 'MyType'});
        });

        it('should throw when the variable is not defined', function () {
            expect(function () {
                this.functionContext.getVariableValueAST('myUndefinedVar');
            }.bind(this)).to.throw('Variable "myUndefinedVar" is not defined');
        });
    });

    describe('hasVariableDefined()', function () {
        it('should return true for a defined variable', function () {
            this.functionContext.addVariable('myVar');

            expect(this.functionContext.hasVariableDefined('myVar')).to.be.true;
        });

        it('should return true for a defined function declaration', function () {
            this.functionContext.addFunctionDeclaration({
                type: 'FunctionDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'myFunc'
                },
                params: [],
                body: {
                    type: 'BlockStatement',
                    body: []
                }
            });

            expect(this.functionContext.hasVariableDefined('myFunc')).to.be.true;
        });

        it('should return false for an undefined variable', function () {
            expect(this.functionContext.hasVariableDefined('myUndefinedVar')).to.be.false;
        });
    });

    describe('isInsideTryFinallyClause()', function () {
        it('should return false by default', function () {
            expect(this.functionContext.isInsideTryFinallyClause()).to.be.false;
        });
    });

    describe('isInsideTryWithFinallyClause()', function () {
        it('should return false by default', function () {
            expect(this.functionContext.isInsideTryWithFinallyClause()).to.be.false;
        });
    });

    describe('leaveTryFinallyClause()', function () {
        beforeEach(function () {
            this.functionContext.enterTryWithFinallyClause();
            this.functionContext.enterTryFinallyClause();
        });

        it('should be able to leave a finally clause', function () {
            this.functionContext.leaveTryFinallyClause();

            expect(this.functionContext.isInsideTryWithFinallyClause()).to.be.false;
            expect(this.functionContext.isInsideTryFinallyClause()).to.be.false;
        });

        it('should be able to leave a nested finally clause, staying inside the parent one', function () {
            this.functionContext.enterTryWithFinallyClause(); // Enter a nested try
            this.functionContext.enterTryFinallyClause(); // Enter the nested try's finally clause

            this.functionContext.leaveTryFinallyClause();

            expect(this.functionContext.isInsideTryWithFinallyClause()).to.be.true;
            expect(this.functionContext.isInsideTryFinallyClause()).to.be.true;
        });
    });
});
