/**
 * gas.js - Google Analytics Shorthands
 *
 * Copyright (c) 2012 Ayumu Sato ( http://havelog.ayumusato.com )
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 *
 * @version 0.1
 */
(function(win, doc, loc) {

    "use strict";

    /**
     * variables
     */
    var QUEUE = win._gaq = [],
        TRACK = win._gat,
        tg    = 'script',

        STRING_trackPageview = '_trackPageview',
        STRING_trackEvent    = '_trackEvent',
        STRING_push          = 'push',
        STRING_prototype     = 'prototype',
        STRING_getAttribute  = 'getAttribute',
        STRING_addEventListener = 'addEventListener',

        FLAG_ADL             = STRING_addEventListener in doc,
        // @ie-
        FLAG_PRIOR_INITED    = '__gas_prior',
        // -ie@

        // default settings
        DEFAULTS  = {
            debug           : false,

            trackOutbound   : true,
            trackCurrentPv  : true,

            attrPageview    : 'data-pv',
            attrEvent       : 'data-event',
            attrAction      : 'data-action',
            attrLabel       : 'data-label',

            preQueues       : [
                /*
                ['_addOrganic', 'excite', 'search'],
                ['_addOrganic', 'hatena', 'word'],
                ['_addOrganic', 'naver.jp', 'q', true]
                */
            ]
        };

    // @ie-
    if (!('console' in win)) {
        win.console = {log: function(a,b,c,d,e,f) {
            alert([a,b,c,d,e,f].join(' '));
        }};
    }
    // -ie@

    /**
     * Opt-Out flag
     */
    if (doc.cookie.indexOf('__gas=ioo') !== -1) {
        win._gaUserPrefs = {
            ioo: function() {
                return 1;
            }
        };
    }

    /**
     * Load Tracker
     */
    TRACK || (
        TRACK       = doc.createElement(tg),
        TRACK.type  = 'text/javascript',
        TRACK.async = true,
        // @see http://mathiasbynens.be/notes/async-analytics-snippet#comment-29
        TRACK.src   = ('https:' === loc.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js',
        TRACK.onload= function() { QUEUE = win._gaq; },
        tg          = doc.getElementsByTagName(tg)[0],
        tg.parentNode.insertBefore(TRACK, tg)
    );

    /**
     * gas
     */
    win.GAS  = GAShorthands;
    _shake(GAShorthands[STRING_prototype], {
        profile  : null,
        options  : null,
        trackPageview    : gasTrackPageview,
        trackEvent       : gasTrackEvent,
        // @ie-
        priorityOver     : gasInitPriorityOver,
        // -ie@
        detectTrackEvent : gasDetectTrackEvent
    });

    // =================================================================================================================

    /**
     * initialize
     *
     * @constructor
     * @param {String} profile
     */
    function GAShorthands(profile, specifies) {
        // override specified options
        var that    = this,
            options = that.options = _shake(DEFAULTS, specifies || {});

        // save profile
        that.profile = profile;

        // set account
        QUEUE[STRING_push](['_setAccount', profile]);

        // prepush
        _addSetArrayIntoQueue(options.preQueues);

        // track current pageview
        options.trackCurrentPv && that.trackPageview();

        // start observe anchor
        _addEvent(doc, 'click', function(event) {
            _observeElementClick.call(that, event);
        });
    }

    /**
     * track pageview
     *
     * @see https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration
     *
     * @param {String} [path]
     */
    function gasTrackPageview(path) {
        !!this.options.debug && console.log('gas:Pv', path || location.pathname);
        QUEUE[STRING_push]([STRING_trackPageview, path]);
    }

    /**
     * track event
     *
     * @see https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiEventTracking
     *
     * @param {String} category
     * @param {String} action
     * @param {String} [opt_label]
     * @param {String} [opt_value]
     * @param {String} [opt_nointeraction] "default value is false. if set true when event is not effect to bounce rate."
     */
    function gasTrackEvent(category, action, opt_label, opt_value, opt_nointeraction) {
        !!this.options.debug && console.log('gas:Event', category, action, opt_label, opt_value, opt_nointeraction);
        QUEUE[STRING_push]([STRING_trackEvent, category, action, opt_label, opt_value, opt_nointeraction]);
    }

    /**
     * tracking event priority over (IE678 only)
     */
    // @ie-
    function gasInitPriorityOver(clazz) {
        if (FLAG_ADL) {
            return;
        }
        // @todo issue: use querySelectorAll for IE8
        var that = this,
            elms = doc.getElementsByTagName('*'),
            evClass = ' ' + clazz + ' ',
            i = 0,
            elm;

        while (elm = elms[i++]) {
            if (!elm[FLAG_PRIOR_INITED] && elm.nodeType === 1 && (' ' + elm.className + ' ').indexOf(evClass) !== -1) {
                elm[FLAG_PRIOR_INITED] = true;
                _addEvent(elm, 'click', function(event) {
                    that.detectTrackEvent(event.target || event.srcElement);
                });
            }
        }
    }
    // -ie@

    /**
     * when element has an event tracking info, then return closure or tracking execute.
     *
     * @param {Element} elm
     */
    function gasDetectTrackEvent(elm) {
        var options  = this.options,
            category = elm[STRING_getAttribute](options.attrEvent),
            action   = elm[STRING_getAttribute](options.attrAction),
            label    = elm[STRING_getAttribute](options.attrLabel);

        if (category && action) {
            this.trackEvent(category, action, label);
        }
    }

    /**
     * observe element click
     *
     * @param {Object} event
     */
    function _observeElementClick(event) {
        var elm     = event.target || event.srcElement,
            options = this.options,
            href, path;

        // text node? then elm is parentNode
        elm.nodeType === 3 && (elm = elm.parentNode);

        // outbound
        if (options.trackOutbound && elm.tagName === 'A') {
            href = elm.href;
            if (href && elm.hostname !== loc.hostname) {
                // category = gas:Outbound, action = href(full), label = href(hostname only)
                this.trackEvent('gas:Outbound', href, href.match(/\/\/([^\/]+)/)[1]);
            }
        }

        // fake pageview
        (path = elm[STRING_getAttribute](options.attrPageview)) && this.trackPageview(path);

        // event ( data-event & data-action are required. )
        // @ie-
        !elm[FLAG_PRIOR_INITED] &&
        // -ie@
        this.detectTrackEvent(elm);
    }

    /**
     * set many queues from array
     *
     * @param {Array} array
     */
    function _addSetArrayIntoQueue(array) {
        QUEUE.length === void 0 ? QUEUE[STRING_push].apply(QUEUE, array)
                                : Array[STRING_prototype][STRING_push].apply(QUEUE, array);
    }

    /**
     * bind event evaluator
     *
     * @param {Element}  elm
     * @param {String}   type
     * @param {Function} evaluator
     */
    function _addEvent(elm, type, evaluator) {
        elm[FLAG_ADL ? STRING_addEventListener : 'attachEvent']((FLAG_ADL ? '' : 'on')+type, evaluator, true);
    }

    /**
     * object active merge
     *
     * @param {Object} a
     * @param {Object} b
     * @return {Object}
     */
    function _shake(a, b) {
        var k;
        for (k in b) {
            if (b.hasOwnProperty(k)) {
                (a[k] = b[k]);
            }
        }
        return a;
    }

})(window, document, location);