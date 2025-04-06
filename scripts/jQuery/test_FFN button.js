// ==UserScript==
// @name         test_FFN copier
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  test adding a button to ffnet story
// @author       You
// @match        https://www.fanfiction.net/s/*
// @icon         https://www.google.com/s2/favicons?domain=fanfiction.net
// @grant        none
// ==/UserScript==

/* eslint-env jquery */

// MAYBE delete script (test is done)

(function() {
    'use strict';

    let storyTitle, storyLink, storyAuthor, storySummary, storyWordcount, storyIsComplete;

    storyTitle = $('#profile_top b.xcontrast_txt').text();
    storyLink = window.location.href;
    storyAuthor = $('#profile_top a.xcontrast_txt[href^="/u/"]').text();
    storySummary = $('#profile_top div.xcontrast_txt').text();
    let storyDetailsFFN = $('#profile_top span.xgray').text();
    storyWordcount = storyDetailsFFN.replace(/.*(Words: )([,\d]+).*/i, "$2"); // get the word count from the details string
    storyIsComplete = /Status\: Complete/.test(storyDetailsFFN) ? "y" : "n";

    // test button on ffnet
    let whereButton = 'div#profile_top';
    jQuery(whereButton).prepend('<button class="btn pull-right copy_for_AccessDB" type="button">&#128203;</button>');

    jQuery('.copy_for_AccessDB').click(function() {
        alert([storyTitle, storyLink, storyAuthor, storySummary, storyWordcount, storyIsComplete].join('||')); //uncomment for popup summary
    });

})();

/*    } else if (window.location.href.match(/fanfiction\.net\/s\//i)) {
        storyTitle
        storyLink
        storyAuthor
        storySummary
        storyWordcount
        storyIsComplete
*/

// div[href]: matches all div elements with the href attribute
// div[href^=google]: matches div elements whose href starts with "google"