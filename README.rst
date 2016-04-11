.. image:: https://raw.githubusercontent.com/score-framework/py.doc/master/docs/score-banner.png
    :target: http://score-framework.org

`The SCORE Framework`_ is a collection of harmonized python and javascript
libraries for the development of large scale web projects. Powered by strg.at_.

.. _The SCORE Framework: http://score-framework.org
.. _strg.at: http://strg.at


************
score.slides
************

.. _js_slides:

Files
=====

This library contains:

- slides.js - for basic slider functionality
- default-slides-ui.js - for a basic interface definition
- default-slides-ui.css for the base style

Setup
=====

to create a new Slider we need some basic CSS to set the viewport width and height::

    #slides {
        height:480px;
        width: 640px;
    }

a little bit of HTML, the slide nodes must not be inside the #slides container::

    <div id="slides">
        <div class='slide'>
            <img src="http://lorempixel.com/640/480/people/1" />
        </div>
        <div class='slide'>
            <img src="http://lorempixel.com/640/480/people/2" />
        </div>
    </div>

and some JS::

    require(['lib/score/slides', 'default-slides-ui'], function(Slides, DefaultSlidesUI) {
        var slides = new Slides({
            'ui': DefaultSlidesUI,
            'ui-nodes': document.getElementsByClassName('slide'),
            'ui-node': document.getElementById('slides')
        });
        slides.on('transitionStart', function(state) {
            console.log('user interaction time to track a click', state);
        });
        slides.on('transitionComplete', function(state) {
            console.log('the transition is complete', state);
        });
    });

- all configurations prefixed with ui- and passed to Slides will be passed to the SlidesUI class.

Events
======

transitionStart
  trigger when the user transition is started, normaly when a user click next or previous slide

transitionComplete
  trigger when the transition is complete and the slider is in a stable state again.

DefaultSlideUI
==============

**parameters:**

ui-node
  a single node, this is where the slider will be rendered

ui-nodes
  a list of DOM nodes containing our slides


Custom SlideUI
==============

You can write your own SlidesUI class or extend the DefaultSlideUI.
If u write your own UI, following is required:

- UI.transition() this function return a bluebird Promise, and start the transition
- UI.$slides this variable contains the slides, as array or DOMNodeList.


License
=======

Copyright © 2015 STRG.AT GmbH, Vienna, Austria

All files in and beneath this directory are part of The SCORE Framework.
The SCORE Framework and all its parts are free software: you can redistribute
them and/or modify them under the terms of the GNU Lesser General Public
License version 3 as published by the Free Software Foundation which is in the
file named COPYING.LESSER.txt.

The SCORE Framework and all its parts are distributed without any WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. For more details see the GNU Lesser General Public License.

If you have not received a copy of the GNU Lesser General Public License see
http://www.gnu.org/licenses/.

The License-Agreement realised between you as Licensee and STRG.AT GmbH as
Licenser including the issue of its valid conclusion and its pre- and
post-contractual effects is governed by the laws of Austria. Any disputes
concerning this License-Agreement including the issue of its valid conclusion
and its pre- and post-contractual effects are exclusively decided by the
competent court, in whose district STRG.AT GmbH has its registered seat, at the
discretion of STRG.AT GmbH also the competent court, in whose district the
Licensee has his registered seat, an establishment or assets.
