define('lib/score/slides/ui/default', ['lib/score/oop', 'lib/bluebird', 'lib/css.js'], function(oop, BPromise, css) {

    'use strict';

    var isTouchDevice = 'ontouchstart' in window;

    return oop.Class({
        __name__: 'DefaultSlidesUI',

        _currentLeft: 0,

        __init__: function(self, slider, config) {
            self.slider = slider;
            self.config = config;
            self.node = config.node;
            self.slideNodes = [];
            css.addClass(self.node, 'slides');
            css.addClass(self.node, 'is-first');
            self.width = self.node.offsetWidth;
            self._initSlides();
            self._initNextButton();
            self._initPreviousButton();
            if (self.numSlides() <= 1) {
                css.addClass(self.node, 'is-last');
            }
            window.addEventListener('resize', self._windowResized);
            if (isTouchDevice) {
                self.slideWidth = self.node.offsetWidth;
            }
            self.node.addEventListener('touchstart', self._touchStartHandler);
        },

        transition: function(self, from, to, isForward) {
            if (self.slider.isFirstSlide()) {
                css.addClass(self.node, 'is-first');
            } else {
                css.removeClass(self.node, 'is-first');
            }
            if (self.slider.isLastSlide()) {
                css.addClass(self.node, 'is-last');
            } else {
                css.removeClass(self.node, 'is-last');
            }
            var left = -self.width * to;
            return new BPromise(function(resolve, reject) {
                self.ul.style.transform = 'translateX(' + left + 'px)';
                self.ul.style.webkitTransform = 'translateX(' + left + 'px)';
                self.ul.style.msTransform = 'translateX(' + left + 'px)';
                self._currentLeft = left;
            });
        },

        numSlides: function(self) {
            return self.slideNodes.length;
        },

        _initSlides: function(self) {
            self.ul = document.createElement('ul');
            self.ul.className = 'slides__list';
            self.ul.style.width = self.width * self.config.nodes.length + 'px';
            self.ul.style.display = 'block';
            self.node.appendChild(self.ul);
            self.config.nodes = Array.prototype.slice.call(self.config.nodes);
            for (var i = 0; i < self.config.nodes.length; i++) {
                var li = document.createElement('li');
                li.style.width = self.width + 'px';
                li.className = 'slides__slide';
                li.appendChild(self.config.nodes[i]);
                self.slideNodes.push(li);
                self.ul.appendChild(li);
            }
        },

        _initNextButton: function(self) {
            self.nextButton = document.createElement('button');
            self.nextButton.innerHTML = 'next';
            self.nextButton.className = 'slides__button--next';
            self.nextButton.addEventListener('click', function() {
                if (!self.slider.isLastSlide()) {
                    self.slider.next();
                }
            });
            self.node.appendChild(self.nextButton);
        },

        _initPreviousButton: function(self) {
            self.prevButton = document.createElement('button');
            self.prevButton.innerHTML = 'prev';
            self.prevButton.className = 'slides__button--previous';
            self.prevButton.addEventListener('click', function() {
                if (!self.slider.isFirstSlide()) {
                    self.slider.prev();
                }
            });
            self.node.appendChild(self.prevButton);
        },

        _windowResized: function(self) {
            self.width = self.node.offsetWidth;
            self.ul.style.width = (self.slideNodes.length * self.width) + 'px';
            for (var i = 0; i < self.slideNodes.length; i++) {
                self.slideNodes[i].style.width = self.width + 'px';
            }
            self.transition(0, self.slider.currentSlideNum, true);
        },

        _touchStartHandler: function(self, event) {
            self.initialLeft = self._currentLeft;
            self.initialMouseLeft = self._touchLocation(event)[0];
            self.initialMouseTop = self._touchLocation(event)[1];
            self.maxLeftDistance = self.slideWidth * (self.slider.isFirstSlide() ? 0.1 : 1.1);
            self.maxRightDistance = self.slideWidth * (self.slider.isLastSlide() ? 0.1 : 1.1);
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
            var distance = currentMouseLeft - self.initialMouseLeft,
                relativeDistance,
                adjustedDistance;
            if (distance < 0) {
                relativeDistance = Math.min(1, -distance / self.maxRightDistance);
                adjustedDistance = -self.maxRightDistance * (1 - Math.pow(1 - relativeDistance, 3));
            } else {
                relativeDistance = Math.min(1, distance / self.maxLeftDistance);
                adjustedDistance = self.maxLeftDistance * (1 - Math.pow(1 - relativeDistance, 3));
            }
            self._currentLeft = Math.round(self.initialLeft + adjustedDistance);
            self.ul.style.transform = 'translateX(' + self._currentLeft + 'px)';
            self.ul.style.webkitTransform = 'translateX(' + self._currentLeft + 'px)';
            self.ul.style.msTransform = 'translateX(' + self._currentLeft + 'px)';
        },

        _touchEndHandler: function(self, event) {
            document.removeEventListener('touchend', self._touchEndHandler);
            document.removeEventListener('touchcancel', self._touchCancelHandler);
            self.node.removeEventListener('touchmove', self._touchMoveHandler);
            if (self._touchLocation(event)[0] != self.initialMouseLeft) {
                if (self._touchLocation(event)[0] > self.initialMouseLeft && self.slider.currentSlideNum - 1 >= 0) {
                    self.slider.prev();
                } else if (self._touchLocation(event)[0] < self.initialMouseLeft && self.slider.currentSlideNum + 1 < self.slider.numSlides()) {
                    self.slider.next();
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
            self.ul.style.transform = 'translateX(' + self.initialLeft + 'px)';
            self.ul.style.webkitTransform = 'translateX(' + self.initialLeft + 'px)';
            self.ul.style.msTransform = 'translateX(' + self.initialLeft + 'px)';
        }
    });

});
