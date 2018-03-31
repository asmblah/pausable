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
        });

        it('should not add a `resumableReturnValue` variable to the context when the try does not have a finally clause', function () {
            this.functionContext.addReturnInTryOutsideFinally();

            expect(this.functionContext.hasVariableDefined('resumableReturnValue')).to.be.false;
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
