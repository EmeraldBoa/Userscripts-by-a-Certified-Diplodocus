// ==UserScript==
// @name         📋 Copy story data
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  copies story data from AO3/FFN for pasting into MS Access or markdown (reddit)
// @author       CertifiedDiplodocus
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @match        http*://archiveofourown.org/*
// @match        http*://www.fanfiction.net/s/*
// @exclude      /^https?:\/\/archiveofourown\.org\/(?!(works|bookmarks|chapters)\/[0-9]).*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

/* eslint-env jquery */

this.$ = this.jQuery = jQuery.noConflict(true); // Prevent conflict with website JQuery libraries (on FFN specifically)

// TO DOs
//     [ ] check if jquery-ui is actually being used. Can I use something else? AO3 doesn't load it. HTML5 instead? // FIX
//     [ ] ctrl+click on button to show dropdown (simpler: modal dialog w/ dropdown?) // MAYBE
//     [ ] choose and remember format (reddit, access, other)
//     [ ] when format changes, change button icon (copy / reddit)
//     [ ] title text on button "Current format: [formatName]. Ctrl + click to change settings"
//
// !BUG:


(function() {
    'use strict';
    let story

    // set variables for work page or bookmark
    if (window.location.href.match(/archiveofourown\.org\/(works|chapters)/i)) {

        // End script if we're not on the first chapter, as there's no summary. (Perhaps allow user to go to first chapter, then copy?)
        if (jQuery('.chapter.previous').length) {return;}

        story = {
            Title: $('h2.title').text().trim(),
            Link: 'https://archiveofourown.org' + $('.mark a').attr('href').replace('/mark_for_later',''), //get work url from Mark for Later button (even when on a deprecated "chapters/..." url). NOTE: Share button is hidden in private works!
            Author: $('h3.byline.heading').text().trim(),
            Summary: nz($('div.preface .summary .userstuff').html()).trim(), //if there is no summary, $(...).html() will return UNDEFINED. Return null string instead
            Wordcount: $('dd.words').text().trim(),
            IsComplete: isAO3FicComplete($('dd.chapters').text().trim()), //return 'y'/'n'
            SeriesName: $('dd.series .position a:eq(0)').text().trim(),
            SeriesPosition: getAO3SeriesPos($('dd.series .position:eq(0)').text().trim())
        }

        if(typeof story.Summary === "undefined") {console.log('no summary')};
        console.log($('dd.series .position a:eq(0)').text())

        // Add copy buttons at top and bottom of page
        jQuery('ul.work').append('<li class="copy_for_AccessDB" onmouseover="" style="cursor: pointer;"><a>&#128203;</a></li>');
        jQuery('.feedback ul.actions:eq(0)').prepend('<li class="copy_for_AccessDB" onmouseover="" style="cursor: pointer;"><a>&#128203;</a></li>');

        // Add reddit copy buttons
        jQuery('ul.work').append('<li class="copy_for_Reddit" onmouseover="" style="cursor: pointer;"><a><img src="https://www.reddit.com/favicon.ico" height="18"></a></li>');
        jQuery('.feedback ul.actions:eq(0)').prepend('<li class="copy_for_Reddit" onmouseover="" style="cursor: pointer;"><a><img src="https://www.reddit.com/favicon.ico" height="18"></a></li>');


    } else if (window.location.href.match(/archiveofourown\.org\/bookmarks/i)) {
        story = {
            Title: $('div.header h4.heading a').first().text().trim(),
            Link: 'https://archiveofourown.org' + $('div.header h4.heading a').first().attr('href'),
            Author: $('a[rel="author"]').text().trim(),
            Summary: $('.summary').html().trim(),
            Wordcount: $('dd.words').text().trim(),
            IsComplete: isAO3FicComplete($('dd.chapters').text().trim()), //return boolean
            SeriesName: $('ul.series li a').text().trim(),
            SeriesPosition: getAO3SeriesPos($('ul.series li strong').text().trim())
        }

        // Add copy button
        jQuery('div.own.user.module.group ul.actions').append('<li class="copy_for_AccessDB" onmouseover="" style="cursor: pointer;"><a>&#128203;</a></li>');

        // Add reddit copy buttons
        jQuery('div.own.user.module.group ul.actions').append('<li class="copy_for_Reddit" onmouseover="" style="cursor: pointer;"><a><img src="https://www.reddit.com/favicon.ico" height="18"></a></li>');


    } else if (window.location.href.match(/archiveofourown\.org\/series/i)) {
        const series = {
            Title: '',
            SeriesLink: '',
            Summary: '',
            //iterate through stories
        }

        console.log('test');
        var listItems = $('ul.series.work.index.group');
        listItems.each(function(idx, li) {
            var product = $(li);
            console.log(product);
            // and the rest of your code
        });
        return;
/*         jQuery('ul.series.work.index.group').each()(function() {
            let $series = $(this);
            // iterate through fandoms, check against list, then highlight and/or bold
            let storyCount = jQuery('li').length
            for (let i = 0; i < storyCount; i++){
                console.log(jQuery('h4.heading').text().trim())
            };
            // for (var i = 0; i<fandomsToHighlight.length; i++) {
            //     console.log
            //     }
            // }


        }); */

        } else if (window.location.href.match(/fanfiction\.net\/s\//i)) {
            story = {
                Title: $('#profile_top b.xcontrast_txt').text(),
                Link: window.location.href,
                Author: $('#profile_top a.xcontrast_txt[href^="/u/"]').text(),
                Summary: $('#profile_top div.xcontrast_txt').text(),
                // Wordcount and status are mushed together in one string (thanks, FFNet). Extract & clean with regex
                Wordcount: $('#profile_top span.xgray').text()
                .replace(/.*(Words: )([,\d]+).*/i, "$2"),
                IsComplete: /Status\: Complete/.test($('#profile_top span.xgray').text()) //return boolean
            }

            // Add copy buttons at top and bottom of page (after "favourite"). [https://api.jquery.com/after/]
            jQuery('div#profile_top').prepend('<button class="btn pull-right copy_for_AccessDB" type="button">&#128203;</button>');
            jQuery('div.lc td').first().append('<button class="btn copy_for_AccessDB" type="button">&#128203;</button>');

            // Add reddit copy buttons
            jQuery('div#profile_top').prepend('<button class="btn pull-right copy_for_Reddit" type="button"><img src="https://www.reddit.com/favicon.ico" height="18"></button>');
            jQuery('div.lc td').first().append('<button class="btn copy_for_Reddit" type="button"><img src="https://www.reddit.com/favicon.ico" height="18"></button>');
        };

    // A little cleaning (AO3 only!)
    story.Summary = story.Summary.replace(/<br\/*>/gi,"</p><p>") //     - replace line breaks with paragraphs
        .replace(/<\/*blockquote>|^<p><\/p>|<p><\/p>$/gi,"") //         - delete blockquotes and blank start/end paragraphs
        .replace(/(?!^)<p>(?!<)/gi,"<p>&nbsp;&nbsp;&nbsp;&nbsp;") //    - add four-space indent after <p>, excluding the first and blank paragraphs
        .replace(/>\s+</g, "><"); //                                    - clean whitespace between HTML tags
    story.Wordcount = story.Wordcount.replace(/,/gi, ""); //            - remove any decimal commas in wordcount

    // Clean up AO3 and FFN links by deleting text after "?" (links to comments, cloudflare, etc)
    // CAREFUL: this can break links from other domains (e.g. whofic stories have viewstory?sid=###)
    story.Link = story.Link.replace(/\?.+/,"")

    // Copy story data to Access (format: "title=sometitle; author=someauthor; ...")
    jQuery('.copy_for_AccessDB').click(function() {
        let storyData
        storyData = propertiesAndValues(story, "=", "; ")
        //        alert(storyData); //                              uncomment for popup summary
        copyToClipboard(storyData);
        tempAlert('Copied',1500)

    });

    // Copy story data to Reddit (format: markdown)
    jQuery('.copy_for_Reddit').click(function() {
        story.Summary = story.Summary
            .replace(/<\/p><p>/gi,"\n>\n>") //     html to markdown
            .replace(/<\/?p>/gi,"")
            .replace(/&nbsp;/gi,"")
            .replace(/<(\/)?(i|em)>/gi,"*")
            .replace(/<(\/)?b>/gi,"**")
        copyToClipboard('[*' + story.Title + '*](' + story.Link + '), by **' + story.Author + '** (' + story.Wordcount + ' words)\n\n' +
                        '>' + story.Summary + '\n\n')
        tempAlert('Copied to markdown',1500)
    })

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
