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

define('lib/score/slides/slides', ['lib/score/oop', 'lib/bluebird'], function(oop, BPromise) {

    'use strict';

    return oop.Class({
        __name__: 'Slides',

        __static__: {
            VERSION: '0.2',
            config: {
                slidesToScroll: 1,
            }
        },

        __events__: [
            'change',
            'transitionStart',
            'transitionComplete'
        ],

        __init__: function(self, config) {
            var uiconf = {};
            for (var key in config) {
                if (key.indexOf('ui-') === 0) {
                    uiconf[key.substr(3)] = config[key];
                }
                self.config[key] = config[key];
            }
            self.currentSlideNum = 0;
            self.ui = new config.ui(self, uiconf);
        },

        next: function(self) {
            var nextIndex = self.currentSlideNum + self.config.slidesToScroll;
            if (nextIndex >= self.numSlides()) {
                return self.slideTo(nextIndex - self.numSlides(), true);
            }
            return self.slideTo(nextIndex, true);
        },

        prev: function(self) {
            var nextIndex = self.currentSlideNum - self.config.slidesToScroll;
            if (nextIndex < 0) {
                return self.slideTo(self.numSlides() + nextIndex, false);
            }
            return self.slideTo(nextIndex, false);
        },

        slideTo: function(self, index, isForward) {
            if (self.transitionPending()) {
                // pass
                return BPromise.resolve();
            }
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
            self.transition = self.ui.transition(previous, index, isForward);
            return self.transition.then(function() {
                self.currentSlideNum = index;
                self.trigger('transitionComplete', {
                    previous: previous,
                    current: self.currentSlideNum
                });
                self.transition = null;
            });
        },

        isFirstSlide: function(self, index) {
            if (index === undefined) {
                index = self.currentSlideNum;
            }
            return index === 0;
        },

        isLastSlide: function(self, index) {
            if (index === undefined) {
                index = self.currentSlideNum;
            }
            return index === self.numSlides() - 1;
        },

        numSlides: function(self) {
            return self.ui.numSlides();
        },

        transitionPending: function(self) {
            return self.transition && self.transition.isPending();
        }

    });

});
