/**
 * Copyright © 2015 STRG.AT GmbH, Vienna, Austria
 *
 * This file is part of the The SCORE Framework.
 *
 * The SCORE Framework and all its parts are free software: you can redistribute
 * them and/or modify them under the terms of the GNU Lesser General Public
 * License version 3 as published by the Free Software Foundation which is in the
 * file named COPYING.LESSER.txt.
 *
 * The SCORE Framework and all its parts are distributed without any WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. For more details see the GNU Lesser General Public
 * License.
 *
 * If you have not received a copy of the GNU Lesser General Public License see
 * http://www.gnu.org/licenses/.
 *
 * The License-Agreement realised between you as Licensee and STRG.AT GmbH as
 * Licenser including the issue of its valid conclusion and its pre- and
 * post-contractual effects is governed by the laws of Austria. Any disputes
 * concerning this License-Agreement including the issue of its valid conclusion
 * and its pre- and post-contractual effects are exclusively decided by the
 * competent court, in whose district STRG.AT GmbH has its registered seat, at
 * the discretion of STRG.AT GmbH also the competent court, in whose district the
 * Licensee has his registered seat, an establishment or assets.
 */

define('lib/score/slides', ['lib/score/oop', 'lib/bluebird'], function(oop, BPromise) {

    "use strict";

    return oop.Class({
        __name__: 'Slides',

        __static__: {

            VERSION: "0.1",

        },

        __events__: [
            'change',
            'transitionStart',
            'transitionComplete'
        ],

        __init__: function(self, config) {
            self.config = config;
            var uiconf = {};
            for (var key in config) {
                if (key.indexOf('ui-') === 0) {
                    uiconf[key.substr(3)] = config[key];
                }
            }
            self.currentSlideNum = 0;
            self.ui = new config.ui(self, uiconf);
        },

        next: function(self) {
            if (self.isLastSlide()) {
                self.slideTo(0, true);
            } else {
                self.slideTo(self.currentSlideNum + 1, true);
            }
        },

        prev: function(self) {
            if (self.isFirstSlide()) {
                self.slideTo(self.numSlides() - 1, false);
            } else {
                self.slideTo(self.currentSlideNum - 1, false);
            }
        },

        slideTo: function(self, index, isForward) {
            if (self.currentSlideNum === index) {
                return;
            }
            var previous = self.currentSlideNum;
            if (self.numSlides() <= index || index < 0) {
                return;
            }
            if (!self.trigger('change', index, isForward)) {
                return;
            }
            self.trigger('transitionStart', {
                current: self.currentSlideNum,
                next: index
            });
            self.currentSlideNum = index;
            if (self.transition && !self.transition.isCancelled()) {
                self.transition.cancel();
            }
            self.transition = self.ui.transition(previous, index, isForward);
            self.transition.then(function() {
                self.trigger('transitionComplete', {
                    previous: previous,
                    current: self.currentSlideNum
                });
                self.transition = null;
            }).catch(BPromise.CancellationError, function() {
            });
        },

        isFirstSlide: function(self) {
            return self.currentSlideNum === 0;
        },

        isLastSlide: function(self) {
            return self.currentSlideNum === self.numSlides() - 1;
        },

        numSlides: function(self) {
            return self.ui.numSlides();
        }

    });

});
