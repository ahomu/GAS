#gas.js - Google Analytics Shorthands

"gas.js" given html driven tracking support.

**this is beta!**

##Feature

+  You can use a custom data attribute in the event tracking.
+  Auto track the outbound link as an event.
+  Maybe works on IE6~, Fx3.6~, Safari, Chrome, Opera
+  Automatically load the "ga.js". (throuth script element)
+  2kb to minimize. (without ie compatibility then 1.7kb)
+  Not dependent on any library.

##Usage

hmm...

###Put

    <head>
    ...
    <script src="gas.min.js"></script>
    <script>new GAS('UA-xxxxxxx-xx');</script>
    ...
    </head>

###Event tracking

    // original
    <button onclick="_gaq.push(['_trackEvent', 'category', 'done', 'piyopiyo'])">Done</button>

    // gas.js
    <button data-event="category" data-action="done" data-label="piyopiyo">Done</button>

###Fake pageview tracking

    // original
    <a href="#hogehoge" onclick="_gaq.push(['_trackPageview', '/fake_path.html'])">Fake page</a>

    // gas.js
    <a href="#hogehoge" data-pv="/fake_path.html">Fake page</a>

###Outbound link

    <!-- location.hostname === 'piyo.example.com' -->

    <a href="http://example.com">External link</a>

###API

    var gas = new GAS('UA-xxxxxxx-xx');

    // track as a pageview
    gas.trackPageview('/your_optional_path.html');

    // track as an event
    gas.trackEvent('MusicPlayer', 'start', 'hogehoge');

###for IE

This is anchor element.

    <a href="#" id="clickable" data-event="foo" data-action="bar">Action</a>

For example, bind a click event using jQuery.

    $('#clickable').bind('click', function() {
        ...

        return false;
    });

Then click event does not follow the 'document' and cannot event tracking. on Internet Explorer 6~8.

Solve this problem embed the following script, and class 'gas_prior' add to anchor element.

    <script type="text/javascript">
    var gas = new GAS('UA-xxxxxxx-x');
    jQuery(function() {
        $('#clickable').bind('click', function(e) {
            return false;
        });

        // need DOM has been loaded
        gas.priorityOver('gas_prior');
    });
    </script>
    <a href="#" id="clickable" class="gas_prior" data-event="foo" data-action="bar">Action</a>

gas.priorityOver method re-binding event to each element with class 'gas_prior'.

##ToDo

<small>えいごあやしいすみませんすみません</small>

+  popstate, hashchange時のトラッキングサポート
+  イベントトラックのsyncサポート（asyncでリクエストが発生しないことがある）
+  子要素clickへの反応（parentNodeを辿ってdata-xxxを探索する）

↓のようなdata属性の付与の仕方に対応したり

    <div data-event="MusicPlayer">
        <button data-action="start">Start</button>
        <button data-action="stop">Stop</button>
        <button data-action="favorite">Fav</button>
    </div>

##License

gas.js is licensed under the MIT licnese.
