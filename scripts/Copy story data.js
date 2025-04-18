// ==UserScript==
// @name         📋 Copy story data
// @namespace    http://tampermonkey.net/
// @version      1.2.2
// @description  copies story data from AO3/FFN for pasting into MS Access or markdown (reddit)
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/*
// @match        http*://www.fanfiction.net/s/*
// @exclude      /^https?:\/\/archiveofourown\.org\/(?!(works|bookmarks|chapters)\/[0-9]).*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @license      GPL-3.0-or-later
// ==/UserScript==

/*
 TO DOs
    [x] vanilla js - test
    [ ] simpler selectors for button prepend/appends

 MAYBEs
    [ ] ctrl+click on button to show dropdown (simpler: modal dialog w/ dropdown?)
    [ ] choose and remember format (reddit, access, other)
    [ ] title text on button "Copy story info to [formatName] format. Ctrl + click to change settings"
        [ ] OR generic tooltips (good if I share the script)
    [ ] optional setting: copy first n sentences of story if no summary exists. Alert of no-summary in popup? What purpose would it serve?
    [ ] round up wordcount in Markdown (nearest 100, nearest 1000(k))

CHECKLIST
    [x] let > const
    [x] == > ===
    [x] arrow functions () => {}

!BUGS
----------------------------------------------------------------------------------------------------------------------
*/

(function () {
    'use strict'
    // alias document/element.querySelector, for readability
    // const $ = (sel, par = document) => par.querySelector(sel) // TODO : check if this is safe/performant
    const $ = document.querySelector.bind(document)
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
    const copyTo = {
        access: {
            class: 'copy-for-AccessDB',
            icon: '&#128203;',
            message: 'Copied for DB',
            get format() {
                return propertiesAndValues(formatForAccess(story), '=', '; ')
            },
        },
        reddit: {
            class: 'copy-for-Reddit',
            icon: '<img src="https://www.reddit.com/favicon.ico">',
            message: 'Copied as markdown',
            get format() {
                return `[*${story.Title}*](${story.Link}), by **${story.Author}** (${story.Wordcount} words)\n\n`
                    + summaryToMarkdown(story.Summary)
            },
        },
    }
    class copyBtn {
        constructor(siteButton, copyFormat) {
            const btn = document.createElement(siteButton.el)
            btn.className = siteButton.class + ' ' + copyFormat.class
            btn.addEventListener('click', () => { // TODO make static function
                const msg = copyToClipboard(copyFormat.format) && copyFormat.message
                timedPopover(msg, 1500)
            })
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
        $('ul.work').append(...makeCopyButtons(buttonType.AO3))
        $('.feedback ul.actions').prepend(...makeCopyButtons(buttonType.AO3))


    } else if ((URLregex.AO3.bookmark).test(currentURL)) {
        const header = $('.header h4.heading')
        Object.assign(story, {
            Title: header.querySelector('a').textContent,
            Link: 'https://archiveofourown.org' + header.querySelector('a').getAttribute('href'),
            Author: header.querySelector('a[rel="author"]').textContent,
            Summary: $('.summary')?.innerHTML || '', // handle empty summaries
            Wordcount: $('dd.words').textContent,
            IsComplete: isAO3FicComplete($('dd.chapters').textContent), // return boolean
            SeriesName: $('.series a')?.textContent || '',
            SeriesPosition: getAO3SeriesPos($('.series')?.textContent || ''),
        })
        cleanSummaryHTML()

        // Add copy buttons
        $('.own .actions').append(
            ...makeCopyButtons(buttonType.AO3)
        )


    } else if ((URLregex.AO3.series).test(currentURL)) {
        // pending

    } else if ((URLregex.FFN.work).test(currentURL)) {
        const ffnInfo = $('#profile_top')
        const details = ffnInfo.querySelector('span.xgray').textContent //   Wordcount and status buried inside a string (thanks, FFNet).
        Object.assign(story, {
            Title: ffnInfo.querySelector('b.xcontrast_txt').textContent,
            Link: currentURL,
            Author: ffnInfo.querySelector('a.xcontrast_txt[href^="/u/"]').textContent,
            Summary: ffnInfo.querySelector('div.xcontrast_txt').textContent,
            Wordcount: details.replace(/.*Words: ([,\d]+).*/i, '$1'), //    Extract & clean with regex
            IsComplete: details.includes(`Status: Complete`), //            return boolean
        })

        // Add copy buttons at top and bottom of page (after "favourite")
        ffnInfo.prepend(
            ...makeCopyButtons(buttonType.FFNtop).reverse() // reverse order as they are right-aligned
        )
        $('#story_actions').parentElement.append(
            ...makeCopyButtons(buttonType.FFNbottom)
        )
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

        if (!url) { // FIXME: (currently testing) If the kudos method fails, ALERT so I know I need to add a secondary option
            const errMsg = errPrefix + 'Could not get workID from kudos button.\nUsing currentURL instead.'
            console.error(errMsg)
            alert(errMsg)
        }
        return url || currentURL
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
            markdownCharsToEscape: RegExp(/[*_#^]|(?:<p>)\s*>/g), // exclude > character after a p tag (?:abc) = non-capturing group // HACK
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
        if (bqArray.length < 2) { return html }

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
            console.error(
                errPrefix, '⚠ Couldn\'t copy to clipboard. Logged error:\n\n', error.message, `\n\ntext = "${text}"`
            )
        }
    }

    function createElement(type, className) {
        const el = document.createElement(type)
        el.classList = className
        document.body.append(el)
        return el
    }

    const copyAlert = createElement('div', 'copy-alert') // MAYBE later: popover?
    function timedPopover(msg, duration) {
        copyAlert.textContent = msg
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
