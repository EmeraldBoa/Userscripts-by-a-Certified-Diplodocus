// ==UserScript==
// @name         📋 Copy SERIES
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.2.1
// @description  copies story data from AO3 for pasting into MS Access
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/series/*
// @icon         data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>
// @grant        GM_addStyle
// ==/UserScript==

/* TODOs
    [ ] tidy cleanup functions
    [ ] untangle formatting function (nested loop)
*/

(function () {
    'use strict'
    const $ = document.querySelector.bind(document) // shorthand for readability
    const $$ = document.querySelectorAll.bind(document)
    const parser = new DOMParser()
    const errPrefix = '[Copy Series Data - userscript] \n⚠ Error: '

    const storyCollection = {}

    const currentURL = window.location.href
    const URLregex = {
        AO3: {
            series: /archiveofourown\.org\/series/i,
        },
    }
    const copyTo = {
        access: {
            class: 'copy-for-AccessDB',
            icon: '&#128203;',
            message: 'Copied for DB',
            tooltip: 'Copy info for DB: "key1=value1; key2=value2..."',
            get format() {
                return stringifyMultiple()
            },
        },
    }
    const button = { // subsequent elements will be nested: [EL1, EL2, EL3] becomes EL1 > EL2 > EL3
        AO3: [
            ['li', { class: 'AO3-copy' }],
            ['a', { tabindex: 0 }], // for accessibility: add button to the normal tabbing order
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
    if (currentURL.match(URLregex.AO3.series)) {
        const seriesDetails = $$('.meta .userstuff')
        const seriesInfo = {
            Title: $('h2.heading').textContent,
            Link: currentURL,
            Description: seriesDetails[0]?.innerHTML || '',
            Notes: seriesDetails[1]?.innerHTML || '',
        }
        trimObjectValues(seriesInfo)
        Object.assign(storyCollection, { Series: seriesInfo })

        // iterate through stories
        $$('.work.blurb').forEach((work, i) => {
            const heading = work.querySelectorAll('.header a')
            const stats = work.querySelector('.stats')
            const story = {
                Title: heading[0].textContent,
                Link: heading[0].href,
                Author: heading[1].textContent,
                Fandom: heading[3].textContent,
                Summary: work.querySelector('.summary')?.innerHTML || '', // handle empty summaries
                Wordcount: stats.querySelector('dd.words').textContent,
                IsComplete: isAO3FicComplete(stats.querySelector('dd.chapters').textContent), // return boolean
                SeriesPosition: getAO3SeriesPos(work.querySelector('.series')?.textContent || ''), // TODO handle fics in multiple series
            }
            trimObjectValues(story)
            Object.assign(storyCollection, { [`Story${i}`]: story })
        })

        // Add copy buttons at top of page
        $('#main > .navigation').append(new copyBtn(button.AO3, copyTo.access))
    };

    // FUNCTIONS -----------------------------------------------------------------------------

    function stringifyMultiple() { // Finally works! turn this into a nested helper function
        const stringifiedObj = {}
        Object.entries(storyCollection).forEach(([k, story]) => {
            stringifiedObj[k] = propertiesAndValues(
                formatForAccess(story, 'Description', 'Notes', 'Summary'),
                '=',
                '; '
            )
        })
        return propertiesAndValues(stringifiedObj, ' = {', '};\n\n') + '};'
    }

    function iterateObject(obj, fn) { // TODO add fn arguments? or define a small function with the arguments set?
        const newObj = {}
        Object.entries(obj).forEach(([key, val]) => newObj[key] = fn(val))
        return newObj
    }

    function iterateNested(obj, fn) {
        const newObj = {}
        Object.entries(obj).forEach(function ([key, val]) {
            if (typeof val === 'object') { iterateNested(val, fn) }
            newObj[key] = fn(val)
        })
        return newObj
    }

    function propertiesAndValues(storyObj, assignChar, separator) {
        return Object
            .keys(storyObj)
            .map(k => k + assignChar + storyObj[k]).join(separator)
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
    const copyAlert = new elWithAttr('div', { class: 'copy-alert' })
    const txtDiv = document.createElement('div')
    const missingContentDiv = new elWithAttr('div', { class: 'missing-content' })
    copyAlert.append(txtDiv, missingContentDiv)
    document.body.append(copyAlert)

    function timedPopover(msg, duration) {
        txtDiv.textContent = msg
        copyAlert.classList.add('show-alert')
        setTimeout(function () {
            copyAlert.classList.remove('show-alert')
        }, duration)
    }
    // -- CLEANUP (from CopyStoryData) -----------------------------

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
    // CAREFUL: this can break links from other domains (e.g. whofic stories have viewstory?sid=###)
    function cleanLink(url) {
        return url.replace(/[?#].+/, '') // TODO add # to other urls
    }

    function trimObjectValues(obj) {
        const trim = (x) => { return typeof x === 'string' ? x.trim() : x }
        Object.assign(obj, iterateObject(obj, trim))
    }

    function removeThousandsSeparator(number) {
        return number.replace(/,/gi, '')
    }

    // FIXME: regex will BREAK html like <p>this text with <em>emphasis <br>across</em> two lines</p>
    function cleanHTML(html) {
        if (!html.includes('<')) { return }
        return html
            .replaceAll(/<([/]?)b>/gi, '<$1strong>') //             - b to strong
            .replaceAll(/<([/]?)i>/gi, '<$1em>') //                 - i to em
            .replaceAll(/<([/]?)div>/gi, '<$1p>') //                - div to p
            .replaceAll(/<br\s*[/]?>/gi, '</p><p>') //              - br to p // HACK: keep an eye on this one
            .replaceAll(/(<p>){2,}|(<[/]p>){2,}/gi, '$1$2') //      - discard wrappers (<p><p>, </p></p>)
            .replaceAll(/\s+(<\/p>)|(<p>)\s+/gi, '$1$2') //         - no white space around paragraphs (do I need this?)
            .replaceAll(/(<p><\/p>){2,}/gi, '<p></p>') //           - max one empty paragraph
            .replaceAll(/^<p><\/p>|<p><\/p>$/gi, '') //             - delete blank start/end paragraphs
    }

    // ACCESS EDITING ------------------------------------------------------
    // Format HTML text (properties such as 'description', 'notes', 'summary')
    function formatForAccess(obj, ...targetProperties) {
        const objForAccess = structuredClone(obj)
        for (const prop of targetProperties) {
            if (!objForAccess[prop]) { continue }
            let formattedSummary = blockquoteToItalics(objForAccess[prop])
            formattedSummary = hangingIndents(formattedSummary)
            formattedSummary = formattedSummary.replaceAll(/<([/]?)p>/gi, '<$1div>') // p to div (Access default)
            objForAccess[prop] = formattedSummary
        }
        return objForAccess
    }

    function applySuccessiveFunctions(target, ...fns) {
        let transformedTarget = target
        for (const fn of fns) {
            transformedTarget = fn(transformedTarget)
        }
        fns.forEach(fn => target = fn(target))
        return transformedTarget
    }

    class storyForAccess {
        constructor(storyObj) {
            return structuredClone(storyObj)
        }

        get blockquoteToItalics() { return blockquoteToItalics(this) }
        get hangingIndents() { return hangingIndents(this) }
        get pToDiv() { return this.replaceAll(/<([/]?)p>/gi, '<$1div>') }
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
    // ------------------------------------------------------------------
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
        &.show-alert {  
            visibility: visible;
            opacity: 100%;
            transition-delay: 0ms;
        }
        .missing-content {
            font-size: 50%;
            padding-top: 5px;
            text-align: center;
            color: #900; 
        }
    }
    .AO3-copy {
        cursor: pointer;
        img {
            height: 18px;
        }
    }
    `)

})()

/*
Series = {Title=Chaos Reign; Link=https://archiveofourown.org/series/2250978; Summary=<p>If a butterfly flapping its wings can cause a storm on another continent, the God of Chaos escaping with the Tesseract is bound to change the course of the universe.</p><p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>};

Story0 = {Title=Chaos Reign; Link=https://archiveofourown.org/works/18634708; Author=fourth_rose; Summary=<p>Thor once told Loki that he could be more than the God of Mischief – forgetting that Loki has been more than that from the very beginning.</p>; Wordcount=110,534; IsComplete=true; SeriesName=Chaos Reign; SeriesPosition=1};

Story1 = {Title=Moments in Time; Link=https://archiveofourown.org/works/33973333; Author=fourth_rose; Summary=<p>It is in the nature of stories that there must be things which fall through the cracks, but some of them may still be worth keeping.</p>; Wordcount=8,045; IsComplete=false; SeriesName=Chaos Reign; SeriesPosition=2};
*/
