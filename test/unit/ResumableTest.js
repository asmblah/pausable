/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var escodegen = require('escodegen'),
    acorn = require('acorn'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    Resumable = require('../../src/Resumable'),
    Transpiler = require('../../src/Transpiler');

describe('Resumable', function () {
    beforeEach(function () {
        this.transpiler = sinon.createStubInstance(Transpiler);
        this.transpiler.transpile.restore();
        sinon.stub(this.transpiler, 'transpile', function (ast) {
            var code = escodegen.generate(ast);

            code = '(function () {' + code + '})';

            return acorn.parse(code, {'allowReturnOutsideFunction': true});
        });

        this.resumable = new Resumable(this.transpiler);
    });

    describe('static checkCallable() method', function () {
        it('should not throw when the value is callable', function () {
            expect(function () {
                Resumable.checkCallable('myCallable', sinon.stub());
            }).not.to.throw();
        });

        it('should throw when the value is not callable', function () {
            expect(function () {
                Resumable.checkCallable('myNonCallable', 21);
            }).to.throw(TypeError, 'myNonCallable is not a function');
        });
    });

    describe('execute()', function () {
        describe('in default (sloppy) mode', function () {
            it('should execute the code in sloppy ES mode', function () {
                return this.resumable.execute(
                    'return {prop: 1, prop: 2};',
                    {strict: false}
                ).then(function (result) {
                    expect(result.prop).to.equal(2);
                });
            });
        });

        describe('in strict mode', function () {
            it('should execute the code in strict ES mode', function () {
                return this.resumable.execute(
                    'return this;',
                    {strict: true}
                ).then(function (result) {
                    expect(result).to.be.null;
                });
            });
        });
    });

    describe('executeSync()', function () {
        describe('in default (sloppy) mode', function () {
            it('should execute the code in sloppy ES mode', function () {
                var result = this.resumable.executeSync(
                    [],
                    function () {
                        return this;
                    },
                    {strict: false}
                );

                expect(result.prop).not.to.be.null;
            });
        });

        describe('in strict mode', function () {
            it('should execute the code in strict ES mode', function () {
                var result = this.resumable.executeSync(
                    [],
                    function () {
                        return this;
                    },
                    {strict: true}
                );

                expect(result).to.be.null;
            });
        });
    });
});
