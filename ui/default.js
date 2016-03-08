define('lib/score/slides/ui/default', ['lib/score/oop', 'lib/bluebird'], function(oop, BPromise) {

    "use strict";

    var isTouchDevice = 'ontouchstart' in window;

    return oop.Class({
        __name__: 'DefaultSlidesUI',

        __init__: function(self, slider, config) {
            self.slider = slider;
            self.config = config;
            self.node = config.node;
            self.slideNodes = [];
            self._addClassName(self.node, 'slides is-first');
            self.width = self.node.offsetWidth;
            self._initSlides();
            self._initNextButton();
            self._initPreviousButton();
            if (self.numSlides() <= 1) {
                self._addClassName(self.node, 'is-last');
            }
            window.addEventListener('resize', self.__bind__('_windowResized'));
        },

        transition: function(self, from, to, isForward) {
            if (self.slider.isFirstSlide()) {
                self._addClassName(self.node, 'is-first');
            } else {
                self._removeClassName(self.node, 'is-first');
            }
            if (self.slider.isLastSlide()) {
                self._addClassName(self.node, 'is-last');
            } else {
                self._removeClassName(self.node, 'is-last');
            }
            var left = -self.width * to;
            return new BPromise(function(resolve, reject) {
                self.ul.style.transform = 'translateX(' + left + 'px)';
                self.ul.style.msTransform = 'translateX(' + left + 'px)';
            });
        },

        numSlides: function(self) {
            return self.slideNodes.length;
        },

        _initSlides: function(self) {
            self.ul = document.createElement('ul');
            self.ul.className = 'slides__slides';
            self.ul.style.width = self.width * self.config.nodes.length + 'px';
            self.ul.style.display = 'block';
            self.node.appendChild(self.ul);
            self.config.nodes = Array.prototype.slice.call(self.config.nodes);
            for (var i = 0; i < self.config.nodes.length; i++) {
                var li = document.createElement('li');
                li.style.width = self.width + 'px';
                li.className = 'slides__slides__slide';
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
            self.ul.style.width = (4 * self.node.offsetWidth) + "px";
            for (var i = 0; i < self.slideNodes.length; i++) {
                self.slideNodes[i].style.width = self.width + "px";
            }
            self.transition(0, self.slider.currentSlideNum, true);
        },

        // @TODO move this to helper class
        _addClassName: function(self, $node, className) {
            var nodeClassName = $node.className,
                classNames = [];
            if (nodeClassName) {
                classNames = nodeClassName.split(' ');
            }
            if (classNames.length === 0) {
                $node.className = className;
                return;
            }
            if (classNames.indexOf(className) > -1) {
                return;
            }
            $node.className += ' ' + className;
        },

        // @TODO move this to helper class
        _removeClassName: function(self, $node, className) {
            var nodeClassName = $node.className,
                classNames = [];
            if (nodeClassName) {
                classNames = nodeClassName.split(' ');
            }
            var index = classNames.indexOf(className);
            if (classNames.length === 0 || index === -1) {
                return;
            }
            classNames.splice(index, 1);
            $node.className = classNames.join(' ');
        }

        // unused code, but we'll need it when we implement touch device support
        //
        // _touchLocation: function(self, event) {
        //     // android always returns [0,0] as event.pageX/.pageY and provides
        //     // multiple coordinates of multi-touch capable devices as
        //     // event.changedTouches.
        //     if (typeof event.changedTouches !== 'undefined') {
        //         return [event.changedTouches[0].pageX, event.changedTouches[0].pageY];
        //     }
        //     return [event.pageX, event.pageY];
        // },

    });

});
