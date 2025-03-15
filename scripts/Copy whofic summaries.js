// ==UserScript==
// @name         📋🟦 Copy whofic data
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.1
// @description  Manually copy story info from whofic.com, formatted for Access or Reddit.
// @author       CertifiedDiplodocus
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @match        https://www.whofic.com/*
// @exclude      /^https?:\/\/www\.whofic\.com\/(?!(viewuser|series|titles)\.php).*/
// @icon         https://www.whofic.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

/* eslint-env jquery */

// *********************************************************************************
// Inserts a copy button before every work on the page. When a button is clicked,  *
// it copies the summary data (title, author, link...) of that particular story.   *
// A dropdown menu (top right) lets you select the format of the copied text:      *
     // title || link || author...  for Access DB                                  *
     // markdown                    for Reddit                                     *
// *********************************************************************************

// ****************** TO DO ***************************************************************
// - expand to work on search pages / check that nothing breaks when page has no stories (i.e. that the .storyBlock class isn't recycled)
// *****************************************************************************************

(function() {
    'use strict';

    GM_addStyle (`
        #floatRight {float: right}
    `);

    let storyAll;

    //--------------------------------------------------------------------------------------------------
    // Create dropdown to select formats
    // https://stackoverflow.com/questions/17001961/how-to-add-drop-down-list-select-programmatically

    // Create, format and append select list (and its label).
    let copyFormatDiv = document.createElement("div");
    copyFormatDiv.id = "floatRight";
    copyFormatDiv.innerHTML = '<span><b>Copy format: </b></span>';

    let selectWhatFormat = document.createElement("select");
    selectWhatFormat.id = "formatSelector";

    if (window.location.href.match(/whofic.com\/series.php/)) {
        document.getElementsByClassName('jumpmenu')[0]
            .appendChild(copyFormatDiv);
        copyFormatDiv.appendChild(selectWhatFormat);
    } else {
         document.getElementsByClassName('sectionheader')[0]
            .appendChild(copyFormatDiv);
        copyFormatDiv.appendChild(selectWhatFormat);
    }

    // Create and append the options.
    let arrFormat = ["Access DB","Markdown"];
    for (let i = 0; i < arrFormat.length; i++) {
        let formatOption = document.createElement("option");
        formatOption.value = arrFormat[i];
        formatOption.text = arrFormat[i];
        selectWhatFormat.appendChild(formatOption);
    }

    // Set dropdown to saved value, or default to "Access DB" if no saved value exists.
    $('#formatSelector').val(GM_getValue('lastFormatSelected',"Access DB"))

    // On change, save the new value
    $('#formatSelector').on('change', function() {
        GM_setValue('lastFormatSelected', this.value);
    });

    //--------------------------------------------------------------------------------------------------
    // Insert copy buttons and give each a unique identifier (copyBtn_0,1,2...)
    let storyCount = jQuery('.storyBlock').length
    for (let i = 0; i < storyCount; i++){
        jQuery('.storyBlock:eq(' + i + ') p:eq(0)')
            .prepend('<button class="copy_for_AccessDB" type="button" id="copyBtn_' + i + '">&#128203;</button>  ');
    }

    // When a button is clicked, check its ID, then copy the corresponding storyBlock
    jQuery('.copy_for_AccessDB').click(function() {
        let i = this.id
        i = i.slice(8) // strip "copyBtn_", leaving the ID number

        /*
        .find([selectors])    all descendants
        .storyBlock:eq(n)     to select the nth story in the list (start counting at 0)
        p:eq(0)               select the first paragraph tag
        p:eq(0) a:eq(1)       select the second <a> from the first <p>
        */

        // Read the current storyBlock element, and get the remaining variables from there without requerying.
        let storyObject = $('.storyBlock:eq(' + i + ')');
        storyAll = storyObject.find('p:eq(0)').text().replace(/[ ]*\[Reviews - [0-9]+\]/,''); // just title, author and summary

        const thisStory = {
            Title: storyObject.find('p:eq(0) a:eq(0)').text(),
            Link: 'https://www.whofic.com/' + storyObject.find('p:eq(0) a:eq(0)').attr('href'),
            Author: storyObject.find('p:eq(0) a:eq(1)').text(),
            Summary: storyObject.find('p:eq(0)').html() //                 The summary is after <br>, so fetch the entire text, title and all,
                .replace(/.+<br>\n/,'').replace(/[\s]{2,}/,' ').trim(), // then remove everything above the break.

            Wordcount: storyObject.find('.list-inline:eq(1) li:eq(4)').text().replace('Word count: ',''),
            IsComplete: storyObject.find('.list-inline:eq(1) li:eq(3)').text().replace('Completed: ','').charAt(0), // outputs "Y / N" (uppercase!)
        };
        if (window.location.href.match(/whofic.com\/series.php/)) {
            thisStory.SeriesName = jQuery('div#pagetitle').html()
                 .replace(/ by <a.+/,'');
            thisStory.SeriesPosition = parseInt(i) + 1; //                 Get the series position from the order on the page. (i starts at 0)
        }

        // Copy to clipboard in the selected format
        let formattedOutput
        switch($('#formatSelector').val()) {
            case 'Access DB':
                formattedOutput = propertiesAndValues(thisStory, '=', ';')
                break;
            case 'Markdown':
                formattedOutput = '[*' + thisStory.Title + '*](' + thisStory.Link + '), by **' + thisStory.Author + '** (' + thisStory.Wordcount + ' words)\n\n' +
                    '>' + thisStory.Summary + '\n\n';
                break;
        }

//        alert('element' + i + ':\n\n' + Object.values(thisStory).join('\n'));
        copyToClipboard(formattedOutput);
        tempAlert('Copied!',1500);

    });

    // FUNCTIONS FROM THE AO3 SCRIPT "copy story data". MAKE ALL CHANGES THERE.-------------------------

    //https://stackoverflow.com/questions/33855641/copy-output-of-a-javascript-variable-to-the-clipboard
    function copyToClipboard(text) {
        var dummy = document.createElement("textarea");
        // to avoid breaking orgain page when copying more words
        // cant copy when adding below this code
        // dummy.style.display = 'none'
        document.body.appendChild(dummy);
        //Be careful if you use textarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }

    function tempAlert(msg,duration) {
        var el = document.createElement("div");
        el.setAttribute("style","position:fixed;top:50%;left:45%;background-color:blanchedalmond;font-size:200%;" +
                        "padding-left:20px;padding-right:20px;padding-top:10px;padding-bottom:10px");
        // "position: fixed" -> relative to the browser window
        // "position: absolute" -> relative to the document (or nearest parent)

        el.innerHTML = msg;
        el.id = 'dialog';
        setTimeout(function(){
            el.parentNode.removeChild(el);
        },duration);
        document.body.appendChild(el);
    }

    function propertiesAndValues(storyObj, assignChar, separator) {
    return Object
        .keys(storyObj)
        .map(function(k) {return k + assignChar + storyObj[k] }).join(separator);
    }

})();