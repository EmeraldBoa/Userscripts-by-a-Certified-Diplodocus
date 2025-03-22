// ==UserScript==
// @name         📋 Copy SERIES
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  copies story data from AO3 for pasting into MS Access
// @author       CertifiedDiplodocus
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @match        http*://archiveofourown.org/series/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

/* eslint-env jquery */

this.$ = this.jQuery = jQuery.noConflict(true); // Prevent conflict with website JQuery libraries (on FFN specifically)

//TO DO: Do I need jquery ui? Does FFN have jquery?

(function() {
    'use strict';

    var stories = new Array();
    let storyData = ''
    let seriesInfo = ''

    // set variables for work page or bookmark
    if (window.location.href.match(/archiveofourown\.org\/series/i)) {
        const series = {
            Title: $('h2.heading').text().trim(),
            Link: window.location.href,
            Summary: $('.series.meta.group .userstuff:eq(0)').html().trim(),
            //iterate through stories
        }
        cleanStory(series);
        seriesInfo = propertiesAndValues(series, "=", "; ")
        storyData = 'Series = {' + seriesInfo + '};\n\n';

        $('li.work').each(function(i) {
            var item = $(this)

            stories[i] = new story;
            stories[i] = {
                Title:  item.find('h4.heading a').first().text().trim(),
                Link: 'https://archiveofourown.org' + item.find('div.header h4.heading a').first().attr('href'),
                Author: item.find('a[rel="author"]').text().trim(),
                Summary: item.find('.summary').html().trim(),
                Wordcount: item.find('dd.words').text().trim(),
                IsComplete: isAO3FicComplete(item.find('dd.chapters').text().trim()), //return boolean
                SeriesName: item.find('ul.series li a').text().trim(),
                SeriesPosition: getAO3SeriesPos(item.find('ul.series li strong').text().trim())
            };
            cleanStory(stories[i]);
            let storyInfo = propertiesAndValues(stories[i], "=", "; ");
            storyData = storyData + 'Story' + i + ' = {' + storyInfo + '}; \n\n';

        });

        // Add copy buttons at top of page
        jQuery('div#main .navigation.actions').append('<li class="copy_for_AccessDB" onmouseover="" style="cursor: pointer;"><a>&#128203;</a></li>');

    };

    // Copy story data to Access (format: "title=sometitle; author=someauthor; ...")
    jQuery('.copy_for_AccessDB').click(function() {
        //        alert(storyData); //                              uncomment for popup summary
        copyToClipboard(storyData);
        tempAlert('Copied',1500)

    });


    // CODE PENDING -----------------------------------------------------------------

    // to do next: find a way to make a format switcher for the button
    // OR create a second script which can be activated to switch to Markdown

    // FORMATS
    let formattedOutput
    switch($('#formatSelector').val()) {
        case 'Access DB':
            formattedOutput = [story.Title, story.Link, story.Author, story.Summary, story.Wordcount].join('||')
            break;
        case 'Markdown':
            formattedOutput = '[*' + story.Title + '*](' + story.Link + '), by **' + story.Author + '** (' + story.Wordcount + ' words)\n\n' +
                '>' + story.Summary + '\n\n';
            break;
    }

    // Ctrl+click functionality [https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/ctrlKey]
    let log = document.querySelector('.copy_for_AccessDB');
    document.addEventListener('click', logKey);

    function logKey(e) {
        //log.textContent = `The ctrl key is pressed: ${e.ctrlKey}`; //Uncomment to test if the function works: should change the text of the buttons with class .copy_for_AccessDB

        //open settings dialog
    }

    // FUNCTIONS -----------------------------------------------------------------------------

    function story(Title, Link, Author, Summary){
        story.Title = Title
        story.Link = Link
        story.Author = Author
        story.Summary = Summary
    }

    function cleanStory(storyObj) {
        storyObj.Summary = storyObj.Summary.replace(/<br\/*>/gi,"</p><p>") //     - replace line breaks with paragraphs
            .replace(/<\/*blockquote>|^<p><\/p>|<p><\/p>$/gi,"") //               - delete blockquotes and blank start/end paragraphs
            .replace(/(?!^)<p>(?!<)/gi,"<p>&nbsp;&nbsp;&nbsp;&nbsp;") //          - add four-space indent after <p>, excluding the first and blank paragraphs
            .replace(/>\s+</g, "><"); //                                          - clean whitespace between HTML tags
       storyObj.Link = storyObj.Link.replace(/\?.+/,""); //                       - delete comments, bookmark info etc
       if('WordCount' in storyObj) {
           storyObj.Wordcount = storyObj.Wordcount.replace(/,/gi, "") //          - remove any decimal commas in wordcount
       };
    }

    function nz(myVariable) {
        if (typeof myVariable === 'undefined') {
            return ''
        } else { return myVariable }
    }

    function propertiesAndValues(storyObj, assignChar, separator) {
        return Object
            .keys(storyObj)
            .map(function(k) {return k + assignChar + storyObj[k] }).join(separator);
    }

    // AO3 chapter format is "3/?", "31/31", "3/10"... If chapters written = total chapters, the fic is complete. Outputs "y" or "n".
    // input: "n/n" where n is a number
    function isAO3FicComplete(ao3ChapterCount) {
        ao3ChapterCount = ao3ChapterCount.split("/")
        let chaptersWritten = ao3ChapterCount[0]
        let chaptersTotal = ao3ChapterCount[1]
        //return chaptersWritten==chaptersTotal ? "y" : "n";
        return chaptersWritten==chaptersTotal;
    }

    // Return position in series
    // input: "Part n of [seriesname]". output: "n"
    function getAO3SeriesPos(ao3SeriesInfo) {
        return ao3SeriesInfo
            .replace(/^Part /gi,"")
            .replace(/ .+/,""); //     remove everything after the second space
    }

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
        var elem = document.createElement("div");
        elem.setAttribute("style","position:fixed;top:50%;left:45%;background-color:blanchedalmond;font-size:200%;" +
                          "padding-left:20px;padding-right:20px;padding-top:10px;padding-bottom:10px");
        // "position: fixed" -> relative to the browser window
        // "position: absolute" -> relative to the document (or nearest parent)

        elem.innerHTML = msg;
        elem.id = 'dialog';
        setTimeout(function(){
            elem.parentNode.removeChild(elem);
        },duration);
        document.body.appendChild(elem);
    }

})();
