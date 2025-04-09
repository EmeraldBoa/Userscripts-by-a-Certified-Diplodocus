// ==UserScript==
// @name         📋 Copy story data
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  copies story data from AO3/FFN for pasting into MS Access or markdown (reddit)
// @author       CertifiedDiplodocus
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js //TODO does ffn have this?
// @require      http://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @match        http*://archiveofourown.org/*
// @match        http*://www.fanfiction.net/s/*
// @exclude      /^https?:\/\/archiveofourown\.org\/(?!(works|bookmarks|chapters)\/[0-9]).*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @license      GPL-3.0-or-later
// ==/UserScript==

/* eslint-env jquery */

this.$ = this.jQuery = jQuery.noConflict(true); // Prevent conflict with website JQuery libraries (on FFN specifically)

/* DONE:
    [x] replaced window.location.href with a variable

 TO DOs
     [x] replace long, repeated text in .append() .prepend()
            - what does jQuery need? Could I create & append an object? (YES)
     [ ] check if jquery-ui is actually being used. Can I use something else? AO3 doesn't load it. HTML5 instead? // FIX
     [ ] ctrl+click on button to show dropdown (simpler: modal dialog w/ dropdown?) // MAYBE
     [ ] choose and remember format (reddit, access, other)
     [ ] when format changes, change button icon (copy / reddit)
     [ ] title text on button "Current format: [formatName]. Ctrl + click to change settings"
     [ ] optionally (config setting), copy first n sentences of story if no summary exists

// !BUG:
----------------------------------------------------------------------------------------------------------------------
*/

(function () {
    'use strict'
    let story
    const currentURL = window.location.href
    const URLregex = {
        AO3: {
            work: /archiveofourown\.org\/(works|chapters)/i,
            bookmark: /archiveofourown\.org\/bookmarks/i,
            series: /archiveofourown\.org\/series/i,
        },
        FFN: {
            work: /fanfiction\.net\/s\//i,
        },
    }
    const copyTo = {
        access: {
            class: 'copy-for-AccessDB',
            icon: '&#128203;',
        },
        reddit: {
            class: 'copy-for-Reddit',
            icon: '<img src="https://www.reddit.com/favicon.ico">',
        },
    }
    const buttonType = {
        AO3: {
            el: 'li',
            class: 'AO3-copy',
            nestedEl: 'a',
        },
        FFNtop: {
            el: 'button',
            class: 'btn pull-right',
        },
        FFNbottom: {
            el: 'button',
            class: 'btn',
        },
    }

    // set variables for work page or bookmark
    if ((URLregex.AO3.work).test(currentURL)) {

        // End script if we're not on the first chapter, as there's no summary. (Perhaps allow user to go to first chapter, then copy?)
        if (jQuery('.chapter.previous').length) { return }

        story = {
            Title: $('h2.title').text().trim(),
            Link: 'https://archiveofourown.org' + $('.mark a').attr('href').replace('/mark_for_later', ''), // get work url from Mark for Later button (even when on a deprecated "chapters/..." url). NOTE: Share button is hidden in private works!
            Author: $('h3.byline.heading').text().trim(),
            Summary: nz($('div.preface .summary .userstuff').html()).trim(), // if there is no summary, $(...).html() will return UNDEFINED. Return null string instead // TODO use nullish operator?
            Wordcount: $('dd.words').text().trim(),
            IsComplete: isAO3FicComplete($('dd.chapters').text().trim()), // return 'y'/'n'
            SeriesName: $('dd.series .position a:eq(0)').text().trim(),
            SeriesPosition: getAO3SeriesPos($('dd.series .position:eq(0)').text().trim()),
        }

        if (typeof story.Summary === 'undefined') { console.log('no summary') };

        // Add copy buttons at top and bottom of page
        jQuery('ul.work').append(
            new copyBtn(buttonType.AO3, copyTo.access),
            new copyBtn(buttonType.AO3, copyTo.reddit),
        )
        jQuery('.feedback ul.actions:eq(0)').prepend(
            new copyBtn(buttonType.AO3, copyTo.access),
            new copyBtn(buttonType.AO3, copyTo.reddit),
        )


    } else if ((URLregex.AO3.bookmark).test(currentURL)) {
        story = {
            Title: $('div.header h4.heading a').first().text().trim(),
            Link: 'https://archiveofourown.org' + $('div.header h4.heading a').first().attr('href'),
            Author: $('a[rel="author"]').text().trim(),
            Summary: $('.summary').html().trim(),
            Wordcount: $('dd.words').text().trim(),
            IsComplete: isAO3FicComplete($('dd.chapters').text().trim()), // return boolean
            SeriesName: $('ul.series li a').text().trim(),
            SeriesPosition: getAO3SeriesPos($('ul.series li strong').text().trim()),
        }

        // Add copy buttons
        jQuery('div.own.user.module.group ul.actions').append(
            new copyBtn(buttonType.AO3, copyTo.access),
            new copyBtn(buttonType.AO3, copyTo.reddit),
        )


    } else if ((URLregex.AO3.series).test(currentURL)) {
        // pending

    } else if ((URLregex.FFN.work).test(currentURL)) {
        story = {
            Title: $('#profile_top b.xcontrast_txt').text(),
            Link: currentURL,
            Author: $('#profile_top a.xcontrast_txt[href^="/u/"]').text(),
            Summary: $('#profile_top div.xcontrast_txt').text(),
            Wordcount: $('#profile_top span.xgray').text() //  Wordcount and status are mushed together in one string (thanks, FFNet).
                .replace(/.*(Words: )([,\d]+).*/i, '$2'), //   Extract & clean with regex
            IsComplete: /Status\: Complete/.test($('#profile_top span.xgray').text()), // return boolean
        }

        // Add copy buttons at top and bottom of page (after "favourite"). [https://api.jquery.com/after/]
        // MAYBE - whitespace? CSS padding?
        jQuery('div#profile_top').prepend(
            new copyBtn(buttonType.FFNtop, copyTo.access),
            new copyBtn(buttonType.FFNtop, copyTo.reddit),
        )
        jQuery('div.lc td').first().append(
            new copyBtn(buttonType.FFNbottom, copyTo.access),
            new copyBtn(buttonType.FFNbottom, copyTo.reddit),
        )
    };

    // A little cleaning (AO3 only!)
    story.Summary = story.Summary.replace(/<br\/*>/gi, '</p><p>') //     - replace line breaks with paragraphs
        .replace(/<\/*blockquote>|^<p><\/p>|<p><\/p>$/gi, '') //         - delete blockquotes and blank start/end paragraphs
        .replace(/(?!^)<p>(?!<)/gi, '<p>&nbsp;&nbsp;&nbsp;&nbsp;') //    - add four-space indent after <p>, excluding the first and blank paragraphs
        .replace(/>\s+</g, '><') //                                      - clean whitespace between HTML tags
    story.Wordcount = story.Wordcount.replace(/,/gi, '') //              - remove any decimal commas in wordcount

    // Clean up AO3 and FFN links by deleting text after "?" (links to comments, cloudflare, etc)
    // CAREFUL: this can break links from other domains (e.g. whofic stories have viewstory?sid=###)
    story.Link = story.Link.replace(/\?.+/, '')

    // Copy story data to Access (format: "title=sometitle; author=someauthor; ...")
    jQuery('.copy-for-AccessDB').click(function () {
        let storyData = propertiesAndValues(story, '=', '; ')
        //        alert(storyData); //                              uncomment for popup summary
        copyToClipboard(storyData)
        tempAlert('Copied for DB', 1500)
    })

    // Copy story data to Reddit (format: markdown)
    jQuery('.copy-for-Reddit').click(function () {
        story.Summary = story.Summary
            .replace(/<\/p><p>/gi, '\n>\n>') //     html to markdown
            .replace(/<\/?p>/gi, '')
            .replace(/&nbsp;/gi, '')
            .replace(/<(\/)?(i|em)>/gi, '*')
            .replace(/<(\/)?b>/gi, '**')
        copyToClipboard(
            '[*' + story.Title + '*](' + story.Link + '), by **' + story.Author + '** (' + story.Wordcount + ' words)\n\n'
            + '>' + story.Summary + '\n\n'
        )
        tempAlert('Copied to markdown', 1500)
    })

    // FORMATS
    let formattedOutput // TODO functino!!!!!
    switch ($('#formatSelector').val()) {
        case 'Access DB':
            formattedOutput = [story.Title, story.Link, story.Author, story.Summary, story.Wordcount].join('||')
            break
        case 'Markdown':
            formattedOutput = `[*${story.Title}*](${story.Link}), by **${story.Author}** (${story.Wordcount} words)\n\n`
                + `>${story.Summary}\n\n`
            break;
    }

// FUNCTIONS -----------------------------------------------------------------------------

    // FFN.classBottom.ACCDB
    class copyBtn {
        constructor(siteButton, copyFormat) {
            const btn = document.createElement(siteButton.el)
            btn.className = siteButton.class + ' ' + copyFormat.class
            let innerNode = btn
            if (siteButton.nestedEl) {
                innerNode = document.createElement(siteButton.nestedEl)
                btn.append(innerNode)
            }
            innerNode.innerHTML = copyFormat.icon
            return btn
        }
    }
    function createCopyButtons(siteButton) { // TODO : use this to add all format buttons? (Only if I decide not to use whitespace in FFN... maybe add a separator method?)
        for (const format of copyTo.values) {
            new copyBtn(siteButton, format)
        }
        // TODO : how to return both, comma-separated? It's probably an array...
    }

    function newBtn(siteButton, copyFormat) { // TODO : decide : class, or this function?
        const btn = document.createElement(siteButton.el)
        btn.className = siteButton.class + ' ' + copyFormat.class
        let innerNode = btn
        if (siteButton.nestedEl) {
            innerNode = document.createElement(siteButton.nestedEl)
            btn.append(innerNode)
        }
        innerNode.innerHTML = copyFormat.icon
        return btn
    }

    function nz(myVariable) {
        if (typeof myVariable === 'undefined') {
            return ''
        } else { return myVariable }
    }

    function propertiesAndValues(storyObj, assignChar, separator) { // TODO: can I use the "entries" property here instead?
        return Object
            .keys(storyObj)
            .map(function (k) { return k + assignChar + storyObj[k] }).join(separator)
    }

    // AO3 chapter format is "3/?", "31/31", "3/10"... If chapters written = total chapters, the fic is complete. Outputs "y" or "n".
    // input: "n/n" where n is a number
    function isAO3FicComplete(ao3ChapterCount) {
        ao3ChapterCount = ao3ChapterCount.split('/')
        let chaptersWritten = ao3ChapterCount[0]
        let chaptersTotal = ao3ChapterCount[1]
        // return chaptersWritten==chaptersTotal ? "y" : "n";
        return chaptersWritten === chaptersTotal
    }

    // Return position in series
    // input: "Part n of [seriesname]". output: "n"
    function getAO3SeriesPos(ao3SeriesInfo) {
        return ao3SeriesInfo
            .replace(/^Part /gi, '')
            .replace(/ .+/, '') //     remove everything after the second space
    }

    // https://stackoverflow.com/questions/33855641/copy-output-of-a-javascript-variable-to-the-clipboard
    // TODO: use writeText(newClipText) instead of deprecated .execCommand
    function copyToClipboard(text) {
        var dummy = document.createElement('textarea')
        // to avoid breaking orgain page when copying more words
        // cant copy when adding below this code
        // dummy.style.display = 'none'
        document.body.appendChild(dummy)
        // Be careful if you use textarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
        dummy.value = text
        dummy.select()
        document.execCommand('copy')
        document.body.removeChild(dummy)
    }

    function tempAlert(msg, duration) {
        var elem = document.createElement('div')
        elem.setAttribute(
            'style', 'position:fixed;top:50%;left:45%;background-color:blanchedalmond;font-size:200%;'
            + 'padding-left:20px;padding-right:20px;padding-top:10px;padding-bottom:10px'
        )
        // "position: fixed" -> relative to the browser window
        // "position: absolute" -> relative to the document (or nearest parent)

        elem.innerHTML = msg
        elem.id = 'dialog'
        setTimeout(function () {
            elem.parentNode.removeChild(elem)
        }, duration)
        document.body.appendChild(elem)
    }

GM_addStyle (`
    .AO3-copy {
        cursor: pointer;
    }
    .FFN-copy img {
        // set image height dynamically
        height:'18'; //17 is probably the one
    }
`)

})()
