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
    Resumable = require('../../../src/Resumable'),
    Transpiler = require('../../../src/Transpiler');

describe('Resumable.executeSync(...)', function () {
    beforeEach(function () {
        this.resumable = new Resumable(new Transpiler());
    });

    describe('when passed a function that does not pause but returns a function that does', function () {
        beforeEach(function () {
            this.args = [];
            this.fn = function testFn(whatToGive) {
                var myFunc = function () {
                    var four = giveMeAsync(whatToGive); //jshint ignore:line

                    return four + 2;
                };

                return myFunc;
            };

            this.callExecute = function () {
                return this.resumable.executeSync(this.args, this.fn, {
                    expose: {
                        giveMeAsync: function (what) {
                            var pause = this.resumable.createPause();

                            setTimeout(function () {
                                pause.resume(what);
                            });

                            pause.now();
                        }.bind(this)
                    }
                });
            }.bind(this);
        });

        it('should export the function synchronously', function () {
            expect(this.callExecute()).to.be.a('function');
        });

        it('should return 12 when the exported function is called via Resumable.call(...)', function (done) {
            this.args[0] = 10;

            this.resumable.call(this.callExecute(), [], null).then(function (result) {
                try {
                    expect(result).to.equal(12);
                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
        });
    });
});
