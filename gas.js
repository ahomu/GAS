/**
 * gas.js - Google Analytics Shorthands
 *
 * Copyright (c) 2012 Ayumu Sato ( http://havelog.ayumusato.com )
 *
 * Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 *
 * @version 0.3
 */
(function(win, doc, loc) {

    "use strict";

    /**
     * variables
     */
    var tagName = 'script', gatSrc, script,

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
            // default output to console. when ie678 then alert.
            debug           : false,
            // if enable popup-block then press shift|meta|ctrl with clicking for opening new window is disalbed.
            delayOutbound   : true,

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
    win._gaq = win._gaq || [];
    win._gat || (
        gatSrc       = doc.createElement(tagName),
        gatSrc.type  = 'text/javascript',
        gatSrc.async = true,
        // @see http://mathiasbynens.be/notes/async-analytics-snippet#comment-29
        gatSrc.src   = ('https:' === loc.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js',
        script       = doc.getElementsByTagName(tagName)[0],
        script.parentNode.insertBefore(gatSrc, script)
    );

    /**
     * gas
     */
    win.GAS = GAShorthands;
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
        win._gaq[STRING_push](['_setAccount', profile]);

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
        win._gaq[STRING_push]([STRING_trackPageview, path]);
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
        win._gaq[STRING_push]([STRING_trackEvent, category, action, opt_label, opt_value, opt_nointeraction]);
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
            href, path, open, w;

        // text node? then elm is parentNode
        elm.nodeType === 3 && (elm = elm.parentNode);

        // fake pageview
        (path = elm[STRING_getAttribute](options.attrPageview)) && this.trackPageview(path);

        // event ( data-event & data-action are required. )
        // @ie-
        !elm[FLAG_PRIOR_INITED] &&
        // -ie@
        this.detectTrackEvent(elm);

        // outbound
        if (options.trackOutbound && elm.tagName === 'A') {
            href = elm.href;
            if (href && elm.hostname !== loc.hostname) {
                // category = gas:Outbound, action = href(full), label = href(hostname only)
                this.trackEvent('gas:Outbound', href, href.match(/\/\/([^\/]+)/)[1]);

                // more accuracy
                if (options.delayOutbound) {
                    // prevent anchor link
                    event.preventDefault ? event.preventDefault()
                                         : (event.returnValue = false);

                    // @todo issue: when click with ctrl-key on ie7-8, then cannot captuaring to click-event.
                    // want to new window|tab?
                    open = (event.ctrlKey || event.shiftKey || event.metaKey || elm.target === '_blank');
                    setTimeout(function() {
                        if (open && (w = win.open())) {
                            w.location.href = href;
                        } else {
                            loc.href = href;
                        }
                    }, 100);
                }
            }
        }
    }

    /**
     * set many queues from array
     *
     * @param {Array} array
     */
    function _addSetArrayIntoQueue(array) {
        var queue = win._gaq;
        queue.length === void 0 ? queue[STRING_push].apply(queue, array)
                                : Array[STRING_prototype][STRING_push].apply(queue, array);
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