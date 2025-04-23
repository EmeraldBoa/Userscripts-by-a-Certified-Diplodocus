// ==UserScript==
// @name         Copy whofic data
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.2
// @description  Manually copy story info from whofic.com, formatted for Access or Reddit.
// @author       CertifiedDiplodocus
// @match        https://www.whofic.com/series.php?seriesid=*
// @match        https://www.whofic.com/viewuser.php*
// @icon         https://www.whofic.com/favicon.ico // TODO maybe change? If not, then upscale
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @license      GPL-3.0-or-later
// ==/UserScript==

/* global GM_addStyle, GM_setValue, GM_getValue */

// *********************************************************************************
// Inserts a copy button before every work on the page. When a button is clicked,  *
// it copies the summary data (title, author, link...) of that particular story.   *
// A dropdown menu (top right) lets you select the format of the copied text:      *
// title="..."; link="..."; ...     for Access DB                                  *
// markdown                         for Reddit                                     *
// *********************************************************************************

(function () {
    'use strict'

    const errPrefix = '[Copy Story Data - userscript] \n⚠ Error: ',
        currentURL = window.location.href,
        pageIsSeries = currentURL.match(/whofic.com\/series.php/),
        story = {},
        storyBlock = document.querySelectorAll('.storyBlock')
    if (storyBlock.length < 1) { return }

    const copyTo = [
        {
            name: 'Access DB',
            message: 'Copied for DB',
            btnLabel: 'Copy details for DB',
            get format() {
                return propertiesAndValues(story, '=', '; ')
            },
        },
        {
            name: 'Markdown',
            message: 'Copied as markdown',
            btnLabel: 'Copy details as markdown',
            get format() {
                return `[*${story.Title}*](${story.Link}), by **${story.Author}** (${round(story.Wordcount)} words)\n\n`
                    + `> ${story.Summary}`
            },
        },
    ]

    class elWithAttr {
        constructor(type, attributes = {}) {
            const el = document.createElement(type)
            Object.entries(attributes).forEach(at => el.setAttribute(...at))
            return el
        }
    }

    // --------------------------------------------------------------------------------------------------
    // Create, format and append a labelled dropdown to select formats
    const formatSelector = {
        div: new elWithAttr('div', { class: 'format-selector' }),
        label: new elWithAttr('label', { for: 'copy-format' }),
        selector: new elWithAttr('select', { id: 'copy-format' }),
        get parent() { return document.querySelector(pageIsSeries ? '.jumpmenu' : '.sectionheader') },
        get value() { return this.selector.value },
        set value(x) { this.selector.value = x },
    }
    formatSelector.label.textContent = 'Copy format:'
    const arrOptions = Object.values(copyTo).map((format, i) => new Option(format.name, i))
    formatSelector.selector.append(...arrOptions)

    // Set dropdown to saved value, or default to "Access DB" if no saved value exists. On change, save the new value
    formatSelector.value = GM_getValue('lastFormatSelected', 0)
    formatSelector.selector.addEventListener('change', modifyButtonsOnChange)

    formatSelector.div.append(formatSelector.label, formatSelector.selector)
    formatSelector.parent.append(formatSelector.div)

    // --------------------------------------------------------------------------------------------------
    function modifyButtonsOnChange() {
        GM_setValue('lastFormatSelected', this.value)
        for (const btn of document.querySelectorAll('.copy-btn')) {
            btn.setAttribute('aria-label', copyTo[this.value].btnLabel)
        }
    }

    // Insert copy buttons
    class copyBtn extends elWithAttr {
        constructor(format, btnNumber) {
            format = copyTo[format]
            super('button', {
                'class': 'copy-btn',
                'name': btnNumber,
                'aria-label': format.btnLabel,
            })
            this.innerHTML = '&#128203;'
            this.addEventListener('click', copyThisStory)
            return this
        }
    }
    for (let i = 0; i < storyBlock.length; i++) {
        storyBlock[i].firstElementChild.prepend(new copyBtn(formatSelector.value, i))
    }

    // When a button is clicked, copy the corresponding storyBlock
    function copyThisStory() {
        const id = this.name,
            thisFic = storyBlock[id],
            main = thisFic.querySelector('p'), // title, author, summary
            titleAuthor = main.querySelectorAll('a'),
            details = thisFic.querySelectorAll('.list-inline')[1].querySelectorAll('.list-inline-item')

        Object.assign(story, {
            Title: titleAuthor[0].textContent,
            Link: titleAuthor[0].href,
            Author: titleAuthor[1].textContent,
            Summary: main.lastChild.textContent.replaceAll('  ', ' '), // Get everything after the <br>
            Wordcount: details[4].childNodes[1].textContent,
            IsComplete: details[3].childNodes[1].textContent.includes('Yes'),
        })

        // Get series name & position (from the order on the page)
        if (pageIsSeries) {
            story.SeriesName = document.querySelector('#pagetitle').firstChild.textContent.slice(0, -4)
            story.SeriesPosition = id + 1
            story.SeriesURL = currentURL
        } else {
            const seriesInfo = thisFic.querySelector('p.small > a')
            story.SeriesName = seriesInfo?.textContent || ''
            story.SeriesURL = seriesInfo?.href || ''
        }

        trimVals(story)

        // Copy to clipboard in the selected format
        const thisFormat = copyTo[formatSelector.value]
        const missingContent = (story.SeriesName && !story.SeriesPosition) ? '[position in series unknown]' : ''
        copyAndAlert(thisFormat.format, thisFormat.message, missingContent)

    }

    function copyAndAlert(text, successMsg, warning) {
        missingContentDiv.textContent = warning
        const msg = copyToClipboard(text) && successMsg
        timedPopover(msg, 1500)
    }

    // DATA CLEANUP ------------------------------------------------------------------------------------
    function trimVals(storyObj) {
        for (const [key, value] of Object.entries(storyObj)) {
            if (typeof value === 'string') { storyObj[key] = value.trim() }
        }
    }

    // FUNCTIONS FROM THE AO3 SCRIPT "copy story data". MAKE ALL CHANGES THERE.-------------------------

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

    function propertiesAndValues(storyObj, assignChar, separator) {
        return Object
            .keys(storyObj)
            .map(k => k + assignChar + storyObj[k]).join(separator)
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

    GM_addStyle (`
        .format-selector {
            float: right;
            & label {
                font-weight: bold;
                margin-right: 0.5rem;
            }
        }
        .copy-btn {
            border-radius: 4px;
            margin-right: 0.5rem;
            font-size: 85%;
            line-height: 0;
            aspect-ratio: 1.05;
        }
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
    `)
})()
