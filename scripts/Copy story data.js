// ==UserScript==
// @name         Copy story data
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.3
// @description  copies story data from AO3/FFN for pasting into MS Access or markdown (reddit)
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/*
// @match        http*://www.fanfiction.net/s/*
// @exclude      /^https?:\/\/archiveofourown\.org\/(?!(works|bookmarks|chapters)\/[0-9]).*/
// @icon         data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>
// @grant        GM_addStyle
// @license      GPL-3.0-or-later
// ==/UserScript==

/*
DONE

 TO DOs
    [ ] add SeriesURL (autofill when creating new series)
    [ ] show Part N of [SeriesName](SeriesURL) in markdown

 MAYBEs
    [ ]

!BUGS
----------------------------------------------------------------------------------------------------------------------
*/
/**
 * PURPOSE: copy story info from AO3 (work/bookmark page) and FFN (story page).
 *
 * INFO: Title, Link, Author, Summary, Wordcount, IsComplete (true/false), SeriesName, SeriesPosition
 * FORMATS:
 *  - accdb (key=value; ...):   Title="some title"; Link="https://somelink..."; ...
 *  - reddit (markdown):        [*Title*](Link), by **Author** (Wordcount words)\n\n
 *                              > Summary
 */

(function () {
    'use strict'
    const $ = document.querySelector.bind(document) // shorthand for readability
    const $$ = document.querySelectorAll.bind(document)
    const parser = new DOMParser()
    const errPrefix = '[Copy Story Data - userscript] \n⚠ Error: '

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
            message: 'Copied for DB',
            tooltip: 'Copy info for DB: "key1=value1; key2=value2..."',
            get format() {
                return propertiesAndValues(formatForAccess(story), '=', '; ')
            },
        },
        reddit: {
            class: 'copy-for-Reddit',
            icon: '<img src="https://www.reddit.com/favicon.ico">',
            message: 'Copied as markdown',
            tooltip: 'Copy story info as markdown',
            get format() {
                return `[*${story.Title}*](${story.Link}), by **${story.Author}** (${round(story.Wordcount)} words)\n\n`
                    + summaryToMarkdown(story.Summary)
            },
        },
    }
    const button = { // subsequent elements will be nested: [EL1, EL2, EL3] becomes EL1 > EL2 > EL3
        AO3: [
            ['li', { class: 'AO3-copy' }],
            ['a', { tabindex: 0 }], // for accessibility: add button to the normal tabbing order
        ],
        FFNtop: [
            ['button', { class: 'FFN-copy btn pull-right' }],
        ],
        FFNbottom: [
            ['button', { class: 'FFN-copy btn' }],
        ],
    }
    class elWithAttr {
        constructor(type, attributes = {}) {
            const el = document.createElement(type)
            Object.entries(attributes).forEach(at => el.setAttribute(...at))
            return el
        }
    }
    class copyBtn {
        constructor(buttonInfo, copyFormat) {
            const elems = buttonInfo.map(
                elemInfo => new elWithAttr(...elemInfo) // create elements
            )
            for (let i = 0; i < elems.length - 1; i++) {
                elems[i].append(elems[i + 1]) // nest elements
            }
            const btn = elems[0]
            const lastChild = elems.at(-1)
            btn.classList.add(copyFormat.class)
            btn.setAttribute('title', copyFormat.tooltip)
            btn.addEventListener('click', copyAlert) // LEARN : is this an improvement on the anonymous function, memorywise?
            function copyAlert() {
                const msg = copyToClipboard(copyFormat.format) && copyFormat.message
                timedPopover(msg, 1500)
            }
            lastChild.innerHTML = copyFormat.icon
            return btn
        }
    }

    // set variables for work page or bookmark
    if ((URLregex.AO3.work).test(currentURL)) {

        // End script if we're not on the first chapter, as there's no summary.
        if ($('.chapter.previous')) { return }
        const preface = $('.preface')
        const meta = $('.meta')

        Object.assign(story, {
            Title: preface.querySelector('.title').textContent,
            Link: getValidAO3Link(),
            Author: preface.querySelector('.byline').textContent,
            Summary: preface.querySelector('.summary .userstuff')?.innerHTML || '', // handle empty summaries
            Wordcount: meta.querySelector('dd.words').textContent,
            IsComplete: isAO3FicComplete(meta.querySelector('dd.chapters').textContent), // return boolean
            SeriesName: meta.querySelector('dd.series .position a')?.textContent || '',
            SeriesPosition: getAO3SeriesPos(meta.querySelector('dd.series .position')?.textContent || ''),
        })
        cleanSummaryHTML()

        // Add copy buttons at top and bottom of page
        $('ul.work').append(...makeCopyButtons(button.AO3))
        $('.feedback ul.actions').prepend(...makeCopyButtons(button.AO3))


    } else if ((URLregex.AO3.bookmark).test(currentURL)) {
        const header = $$('.header h4.heading a')
        Object.assign(story, {
            Title: header[0].textContent,
            Link: 'https://archiveofourown.org' + header[0].getAttribute('href'),
            Author: header[1].textContent,
            Summary: $('.summary')?.innerHTML || '', // handle empty summaries
            Wordcount: $('dd.words').textContent,
            IsComplete: isAO3FicComplete($('dd.chapters').textContent), // return boolean
            SeriesName: $('.series a')?.textContent || '',
            SeriesPosition: getAO3SeriesPos($('.series')?.textContent || ''),
        })
        cleanSummaryHTML()

        // Add copy buttons
        $('.own .actions').append(...makeCopyButtons(button.AO3))


    } else if ((URLregex.AO3.series).test(currentURL)) {
        // pending

    } else if ((URLregex.FFN.work).test(currentURL)) {
        const ffnInfo = $('#profile_top')
        const details = ffnInfo.querySelector('span.xgray').textContent //  Wordcount and status inside a string (thanks, FFNet).
        Object.assign(story, {
            Title: ffnInfo.querySelector('b.xcontrast_txt').textContent,
            Link: currentURL,
            Author: ffnInfo.querySelector('a.xcontrast_txt[href^="/u/"]').textContent,
            Summary: ffnInfo.querySelector('div.xcontrast_txt').textContent,
            Wordcount: details.replace(/.*Words: ([,\d]+).*/i, '$1'), //    Extract & clean with regex
            IsComplete: details.includes(`Status: Complete`), //            return boolean
        })

        // Add copy buttons at top and bottom of page (after "favourite")
        ffnInfo.prepend(...makeCopyButtons(button.FFNtop).reverse()) // reverse order as they are right-aligned
        $('#story_actions').parentElement.append(...makeCopyButtons(button.FFNbottom))
    };

    trimAndCleanFields()

    // CLEANUP FUNCTIONS -----------------------------------------------------------------------------

    function trimAndCleanFields() {
        for (const [key, value] of Object.entries(story)) {
            if (typeof value === 'string') { story[key] = value.trim() }
        }
        story.Link = story.Link.replace(/\?.+/, '')
        story.Wordcount = story.Wordcount.replace(/,/gi, '')
    /**
    *   1. Delete link text after "?" (links to comments, cloudflare, etc).
    *   CAREFUL: this can break links from other domains (e.g. whofic stories have viewstory?sid=###)
    *   2. Remove decimal commas from wordcount
    */
    }

    // AO3 chapter format is "3/?", "31/31", "3/10"...
    // input: "n/m" where n is a number. output: boolean
    function isAO3FicComplete(ao3ChapterCount) {
        ao3ChapterCount = ao3ChapterCount.trim()
        const chaptersWritten = ao3ChapterCount.split('/')[0]
        const chaptersTotal = ao3ChapterCount.split('/')[1]
        return chaptersWritten === chaptersTotal
    }

    // Return position in series
    // input: "Part n of [seriesname]". output: "n"
    function getAO3SeriesPos(ao3SeriesInfo) {
        return ao3SeriesInfo.replace(/^\s*Part ([\d]+) of.*/gi, '$1')
    }

    // Get valid link from AO3 works page, avoiding deprecated ".org/chapters/..."
    function getValidAO3Link() {
        const IDfromKudos = $('#kudo_commentable_id').value
        let url = IDfromKudos && 'https://archiveofourown.org/works/' + IDfromKudos

        if (!url) { // FIX: (currently testing) If the kudos method fails, ALERT so I know I need to add a secondary option
            const errMsg = errPrefix + 'Could not get workID from kudos button.\nUsing currentURL instead.'
            console.error(errMsg)
            alert(errMsg)
        }
        return url || currentURL
    }

    // Wordcount rounding (1-300 exact, 300+ round to nearest 1000, 1k+) with 'k' units
    function round(n) {
        const rounding = [
            { to: 1, upperLim: 300 },
            { to: 100, upperLim: 1000 },
            { to: 1000 },
        ]
        const roundThis = rounding.find(interval => !(interval.upperLim < n))
        n = Math.round(n / roundThis.to) * roundThis.to
        if (n % 1000 === 0) { n = n / 1000 + 'k' }
        return n
    }

    // FIXME: regex will BREAK html like <p>this text with <em>emphasis <br>across</em> two lines</p>
    function cleanSummaryHTML() {
        if (!story.Summary.includes('<')) { return }
        story.Summary = story.Summary
            .replaceAll(/<([/]?)b>/gi, '<$1strong>') //             - b to strong
            .replaceAll(/<([/]?)i>/gi, '<$1em>') //                 - i to em
            .replaceAll(/<([/]?)div>/gi, '<$1p>') //                - div to p
            .replaceAll(/<br\s*[/]?>/gi, '</p><p>') //              - br to p // HACK: keep an eye on this one
            .replaceAll(/(<p>){2,}|(<[/]p>){2,}/gi, '$1$2') //      - discard wrappers (<p><p>, </p></p>)
            .replaceAll(/\s+(<\/p>)|(<p>)\s+/gi, '$1$2') //         - no white space around paragraphs (do I need this?)
            .replaceAll(/(<p><\/p>){2,}/gi, '<p></p>') //           - max one empty paragraph
            .replaceAll(/^<p><\/p>|<p><\/p>$/gi, '') //             - delete blank start/end paragraphs
    }

    // apparently this is illegal he c̶̮omes H̸̡̪̯ͨ͊̽̅̾̎Ȩ̬̩̾͛ͪ̈́̀́͘ ̶̧̨̱̹̭̯ͧ̾ͬC̷̙̲̝͖ͭ̏ͥͮ͟Oͮ͏̮̪̝͍M̲̖͊̒ͪͩͬ̚̚͜Ȇ̴̟̟͙̞ͩ͌͝S̨̥̫͎̭ͯ̿̔̀ͅ. nevertheless (AO3 summaries are simple, as is reddit's markdown):
    function summaryToMarkdown(text) {
        if (!text.includes('<')) { return `> ${text}\n\n` } // check for presence of tags
        const rx = {
            markdownCharsToEscape: RegExp(/[*_#^]|(?:<p>)\s*>/g), // escape > character after a p tag (?:abc) = non-capturing group // HACK
            parabreak: RegExp(/<\/p>(?!$)/gi),
            // break: RegExp(/<br\s*[/]?>/gi), // currently unused (see the // HACK // above)
            bold: RegExp(/<[/]?(b|strong)>/gi),
            italic: RegExp(/<[/]?(i|em)>/gi),
            blockquote: RegExp(/<blockquote>/gi),
            otherTags: RegExp(/<[/]?[^>]+>/gi),
        }
        const markdown = blockquoteToMarkdown(text)
            .replaceAll(rx.markdownCharsToEscape, '\\$&')
            .replaceAll(rx.parabreak, '\n\n')
            .replaceAll(/[\n]{3,}/gi, '\n\n') // max two linebreaks.
            .replaceAll(rx.bold, '**')
            .replaceAll(rx.italic, '*')
            .replaceAll(rx.otherTags, '')
            .replaceAll(/^.+/gm, '> $&') // blockquote on every new paragraph (multiline enabled)
        return `${markdown}\n\n`
    }

    function blockquoteToMarkdown(html) {
        const bqArray = html.split(/<[/]?blockquote>/gi)
        if (bqArray.length < 2) { return html }
        for (let i = 1; i < bqArray.length; i += 2) { // iterate through blockquoted text
            bqArray[i] = bqArray[i].replaceAll(/<p>/gi, '$&> ')
        }
        return bqArray.join('')
    }

    // Create a 'story' object with an edited summary (for the database)
    function formatForAccess(storyObj) {
        const storyForAccess = structuredClone(storyObj)
        if (storyForAccess.Summary) {
            let formattedSummary = blockquoteToItalics(storyForAccess.Summary)
            formattedSummary = hangingIndents(formattedSummary)
            formattedSummary = formattedSummary.replaceAll(/<([/]?)p>/gi, '<$1div>') // p to div (Access default)
            storyForAccess.Summary = formattedSummary
        }
        return storyForAccess
    }

    // Invert the italics within a blockquote. Remove the blockquote tags and wrap in empty paragraphs. Return HTML string
    function blockquoteToItalics(html) { // MAYBE reformat this to use the parsed summary
        const bqArray = html.split(/<[/]?blockquote>/gi)
        if (bqArray.length < 2) { return html } // no blockquotes found

        for (let i = 1; i < bqArray.length; i += 2) { // iterate through bqArray[1], [3], [5]... (blockquoted text)
            bqArray[i] = bqArray[i] //                      <em>,  </em>
                .replaceAll(/(<[/]?)em>/gi, '$1/em>') //    </em>, <//em>
                .replaceAll(/<[/]{2}/gi, '<') //            </em>, <em>
                .replaceAll('<p>', '<p><em>').replaceAll('</p>', '</em></p>')
                .replaceAll(/<em>(\s+)<\/em>/gi, '$1')
        }
        return bqArray.join('<p></p>') // wrap blockquoted text in empty paragraphs
            .replaceAll(/(<p><\/p>){2,}/gi, '<p></p>') // max two empty paragraphs
            .replaceAll(/^<p><\/p>|<p><\/p>$/gi, '') //   no empty paragraph at start or end
    }

    // Indent all paragraphs but the first in every block (i.e. not after a blank paragraph). Return HTML string
    function hangingIndents(html) {
        const summary = parser.parseFromString(html, 'text/html').body
        const indentString = '\xa0'.repeat(4)
        let pCount = 0 // count paragraphs in sections (1 = first non-empty)
        summary.querySelectorAll('p').forEach((p) => {
            pCount++
            if (!p.textContent) pCount = 0 // reset on empty paragraphs (new block)
            if (pCount < 2) return // don't indent the first paragraph
            p.prepend(indentString)
        })
        return summary.innerHTML
    }

    // OTHER FUNCTIONS -----------------------------------------------------------------------------

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

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch (error) {
            alert (errPrefix + 'Couldn\'t copy to clipboard. See console for more details.')
            console.error(
                errPrefix, 'Couldn\'t copy to clipboard.\n\nLogged error:\n', error.message, `\n\ntext = "${text}"`
            )
        }
    }

    // Create copy alert message with conditional "no summary" warning
    const copyAlert = new elWithAttr('div', { class: 'copy-alert' }) // MAYBE popover - new in 2025
    const txtDiv = document.createElement('div')
    const noSummaryDiv = new elWithAttr('div', { class: 'no-summary' })
    noSummaryDiv.textContent = !story.Summary ? '[no summary]' : ''
    copyAlert.append(txtDiv, noSummaryDiv)
    document.body.append(copyAlert)

    function timedPopover(msg, duration) {
        txtDiv.textContent = msg
        copyAlert.classList.add('show-alert')
        setTimeout(function () {
            copyAlert.classList.remove('show-alert')
        }, duration)
    }

    // eslint-disable-next-line no-undef
    GM_addStyle (`
    .copy-alert {
        position: fixed; /* relative to browser window */
        inset: 0;
        width: fit-content;
        height: fit-content;
        margin: auto;
        font-size: 200%;
        padding: 10px 20px; /* top/bottom left/right */
        background-color: blanchedalmond;
        border-radius: 0.2em;
        box-shadow: 1px 1px 5px #aaa; /* from AO3 div.wrapper */
        visibility: hidden;
        opacity: 0;
        transition: opacity 250ms ease-in, visibility 0ms ease-in 250ms;
      }
    .show-alert {  
        visibility: visible;
        opacity: 100%;
        transition-delay: 0ms;
    }
    .no-summary {
        font-size: 50%;
        padding-top: 5px;
        text-align: center;
        color: #900; 
    }
    .AO3-copy {
        cursor: pointer;
        img {
            height: 18px;
        }
    }
    .FFN-copy {
        margin-left: 5px; /* instead of adding whitespace, as FFN does */
        img {
            height: 17px;
        }
    }
    `)

})()
