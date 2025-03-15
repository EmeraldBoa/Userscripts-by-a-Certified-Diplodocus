// ==UserScript==
// @name         Whofic forward/back buttons
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.1
// @description  Add first/last and forward/back buttons next to the chapter selector.
// @author       CertifiedDiplodocus
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @match        https://www.whofic.com/viewstory.php?*
// @icon         https://www.whofic.com/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

/* eslint-env jquery */

(function() {
    'use strict';

    GM_addStyle (`
    .chapterButtonLeft, .chapterButtonRight {
        border-radius: 4px;
        background-color: #e9e9ed;
        color: black;
        border: 1px solid grey;
        text-align: center;
        font-family: "PT Sans", Helvetica, Arial, sans-serif;
        font-size: 0.9rem;
        padding: 0px 10px;
        cursor: pointer;
        margin-bottom: 20px
    }

    .chapterButtonLeft:hover, .chapterButtonRight:hover {
        background-color: lightgrey;
    }

    .chapterButtonLeft:active, .chapterButtonRight:active {
        background-color: grey;
    }

    .chapterButtonLeft {
        margin-left: 0;
        margin-right: 5px;
    }

    .chapterButtonRight {
        margin-left: 5px;
        margin-right: 0;
    }

    `);

    let selectorForm = document.getElementsByName('jump');

    // Split off the chapter number from the URL
    //     (https://www.whofic.com/viewstory.php?sid=7495&textsize=0&chapter=1) OR ("...chapter=1#)
    let storyURL = window.location.href.split("chapter=");
    let partialURL = storyURL[0] + "chapter=";
    let currentChapter = Number(storyURL[1].replace("#",""));
    let lastChapter = document.getElementsByClassName('textbox')[0].options.length;

    // Create buttons for both the top (i=0) and bottom (i=1) of the page.
    let firstChp = [], lastChp = [], prevChp = [], nextChp = [];
    for (let i = 0; i<2; i++) {

        // Don't create prev/first buttons on Chapter 1, and vice versa.
        if (currentChapter != 1) {
            prevChp[i] = createButton('‹', 'left', 'prevChpBtn'); // create the inner buttons before the outer ones!
            firstChp[i] = createButton('«', 'left', 'firstChpBtn');
        }
        if (currentChapter != lastChapter) {
            nextChp[i] = createButton('›', 'right', 'nextChpBtn', i);
            lastChp[i] = createButton('»', 'right', 'lastChpBtn', i);
        }
    }

    $('.prevChpBtn').click(function () {location.href = partialURL + (currentChapter-1)});
    $('.firstChpBtn').click(function () {location.href = partialURL + "1"});
    $('.nextChpBtn').click(function () {location.href = partialURL + (currentChapter+1)});
    $('.lastChpBtn').click(function () {location.href = partialURL + lastChapter});

    // Places buttons to the left and right of the chapter selector
    function createButton(buttonText, relativePosition, buttonClass, buttonSet) {
        let buttonVariable = document.createElement("button");
        buttonVariable.type = "button";
        buttonVariable.classList.add(buttonClass);
        buttonVariable.textContent = buttonText;
        switch(relativePosition) {
            case "left":
                buttonVariable.classList.add("chapterButtonLeft");
                selectorForm[buttonSet].prepend(buttonVariable)
                break;
            case "right":
                buttonVariable.classList.add("chapterButtonRight");
                selectorForm[buttonSet].append(buttonVariable)
        };
        return buttonVariable;
    }

})();