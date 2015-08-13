/*
 * Pausable - Pause and resume JavaScript code
 * Copyright (c) Dan Phillimore (asmblah)
 * http://asmblah.github.com/pausable/
 *
 * Released under the MIT license
 * https://github.com/asmblah/pausable/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    Promise = require('../../../src/Promise'),
    Resumable = require('../../../src/Resumable'),
    Transpiler = require('../../../src/Transpiler');

describe('Resumable.call(...)', function () {
    beforeEach(function () {
        this.resumable = new Resumable(new Transpiler());
    });

    describe('when passing out a reference to a function that pauses but succeeds', function () {
        beforeEach(function () {
            this.js = nowdoc(function () {/*<<<EOS
exports.myFunc = function () {
    var four = giveMeAsync(4);

    return four + 2;
};
EOS
*/;});
            this.exports = {};

            this.callExecute = function () {
                return this.resumable.execute(this.js, {
                    expose: {
                        exports: this.exports,
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

        describe('calling the exported function via Resumable.call(...)', function () {
            beforeEach(function (done) {
                this.callExecute().done(function () {
                    done();
                }).fail(done);
            });

            it('should return 6', function (done) {
                this.resumable.call(this.exports.myFunc, [], null).done(function (result) {
                    try {
                        expect(result).to.equal(6);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }).fail(done);
            });
        });
    });

    describe('when passing out a reference to a function that pauses but throws', function () {
        beforeEach(function () {
            this.js = nowdoc(function () {/*<<<EOS
exports.myFunc = function () {
    throwSomething('oh dear');
};
EOS
*/;});
            this.exports = {};

            this.callExecute = function () {
                return this.resumable.execute(this.js, {
                    expose: {
                        exports: this.exports,
                        throwSomething: function (what) {
                            var pause = this.resumable.createPause();

                            setTimeout(function () {
                                pause.throw(new Error(what));
                            });

                            pause.now();
                        }.bind(this)
                    }
                });
            }.bind(this);
        });

        describe('calling the exported function via Resumable.call(...)', function () {
            beforeEach(function (done) {
                this.callExecute().done(function () {
                    done();
                }).fail(done);
            });

            it('should throw the expected error', function (done) {
                this.resumable.call(this.exports.myFunc, [], null).done(function (result) {
                    done(new Error('Expected rejection but was resolved with "' + result + '"'));
                }).fail(function (error) {
                    try {
                        expect(error.message).to.equal('oh dear');
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });
});
