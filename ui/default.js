define('lib/score/slides/ui/default', ['lib/score/oop', 'lib/bluebird', 'lib/css.js'], function(oop, BPromise, css) {

    'use strict';

    var isTouchDevice = 'ontouchstart' in window;

    var transitionEvent = function() {
        var el = document.createElement('fakeelement');
        var transitions = {
            'transition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'MozTransition': 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd'
        };

        for (var t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t];
            }
        }
    }();

    return oop.Class({
        __name__: 'DefaultSlidesUI',

        __static__: {
            config: {
                slidesToShow: 1,
                autoSlide: false,
                autoSlideSpeed: 2000,
                infinite: false
            },
            _currentLeft: 0,
            _active: false,
        },



        __init__: function(self, slider, config) {
            self.slider = slider;
            for (var key in config) {
                self.config[key] = config[key];
            }
            self.node = config.node;
            self.slideNodes = [];
            css.addClass(self.node, 'slides');
            if (!self.config.infinite) {
                css.addClass(self.node, 'is-first');
            }
            self.width = self.node.offsetWidth / self.config.slidesToShow;
            self._initSlides();
            self._initNextButton();
            self._initPreviousButton();
            if (self.numSlides() <= 1) {
                css.addClass(self.node, 'is-last');
            }
            window.addEventListener('resize', self._windowResized);
            if (isTouchDevice) {
                self.slideWidth = self.node.offsetWidth / self.config.slidesToShow;
            }
            self.node.addEventListener('touchstart', self._touchStartHandler);
            self.node.addEventListener('click', self._clickHandler);
            self.slider.on('transitionStart', self._updateButtons);
            if (self.config.autoSlide) {
                self._interval = setInterval(function() {
                    self.slider.next();
                }, self.config.autoSlideSpeed);
            }
            self._currentLeft = -(self.width * self.config.slidesToShow);
            // 0s transition dont trigger transitionEnd Event ;(
            new BPromise(function(resolve, reject) {
                css.addClass(self.ul, 'notransition');
                self._transform(self.ul, self._currentLeft);
                resolve();
            }).then(function() {
                css.removeClass(self.ul, 'notransition');
            });
        },

        transition: function(self, from, to, isForward) {
            var left = -self.width * to - (self.width * self.config.slidesToShow);
            if (isForward && from > to) {
                return self._nextTransition(left);
            } else if (!isForward && to > from) {
                return self._prevTransition(left);
            }

            return self._defaultTransition(left);
        },

        _defaultTransition: function(self, left) {
            return new BPromise(function(resolve, reject) {
                var complete = function () {
                    self.ul.removeEventListener(transitionEvent, complete);
                    resolve();
                };
                transitionEvent && self.ul.addEventListener(transitionEvent, complete);
                self._transform(self.ul, left);
                self._currentLeft = left;
                if (!transitionEvent) {
                    resolve();
                }
            });
        },

        _nextTransition: function(self, left) {
            return new BPromise(function(resolve, reject) {
                new BPromise(function (resolve, reject) {
                    css.addClass(self.ul, 'notransition');
                    self._transform(self.ul, left + (self.slider.config.slidesToScroll * self.width));
                    resolve();
                }).then(function () {
                    css.removeClass(self.ul, 'notransition');
                    var complete = function () {
                        self.ul.removeEventListener(transitionEvent, complete);
                        resolve();
                    };
                    transitionEvent && self.ul.addEventListener(transitionEvent, complete);
                    self._transform(self.ul, left);
                    self._currentLeft = left;
                    if (!transitionEvent) {
                        resolve();
                    }
                });
            });
        },

        _prevTransition: function(self, left) {
            return new BPromise(function(resolve, reject) {
                var complete = function() {
                    self.ul.removeEventListener(transitionEvent, complete);
                    new BPromise(function(resolve, reject) {
                        css.addClass(self.ul, 'notransition');
                        self._transform(self.ul, left);
                        self._currentLeft = left;
                        resolve();
                    }).then(function() {
                        css.removeClass(self.ul, 'notransition');
                        resolve();
                    });
                };
                transitionEvent && self.ul.addEventListener(transitionEvent, complete);
                self._transform(self.ul, self._currentLeft + (self.width * self.slider.config.slidesToScroll));
                if (!transitionEvent) {
                    resolve();
                }
            })
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
            self.ul.style.width = self.width * (self.config.nodes.length + (self.config.slidesToShow * 2)) + 'px';
            self.ul.style.display = 'block';
            self.node.appendChild(self.ul);
            self.config.nodes = Array.prototype.slice.call(self.config.nodes);
            for (var i = 0; i < self.config.nodes.length; i++) {
                createLi(self.config.nodes[i]);
            }
            var firstNode = self.ul.firstChild;
            for (var i = 0; i < self.slideNodes.length; i++) {
                if (i < self.config.slidesToShow) {
                    self.ul.appendChild(self.slideNodes[i].cloneNode(true));
                } else if (i >= (self.slideNodes.length - self.config.slidesToShow)) {
                    self.ul.insertBefore(self.slideNodes[i].cloneNode(true), firstNode);
                }
            }
        },

        _initNextButton: function(self) {
            self.nextButton = document.createElement('button');
            self.nextButton.innerHTML = 'next';
            self.nextButton.className = 'slides__button--next';
            self.nextButton.addEventListener('click', self.slider.next);
            self.node.appendChild(self.nextButton);
        },

        _initPreviousButton: function(self) {
            self.prevButton = document.createElement('button');
            self.prevButton.innerHTML = 'prev';
            self.prevButton.className = 'slides__button--previous';
            self.prevButton.addEventListener('click', self.slider.prev);
            self.node.appendChild(self.prevButton);
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

        _windowResized: function(self) {
            self.width = self.node.offsetWidth / self.config.slidesToShow;
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
            self._transform(self.ul, self._currentLeft);
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
                return self.slider.prev();
            } else if (key === 39) {
                return self.slider.next();
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
            console.log(value);
            node.style.transform = 'translateX(' + value + 'px)';
            node.style.webkitTransform = 'translateX(' + value + 'px)';
            node.style.msTransform = 'translateX(' + value + 'px)';
        }

    });

});
