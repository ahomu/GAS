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
        STRING_parentNode    = 'parentNode',
        STRING_indexOf       = 'indexOf',
        STRING_nodeType      = 'nodeType',
        STRING_hostname      = 'hostname',
        STRING_getElementsByClassName = 'getElementsByClassName',
        STRING_addEventListener       = 'addEventListener',

        FLAG_ADL = STRING_addEventListener in doc,

        DEFAULTS  = {
            trackOutbound      : true,
            trackCurrentPv     : true,

            // @todo issue: requires namespace? e.g, data-gas-xxx
            attrPageview     : 'data-pv',
            attrEvent        : 'data-event',
            attrAction       : 'data-action',
            attrLabel        : 'data-label',

            classPrior       : 'gas_prior',

            preQueues             : [
                /*
                ['_addOrganic', 'excite', 'search'],
                ['_addOrganic', 'hatena', 'word'],
                ['_addOrganic', 'naver.jp', 'q', true]
                */
            ]
        };

    /**
     * Opt-Out flag
     */
    if (doc.cookie[STRING_indexOf]('__gas=ioo') !== -1) {
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
        // @todo issue: each time referencing to win._gaq when stop to saving QUEUE variable?
        TRACK.onload= function() { QUEUE = win._gaq; },
        tg          = doc.getElementsByTagName(tg)[0],
        tg[STRING_parentNode].insertBefore(TRACK, tg)
    );

    /**
     * Adaptive getElementsByClassName
     */
    doc[STRING_getElementsByClassName] || (doc[STRING_getElementsByClassName] = function(clazz) {
        var elms = this.getElementsByTagName('*'),
            evClass = ' ' + clazz + ' ',
            i = 0,
            rv = [],
            elm;

        while (elm = elms[i++]) {
            if (elm[STRING_nodeType] === 1 && (' ' + elm.className + ' ')[STRING_indexOf](evClass) !== -1) {
                rv[STRING_push](elm);
            }
        }
        return rv;
    });

    /**
     * gas
     */
    win.GAS  = GAShorthands;
    _shake(GAShorthands[STRING_prototype], {
        profile  : null,
        options  : null,
        trackPageview : gasTrackPageview,
        trackEvent    : gasTrackEvent,
        priorityOver  : gasInitPriorityOver,
        raiseTrack    : gasRaiseTrackEvent
    });

    // =================================================================================================================

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
        _gasSetArrayIntoQueue(options.preQueues);

        // track current pageview
        options.trackCurrentPv && that.trackPageview();

        // start observe anchor
        _gasAddEvent(doc, 'click', function(event) {
            _gasObserveElementClick.call(that, event);
        });
    }

    /**
     * set many queues from array
     *
     * @param {Array} array
     */
    function _gasSetArrayIntoQueue(array) {
        QUEUE.length === void 0 ? QUEUE[STRING_push].apply(QUEUE, array)
                                : Array[STRING_prototype][STRING_push].apply(QUEUE, array);
    }

    /**
     * track pageview
     *
     * @see https://developers.google.com/analytics/devguides/collection/gajs/methods/gaJSApiBasicConfiguration
     *
     * @param {String} [path]
     */
    function gasTrackPageview(path) {
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
        QUEUE[STRING_push]([STRING_trackEvent, category, action, opt_label, opt_value, opt_nointeraction]);
    }

    /**
     * tracking event priority over
     */
    function gasInitPriorityOver() {
        var that = this,
            elms = doc[STRING_getElementsByClassName](that.options.classPrior),
            i = 0, elm;

        // set track event
        while (elm = elms[i++]) {
            if (elm.__gas_prior) {
                return;
            }
            elm.__gas_prior = true;
            _gasAddEvent(elm, 'click', function(e) {
                that.raiseTrack(e.target || e.srcElement);
            });
        }
    }

    /**
     * when element has an event tracking info, then return closure or tracking execute.
     *
     * @param {Element} elm
     * @return {Function|Boolean}
     */
    function gasRaiseTrackEvent(elm) {
        var that    = this,
            options = that.options,
            category, action, label;

        if ((category = elm[STRING_getAttribute](options.attrEvent)) && (action = elm[STRING_getAttribute](options.attrAction))) {
            label = elm[STRING_getAttribute](options.attrLabel);
            return that.trackEvent(category, action, label);
        }
        return false;
    }

    /**
     * observe element click
     *
     * @param {Object} event
     */
    function _gasObserveElementClick(event) {
        var that    = this,
            elm     = event.target || event.srcElement,
            options = that.options,
            href, path;

        // text node? then elm is parentNode
        elm[STRING_nodeType] === 3 && (elm = elm[STRING_parentNode]);

        // outbound
        if (options.trackOutbound && elm.tagName === 'A') {
            href = elm.href;
            if (href && elm[STRING_hostname] !== loc[STRING_hostname]) {
                // category = gas:Outbound, action = href(full), label = href(hostname only)
                that.trackEvent('gas:Outbound', href, href.match(/\/\/([^\/]+)/)[1]);
            }
        }

        // fake pageview
        (path = elm[STRING_getAttribute](options.attrPageview)) && that.trackPageview(path);

        // event ( data-event & data-action are required. )
        !elm.__gas_prior && that.raiseTrack(elm);
    }

    /**
     * bind event evaluator
     *
     * @param {Element}  elm
     * @param {String}   type
     * @param {Function} evaluator
     */
    function _gasAddEvent(elm, type, evaluator) {
        elm[FLAG_ADL ? STRING_addEventListener : 'attachEvent']((FLAG_ADL ? '' : 'on')+type, evaluator, false);
    }

})(window, document, location);