// ==UserScript==
// @name         📋🟦 Copy whofic data
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.1
// @description  Manually copy story info from whofic.com, formatted for Access or Reddit.
// @author       CertifiedDiplodocus
// @match        https://www.whofic.com/*
// @exclude      /^https?:\/\/www\.whofic\.com\/(?!(viewuser|series|titles)\.php).*/
// @icon         https://www.whofic.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

/* global GM_addStyle, GM_setValue, GM_getValue */

// *********************************************************************************
// Inserts a copy button before every work on the page. When a button is clicked,  *
// it copies the summary data (title, author, link...) of that particular story.   *
// A dropdown menu (top right) lets you select the format of the copied text:      *
// title || link || author...  for Access DB                                       *
// markdown                    for Reddit                                          *
// *********************************************************************************

/* TO DO // ***************************************************************
    [ ] remove jQuery
    [ ] expand to work on search pages / check that nothing breaks when page has no stories (i.e. that the .storyBlock class isn't recycled)
    [ ] check match/excludes
    [ ] get series
    [ ] add doctor (for ACCDB comments?)
*/

(function () {
    'use strict'

    const errPrefix = '[Copy Story Data - userscript] \n⚠ Error: '
    const currentURL = window.location.href

    GM_addStyle (`
        .format-selector {
            float: right;
            & span {
                font-weight: bold;
            }
        }
    `)

    class elWithAttr {
        constructor(type, attributes = {}) {
            const el = document.createElement(type)
            Object.entries(attributes).forEach(at => el.setAttribute(...at))
            return el
        }
    }


    // --------------------------------------------------------------------------------------------------
    // Create, format and append a labelled dropdown to select formats
    const copyFormat = {
        div: new elWithAttr('div', { class: 'format-selector' }),
        label: document.createElement('span'),
        selector: document.createElement('select'),
    }
    copyFormat.label.textContent = 'Copy format:'
    const arrFormat = ['Access DB', 'Markdown'].map(format => new Option(format)) // .value defaults to .text
    copyFormat.selector.append(...arrFormat)
    copyFormat.div.append(copyFormat.label, copyFormat.selector)

    // Set dropdown to saved value, or default to "Access DB" if no saved value exists. On change, save the new value
    copyFormat.selector.value = GM_getValue('lastFormatSelected', 'Access DB')
    copyFormat.selector.addEventListener('change', function () { GM_setValue('lastFormatSelected', this.value) })

    const parentSection = (currentURL.match(/whofic.com\/series.php/)) ? '.jumpmenu' : '.sectionheader'
    document.querySelector(parentSection).append(copyFormat.div)

    // --------------------------------------------------------------------------------------------------
    // Insert copy buttons
    class copyBtn extends elWithAttr {
        constructor(icon, className) {
            super('button', { class: 'copy-btn' })
            this.addEventListener('click', copyThisStory)
            this.classList.add(className)
            this.innerHTML = icon
            return this
        }
    }

    const storyBlock = document.querySelectorAll('.storyBlock')
    for (const block of storyBlock) {
        block.firstElementChild.prepend(new copyBtn('&#128203;', 'for-AccessDB'))
    }

    // When a button is clicked, copy the corresponding storyBlock
    function copyThisStory() {
        const thisStory = this.parentElement.parentElement // <div class="storyBlock"><p><button>... // MAYBE get from prev assigned const storyBlock?
        const main = thisStory.querySelector('p')
        const mainAnchors = main.querySelectorAll('a')
        const details = thisStory.querySelectorAll('.list-inline')[1].querySelectorAll('.list-inline-item')

        const story = {
            Title: mainAnchors[0].textContent,
            Link: 'https://www.whofic.com/' + mainAnchors[0].href,
            Author: mainAnchors[1].textContent,
            Summary: main.innerHTML.split('<br>')[1], // Get everything after the <br>
            Wordcount: details[4].childNodes[1].textContent,
            IsComplete: details[3].childNodes[1].textContent, // TODO convert to boolean
        }

        // Get series name & position (from the order on the page)
        if (currentURL.match(/whofic.com\/series.php/)) {
            story.SeriesName = document.querySelector('#pagetitle').firstChild.textContent.slice(0, -4)
            // story.SeriesPosition = parseInt(i) + 1 // starting at 1 // TODO: get i
        }

        // Copy to clipboard in the selected format
        let formattedOutput
        switch (copyFormat.selector.value) {
            case 'Access DB':
                formattedOutput = propertiesAndValues(story, '=', '; ')
                break
            case 'Markdown':
                formattedOutput = `[*${story.Title}*](${story.Link}), by **${story.Author}** (${round(story.Wordcount)} words)\n\n`
                    + `> ${story.Summary}`
        }
        copyAndAlert(formattedOutput, 'Copied to ' + copyFormat.selector.text)

    }

    function copyAndAlert(text, successMsg) {
        const msg = copyToClipboard(text) && successMsg
        timedPopover(msg, 1500)
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
    const copyAlert = new elWithAttr('div', { class: 'copy-alert' }) // MAYBE popover - new in 2025
    const txtDiv = document.createElement('div')
    const noSummaryDiv = new elWithAttr('div', { class: 'no-summary' })
    // noSummaryDiv.textContent = !story.Summary ? '[no summary]' : ''
    copyAlert.append(txtDiv, noSummaryDiv)
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

})()
