// ==UserScript==
// @name         📋 Copy story data
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  copies story data from AO3/FFN for pasting into MS Access or markdown (reddit)
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/*
// @match        http*://www.fanfiction.net/s/*
// @exclude      /^https?:\/\/archiveofourown\.org\/(?!(works|bookmarks|chapters)\/[0-9]).*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @license      GPL-3.0-or-later
// ==/UserScript==

/* eslint-env jquery */

/* DONE:
    [x] replaced window.location.href with a variable

 TO DOs
    [x] replace long, repeated text in .append() .prepend()
            - what does jQuery need? Could I create & append an object? (YES)
    [x] eslint-stylize fixes
        [x] semicolons
    [x] check if jquery-ui is actually being used. Can I use something else? AO3 doesn't load it. HTML5 instead?
    [ ] fix regex for HTML and md
    [ ] ctrl+click on button to show dropdown (simpler: modal dialog w/ dropdown?) // MAYBE
    [ ] choose and remember format (reddit, access, other)
    [ ] title text on button "Copy story info to [formatName] format. Ctrl + click to change settings"
    [ ] optionally (config setting), copy first n sentences of story if no summary exists
    [ ] html5 animated alert (fade effect); style nicer borders

CHECKLIST
    [x] let > const
    [x] == > ===
    [ ] arrow functions () => {}

// !BUG:
----------------------------------------------------------------------------------------------------------------------
*/

(function ($) {
    'use strict'

    // Data formatting
    const story = { Title: '', Link: '', Author: '', Summary: '', Wordcount: '', IsComplete: '', SeriesName: '', SeriesPosition: '' }
    Object.seal(story) // properties may be changed but not added, deleted or configured

    // Website & button settings
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
            class: 'FFN-copy btn pull-right',
        },
        FFNbottom: {
            el: 'button',
            class: 'FFN-copy btn',
        },
    }
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

    // set variables for work page or bookmark
    if ((URLregex.AO3.work).test(currentURL)) {

        // End script if we're not on the first chapter, as there's no summary. (Perhaps allow user to go to first chapter, then copy?)
        if ($('.chapter.previous').length) { return }

        story = {
            Title: $('h2.title').text().trim(),
            Link: 'https://archiveofourown.org/works/' // avoid deprecated ".org/chapters/..." and get valid URL from "Comments" button (present in ALL works)
                + $('#show_comments_link a').attr('href').replace(/work_id=([\d]+)/g, '$1'),
            Author: $('h3.byline.heading').text().trim(),
            Summary: $('div.preface .summary .userstuff')?.html().trim(), // handle empty summaries
            Wordcount: $('dd.words').text().trim(),
            IsComplete: isAO3FicComplete($('dd.chapters').text().trim()), // return boolean
            SeriesName: $('dd.series .position a:eq(0)').text().trim(),
            SeriesPosition: getAO3SeriesPos($('dd.series .position:eq(0)').text().trim()),
        }
        AO3fixes()
        if (typeof story.Summary === 'undefined') { console.log('no summary') }; // TODO : note in alert

        // Add copy buttons at top and bottom of page
        $('ul.work').append(makeCopyButtons(buttonType.AO3))
        $('.feedback ul.actions:eq(0)').prepend(makeCopyButtons(buttonType.AO3))


    } else if ((URLregex.AO3.bookmark).test(currentURL)) {
        story = {
            Title: $('div.header h4.heading a').first().text().trim(),
            Link: 'https://archiveofourown.org' + $('div.header h4.heading a').first().attr('href'),
            Author: $('a[rel="author"]').text().trim(),
            Summary: $('.summary')?.html().trim(),
            Wordcount: $('dd.words').text().trim(),
            IsComplete: isAO3FicComplete($('dd.chapters').text().trim()), // return boolean
            SeriesName: $('ul.series li a').text().trim(),
            SeriesPosition: getAO3SeriesPos($('ul.series li strong').text().trim()),
        }
        AO3fixes()

        // Add copy buttons
        $('div.own.user.module.group ul.actions').append(
            makeCopyButtons(buttonType.AO3)
        )


    } else if ((URLregex.AO3.series).test(currentURL)) {
        // pending

    } else if ((URLregex.FFN.work).test(currentURL)) {
        story = {
            Title: $('#profile_top b.xcontrast_txt').text(),
            Link: currentURL,
            Author: $('#profile_top a.xcontrast_txt[href^="/u/"]').text(),
            Summary: $('#profile_top div.xcontrast_txt').text(),
            Wordcount: $('#profile_top span.xgray').text() //   Wordcount and status are mushed together in one string (thanks, FFNet).
                .replace(/Words: ([,\d]+)/i, '$1'), //          Extract & clean with regex
            IsComplete: /Status: Complete/.test($('#profile_top span.xgray').text()), // return boolean
        }

        // Add copy buttons at top and bottom of page (after "favourite")
        $('div#profile_top').prepend(
            makeCopyButtons(buttonType.FFNtop).reverse // reverse order as they are right-aligned
        )
        $('div.lc td').first().append(
            makeCopyButtons(buttonType.FFNbottom)
        )
    };

    // Clean up AO3 and FFN links by deleting text after "?" (links to comments, cloudflare, etc)
    // CAREFUL: this can break links from other domains (e.g. whofic stories have viewstory?sid=###)
    story.Link = story.Link.replace(/\?.+/, '') // TODO convert to method?

    // FORMATS // TODO : convert to a class / constructor function so I can place it at the start of the script (currently declared at initialisation)
    const formattedOutput = {
        AccessDB: propertiesAndValues(story, '=', '; '),
        Markdown: `[*${story.Title}*](${story.Link}), by **${story.Author}** (${story.Wordcount} words)\n\n`
            + `>${htmlToMarkdown(story.Summary)}\n\n`,
    }

    // Copy story data to Access (format: "title=sometitle; author=someauthor; ...")
    $('.copy-for-AccessDB').click(function () {
        copyToClipboard(formattedOutput.AccessDB)
        briefAlert('Copied for DB', 1500) // TODO only alert if copy succeeds
    })

    // Copy story data to Reddit (format: markdown)
    $('.copy-for-Reddit').click(function () {
        copyToClipboard(formattedOutput.Markdown)
        briefAlert('Copied to markdown', 1500)
    })

    // FUNCTIONS -----------------------------------------------------------------------------
    function AO3fixes() { // FIXME - rewrite. Maybe look for a simple parser/cleaner?
        story.Summary = story.Summary.replace(/<br\/?>/gi, '</p><p>') //     - replace line breaks with paragraphs
            .replace(/<\/?blockquote>|^<p><\/p>|<p><\/p>$/gi, '') //         - delete blockquotes and blank start/end paragraphs
            .replace(/(?!^)<p>(?!<)/gi, '<p>&nbsp;&nbsp;&nbsp;&nbsp;') //    - add four-space indent after <p>, excluding the first and blank paragraphs
            .replace(/>\s+</g, '><') //                                      - clean whitespace between HTML tags // BUG (probably): what if the tags are "<b>bold</b> <i>italic</i>"? > "bolditalic!"
        story.Wordcount = story.Wordcount.replace(/,/gi, '') //              - remove any decimal commas in wordcount
    }

    // apparently this is illegal he c̶̮omes H̸̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ̶̧̨̱̹̭̯ͧ̾ͬC̷̙̲̝͖ͭ̏ͥͮ͟Oͮ͏̮̪̝͍M̲̖͊̒ͪͩͬ̚̚͜Ȇ̴̟̟͙̞ͩ͌͝S̨̥̫͎̭ͯ̿̔̀ͅ. nevertheless (AO3 summaries are simple, as is reddit's markdown):
    // MAYBE consider a parser library instead: https://github.com/mixmark-io/turndown
    function htmlToMarkdown(html) {
        if (!html.includes('<')) { return html } // check for presence of tags
        const rx = {
            markdownCharsToEscape: RegExp(/[*#^]/g),
            parabreak: RegExp(/\s*<\/p><(p|br)>\s*/gi),
            break: RegExp(/\s*<br\s*[\/]?>/gi),
            bold: RegExp(/<[\/]?(b|strong)>/gi),
            italic: RegExp(/<[/]?(i|em)>/gi),
            blockquote: RegExp(/<blockquote>/gi),
            otherTags: RegExp(/<[\/]?[^>]+>/gi),
        }
        const markdown = html
            .replaceAll(rx.markdownCharsToEscape, '\\$&')
            .replaceAll(rx.parabreak, '\n\n')
            .replaceAll(rx.break, '\n')
            .replaceAll(/[\n]{3,}/gi, '\n\n') // max two linebreaks.
            .replaceAll(rx.blockquote, '> ') // FIXME (probably needs linebreaks before & after)
            .replaceAll(rx.bold, '**')
            .replaceAll(rx.italic, '*')
            .replaceAll(rx.otherTags, '')
        return markdown
    }

    // create and return a button for each format (currently ACCDB + reddit)
    function makeCopyButtons(siteButton) {
        return Object.values(copyTo).map(
            format => new copyBtn(siteButton, format)
        )
    }

    function propertiesAndValues(storyObj, assignChar, separator) {
        return Object.entries(storyObj).map(
            ([key, val]) => key + assignChar + val
        ).join(separator)
    }

    // AO3 chapter format is "3/?", "31/31", "3/10"...
    // input: "n/n" where n is a number. output: boolean
    function isAO3FicComplete(ao3ChapterCount) {
        const chaptersWritten = ao3ChapterCount.split('/')[0]
        const chaptersTotal = ao3ChapterCount.split('/')[1]
        return chaptersWritten === chaptersTotal
    }

    // Return position in series
    // input: "Part n of [seriesname]". output: "n"
    function getAO3SeriesPos(ao3SeriesInfo) {
        return ao3SeriesInfo.replace(/^Part ([\d]+)/gi, '$1')
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text)
        } catch (error) {
            console.error('failed to copy to clipboard. text=', text) // TODO remove try/catch once development is finished
        }
    }

    function briefAlert(msg, duration) {
        const el = document.createElement('div')
        el.textContent = msg
        el.id = 'copy-alert'
        setTimeout(function () {
            el.parentNode.removeChild(el)
        }, duration)
        document.body.appendChild(el)
    }

GM_addStyle (`
    .AO3-copy {
        cursor: pointer;
    }
    .FFN-copy {
        margin-left: 5px; /* instead of adding whitespace, as FFN does */
    }
    .AO3-copy img {
        height: 18px;
    }
    .FFN-copy img {
        height: 17px;
    }
    #copy-alert {
        position: fixed; /* relative to browser window */
        top: 50%;
        left: 45%;
        background-color: blanchedalmond;
        font-size: 200%;
        padding: 10px 20px; /* top/bottom left/right */
    }
`)
    // TODO: set img height dynamically

})(jQuery)
