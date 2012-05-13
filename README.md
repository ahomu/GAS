#gas.js - Google Analytics Shorthands

"gas.js" given html driven tracking support.

**this is beta!**

##Feature

+  You can use a custom data attribute in the event tracking.
+  Auto track the outbound link as an event.
+  Maybe works on IE6~, Fx3.6~, Safari, Chrome, Opera
+  Automatically load the "ga.js". (throuth script element)
+  1.5kb to minimize.
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

    <button data-event="category" data-action="done" data-label="piyopiyo">Done</button>


###Fake pageview tracking

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

##???

<small>えいごあやしいすみませんすみません</small>

+  popstate, hashchange時のトラッキングサポート
+  イベントトラックのsyncサポート（asyncでリクエストが発生しないことがある）
+  子要素clickへの反応（parentNodeを辿ってdata-xxxを探索する）

↓のようなdata属性の付与の仕方に対応したり

    <div id="MusicPlayer" data-event="MusicPlayer">
        <button data-action="start">Start</button>
        <button data-action="stop">Stop</button>
        <button data-action="favorite">Fav</button>
    </div>

##License

gas.js is licensed under the MIT licnese.
