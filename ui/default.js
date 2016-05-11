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

define('lib/score/slides/ui/default', ['lib/score/oop', 'lib/bluebird', 'lib/css.js'], function(oop, BPromise, css) {

    'use strict';

    var isTouchDevice = 'ontouchstart' in window;

    var LAZYLOAD_AGGRESSIVE = 'aggressive';
    var LAZYLOAD_PROGRESSIVE = 'progressive';

    return oop.Class({
        __name__: 'DefaultSlidesUI',

        __static__: {
            _currentLeft: 0,
            _active: false,
            _config: {
                slidesToShow: 1,
                autoSlide: false,
                autoSlideSpeed: 2000,
                infinite: false,
                showButtons: true,
                center: false,
                delayInit: 200,
                lazyLoad: LAZYLOAD_AGGRESSIVE
            },
        },

        __init__: function(self, slider, config) {
            self.slider = slider;
            self.config = {breakpoints: { default: {}}};
            for (var key in self._config) {
                self.config[key] = self._config[key];
            }
            for (var key in config) {
                if (key === 'breakpoints') {
                    for (var breakpoint in config[key]) {
                        self.config.breakpoints[breakpoint] = config[key][breakpoint];
                    }
                    continue;
                }
                self.config[key] = config[key];
            }
            self.config.breakpoints.default['slidesToScroll'] = self.slider.config.slidesToScroll;
            self.config.breakpoints.default['ui-slidesToShow'] = self.config.breakpoints.default['ui-slidesToShow'] ? self.config.breakpoints.default['ui-slidesToShow'] : self.config.slidesToShow;
            self.offset = 0;
            self.node = config.node;
            self.slideNodes = [];
            css.addClass(self.node, 'slides');
            if (!self.config.infinite) {
                css.addClass(self.node, 'is-first');
            }
            self._handleBreakPoint();
            self.width = parseInt(self.node.offsetWidth / self.config.slidesToShow);
            self._initSlides();
            if (self.config.showButtons) {
                self._initNextButton();
                self._initPreviousButton();
            }
            if (self.numSlides() <= 1) {
                css.addClass(self.node, 'is-last');
            }
            window.addEventListener('resize', self._windowResized);
            if (isTouchDevice) {
                self.slideWidth = self.width;
                self.node.addEventListener('touchstart', self._touchStartHandler);
            }
            self.node.addEventListener('click', self._clickHandler);
            self.slider.on('transitionStart', self._transitionStartHandler);
            self.slider.on('transitionComplete', self._processQueued);
            if (self.config.autoSlide) {
                self.startAutoSlide();
            }
            // we need a redraw to prevent errors when not all css classes are
            // applied and dom is not in the final stage, we need the redraw also
            setTimeout(self.redraw, self.config.delayInit);
        },

        _handleBreakPoint: function(self) {
            var screenWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            if (screenWidth > screen.width) {
                screenWidth = screen.width;
            }
            screenWidth = parseInt(screenWidth);

            var breakpoint = 'default';
            for (var key in self.config.breakpoints) {
                if (key !== 'default' && screenWidth <= parseInt(key) && screenWidth > parseInt(breakpoint !== 'default' ? breakpoint : 0)) {
                    breakpoint = key;
                }
            }
            var conf = self.config.breakpoints[breakpoint];
            for (var key in conf) {
                if (key.indexOf('ui-') === 0) {
                    self.config[key.slice(3)] = conf[key];
                } else {
                    self.slider.config[key] = conf[key];
                }
            }
        },

        transition: function(self, from, to, isForward) {
            var left = -self.width * to - self.width * self.config.breakpoints.default['ui-slidesToShow'];
            var transition;
            if (isForward && from > to) {
                transition = self._nextTransition;
            } else if (!isForward && to > from) {
                transition = self._prevTransition;
            } else {
                transition = self._defaultTransition;
            }
            if (self.slider.transitionPending()) {
                return new BPromise(function(resolve, reject) {
                    self.slider.transition.then(resolve(function() {
                        return transition(left);
                    }));
                });
            }
            return transition(left);
        },

        _defaultTransition: function(self, left) {
            return new BPromise(function(resolve, reject) {
                self._transform(self.ul, left);
                self._currentLeft = left;
                setTimeout(resolve, self.transitionDuration);
            });
        },

        _nextTransition: function(self, left) {
            return self._jumpTransition(left, true);
        },

        _prevTransition: function(self, left) {
            return self._jumpTransition(left, false);
        },

        _jumpTransition: function(self, left, isForward) {
            var _left = self.slider.config.slidesToScroll * self.width;
            if (!isForward) {
                _left = -_left;
            }
            return new BPromise(function(resolve, reject) {
                 new BPromise(function (resolve, reject) {
                    css.addClass(self.ul, 'notransition');
                    self._transform(self.ul, left + _left);
                    setTimeout(resolve, 10);
                }).then(function () {
                    css.removeClass(self.ul, 'notransition');
                    self._transform(self.ul, left);
                    self._currentLeft = left;
                    setTimeout(resolve, self.transitionDuration);
                });
            });
        },

        numSlides: function(self) {
            return self.slideNodes.length;
        },

        _initSlides: function(self) {
            var createLi = function(node) {
                var li = document.createElement('li');
                li.style.width = self.width + 'px';
                li.className = 'slides__slide';
                li.appendChild(node);
                self.slideNodes.push(li);
                self.ul.appendChild(li);
            };
            self.ul = document.createElement('ul');
            self.ul.className = 'slides__list';
            self.ul.style.width = parseInt(self.width * (self.config.nodes.length + (self.config.breakpoints.default['ui-slidesToShow'] * 2))) + 'px';
            self.ul.style.display = 'block';
            self.node.appendChild(self.ul);
            self.config.nodes = Array.prototype.slice.call(self.config.nodes);
            for (var i = 0; i < self.config.nodes.length; i++) {
                createLi(self.config.nodes[i]);
                var lazyLoad = i < self.config.breakpoints.default['ui-slidesToShow'];
                if (self.config.lazyLoad === LAZYLOAD_AGGRESSIVE) {
                    lazyLoad = i < self.config.breakpoints.default['ui-slidesToShow'] + self.slider.config.slidesToScroll ||
                        i >= self.config.nodes.length - self.slider.config.slidesToScroll
                }
                if (lazyLoad) {
                    self._lazyLoad(self.slideNodes[i]);
                }
            }
            var firstNode = self.ul.firstChild;
            for (var i = 0; i < self.slideNodes.length; i++) {
                var clone;
                if (i < self.config.breakpoints.default['ui-slidesToShow']) {
                    clone = self.slideNodes[i].cloneNode(true);
                    self.ul.appendChild(clone);
                } else if (i >= (self.slideNodes.length - self.config.breakpoints.default['ui-slidesToShow'])) {
                    clone = self.slideNodes[i].cloneNode(true);
                    self.ul.insertBefore(clone, firstNode);
                }
                if (clone && self.config.lazyLoad === LAZYLOAD_AGGRESSIVE) {
                    self._lazyLoad(clone);
                }
            }
        },

        _initNextButton: function(self) {
            self.nextButton = document.createElement('button');
            self.nextButton.innerHTML = 'next';
            self.nextButton.className = 'slides__button--next';
            self.nextButton.addEventListener('click', self.next);
            self.node.appendChild(self.nextButton);
        },

        _initPreviousButton: function(self) {
            self.prevButton = document.createElement('button');
            self.prevButton.innerHTML = 'prev';
            self.prevButton.className = 'slides__button--previous';
            self.prevButton.addEventListener('click', self.prev);
            self.node.appendChild(self.prevButton);
        },

        _transitionStartHandler: function(self, event) {
            self._updateButtons(event);
            self._lazyLoadImages(event);
        },

        _updateButtons: function(self, event) {
            if (self.config.infinite) {
                return;
            }
            css.removeClass(self.node, 'is-first');
            css.removeClass(self.node, 'is-last');
            if (self.slider.isFirstSlide(event.next)) {
                css.addClass(self.node, 'is-first');
            } else if (self.slider.isLastSlide(event.next)) {
                css.addClass(self.node, 'is-last');
            }
        },

        _lazyLoadImages: function(self, event) {
            if (event.current > event.next) {
                if (self.lazyLoad === LAZYLOAD_PROGRESSIVE) {
                    return;
                }
                for (var i = (event.next - self.slider.config.slidesToScroll); i < event.next; i++) {
                    var node = self.slideNodes[i];
                    self._lazyLoad(node);
                }
            } else if (event.next - event.current === self.slider.config.slidesToScroll) {
                if (self.lazyLoad === LAZYLOAD_PROGRESSIVE) {
                    return;
                }
                var first = event.next + self.config.slidesToShow;
                for (var i = first; i < first + self.slider.config.slidesToScroll; i++) {
                    var node = self.slideNodes[i];
                    self._lazyLoad(node);
                }
            } else if (event.next > event.current) {
                for (var i = event.next; i < self.slideNodes.length; i++) {
                    self._lazyLoad(self.slideNodes[i]);
                }
                if (self.lazyLoad === LAZYLOAD_PROGRESSIVE) {
                    return;
                }
                for (var i = event.next - self.slider.config.slidesToScroll; i < event.next; i++) {
                    self._lazyLoad(self.slideNodes[i]);
                }
            } else {
                for (var i = event.next; i < (event.next + self.config.slidesToShow + self.slider.config.slidesToScroll); i++) {
                    self._lazyLoad(self.slideNodes[i]);
                }
            }
        },

        _windowResized: function(self) {
            self._handleBreakPoint();
            if (!self.slider.transitionPending()) {
                return self.redraw();
            }
            self.slider.transition.then(function() {
                self.redraw();
            });

        },

        redraw: function(self) {
            self.width = parseInt(self.node.offsetWidth / self.config.slidesToShow);
            self.offset = self.config.center ? (self.config.slidesToShow - 1) / 2 * self.width : 0;
            self._currentLeft = -self.width * self.slider.currentSlideNum - self.width * self.config.breakpoints.default['ui-slidesToShow'];
            self.ul.style.width = self.width * (self.config.nodes.length + self.config.breakpoints.default['ui-slidesToShow'] * 2) + 'px';
            var nodes =  self.ul.getElementsByClassName('slides__slide');
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].style.width = self.width + 'px';
            }
            var transitionDuration = getComputedStyle(self.ul).transitionDuration;
            if (transitionDuration.indexOf('ms') > -1) {
                self.transitionDuration = parseInt(transitionDuration.replace('ms', ''));
            } else if (transitionDuration.indexOf('s') > -1) {
                self.transitionDuration = parseInt(transitionDuration.replace('s', '') * 1000);
            }
            css.addClass(self.ul, 'notransition');
            self._transform(self.ul, self._currentLeft);
            setTimeout(function () {
                css.removeClass(self.ul, 'notransition');
            }, 50);
        },

        _touchStartHandler: function(self, event) {
            self.initialLeft = self._currentLeft;
            self.initialMouseLeft = self._touchLocation(event)[0];
            self.initialMouseTop = self._touchLocation(event)[1];
            self.maxLeftDistance = self.slideWidth * (self.slider.isFirstSlide() && !self.config.infinite ? 0.1 : 1.1);
            self.maxRightDistance = self.slideWidth * (self.slider.isLastSlide() && !self.config.infinite ? 0.1 : 1.1);
            self.node.addEventListener('touchmove', self._touchMoveInit);
        },

        _touchLocation: function(self, event) {
            // android always returns [0,0] as event.pageX/.pageY and provides
            // multiple coordinates of multi-touch capable devices as
            // event.changedTouches.
            if (typeof event.changedTouches !== 'undefined') {
                return [event.changedTouches[0].pageX, event.changedTouches[0].pageY];
            }
            return [event.pageX, event.pageY];
        },

        _touchMoveInit: function(self, event) {
            self.horizontalDistance = self.initialMouseLeft - self._touchLocation(event)[0];
            self.verticalDistance = self.initialMouseTop - self._touchLocation(event)[1];
            self.node.removeEventListener('touchmove', self._touchMoveInit);
            if (Math.abs(self.horizontalDistance) <= Math.abs(self.verticalDistance)) {
                // the movement was not from left to tight or right to left
                // but from top to bottom or bottom to top.
                return;
            }
            document.addEventListener('touchend', self._touchEndHandler);
            document.addEventListener('touchcancel', self._touchCancelHandler);
            self.node.addEventListener('touchmove', self._touchMoveHandler);
            event.preventDefault();
            return false;
        },

        _touchMoveHandler: function(self, event) {
            var currentMouseLeft = self._touchLocation(event)[0];
            var distance = currentMouseLeft - self.initialMouseLeft;
            var relativeDistance;
            var adjustedDistance;
            if (distance < 0) {
                relativeDistance = Math.min(1, -distance / self.maxRightDistance);
                adjustedDistance = -self.maxRightDistance * (1 - Math.pow(1 - relativeDistance, 3));
            } else {
                relativeDistance = Math.min(1, distance / self.maxLeftDistance);
                adjustedDistance = self.maxLeftDistance * (1 - Math.pow(1 - relativeDistance, 3));
            }
            self._currentLeft = Math.round(self.initialLeft + adjustedDistance);
            self._transform(self.ul, self._currentLeft);
        },

        _touchEndHandler: function(self, event) {
            document.removeEventListener('touchend', self._touchEndHandler);
            document.removeEventListener('touchcancel', self._touchCancelHandler);
            self.node.removeEventListener('touchmove', self._touchMoveHandler);
            if (self._touchLocation(event)[0] != self.initialMouseLeft) {
                if (self._touchLocation(event)[0] > self.initialMouseLeft && (self.config.infinite || self.slider.currentSlideNum - 1 >= 0)) {
                    self.prev(event);
                } else if (self._touchLocation(event)[0] < self.initialMouseLeft && (self.config.infinite || self.slider.currentSlideNum + 1 < self.slider.numSlides())) {
                    self.next(event);
                } else {
                    self._resetSlidePosition();
                }
                event.preventDefault();
                return false;
            }
        },

        _touchCancelHandler: function(self, event) {
            document.removeEventListener('touchend', self._touchEndHandler);
            document.removeEventListener('touchcancel', self._touchCancelHandler);
            self.node.removeEventListener('touchmove', self._touchMoveHandler);
            self._resetSlidePosition();
        },

        _resetSlidePosition: function(self) {
            self._transform(self.ul, self.initialLeft);
        },

        _clickHandler: function(self, event) {
            if (!self._active) {
                self._active = true;
                document.addEventListener('keyup', self._keyUpHandler);
                document.addEventListener('click', self._globalClickHandler);
            }
        },

        _keyUpHandler: function(self, event) {
            var key = 'which' in event ? event.which : event.keyCode;
            if (key === 37) {
                return self.prev(event);
            } else if (key === 39) {
                return self.next(event);
            }
        },

        _globalClickHandler: function(self, event) {
            if (event.target === self.node || self.node.contains(event.target)) {
                return;
            }
            document.removeEventListener('keyup', self._keyUpHandler);
            document.removeEventListener('click', self._globalClickHandler);
            self._active = false;
        },

        _transform: function(self, node, value) {
            value = value + self.offset;
            node.style.transform = 'translateX(' + value + 'px)';
            node.style.webkitTransform = 'translateX(' + value + 'px)';
            node.style.msTransform = 'translateX(' + value + 'px)';
        },

        startAutoSlide: function(self) {
            self._interval = setInterval(function() {
                if (!self.config.autoSlide) {
                    return clearInterval(self._interval);
                }
                self.next();
            }, self.config.autoSlideSpeed);
        },

        stopAutoSlide: function(self) {
            self.config.autoSlide = false;
        },

        prev: function(self, event) {
            if (event && self.config.autoSlide) {
                self.stopAutoSlide();
            }
            if (self.slider.transitionPending()) {
                return self._queueTransition(self.slider.prev);
            }
            self.slider.prev();
        },

        next: function(self, event) {
            if (event && self.config.autoSlide) {
                self.stopAutoSlide();
            }
            if (self.slider.transitionPending()) {
                return self._queueTransition(self.slider.next);
            }
            self.slider.next();
        },

        slideTo: function(self, index, isForward) {
            if (event && self.config.autoSlide) {
                self.stopAutoSlide();
            }
            if (self.slider.transitionPending()) {
                return self._queueTransition(self.slider.slideTo, [index, isForward]);
            }
            self.slider.slideTo(index, isForward);
        },

        _queueTransition: function(self, transition, args) {
            if (!args && self._queued) {
                return;
            }
            self._queued = {
                transition: transition,
                args: args
            };
        },

        _processQueued: function(self) {
            if (!self._queued) {
                return;
            }
            var queued = self._queued;
            self._queued = null;
            queued.transition.apply(self, queued.args);
        },

        _lazyLoad: function(self, node) {
            // extend the default UI to handle lazyLoad with a library / script of your choice
        }
    });
});
