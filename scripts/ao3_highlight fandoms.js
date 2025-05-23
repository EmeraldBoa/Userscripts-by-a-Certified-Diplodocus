// ==UserScript==
// @name         AO3: highlight author fandoms
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.1.2
// @description  Highlight favourite fandoms in user page
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/users/*
// @exclude      http*://archiveofourown.org/users/CertifiedDiplodocus*
// @exclude      /^https?:\/\/archiveofourown\.org\/users\/[^\/]+\/(?!pseuds)/
// @icon         https://raw.githubusercontent.com/EmeraldBoa/Userscripts-by-a-Certified-Diplodocus/refs/heads/main/images/icons/ao3-logo-by-bingeling-GPL.svg
// @grant        none
// @license      GPL-3.0-or-later
// ==/UserScript==

/* jshint esversion:6 */ // ES6 in greasemonkey

/** PURPOSE: Highlight your favourite fandoms when when visiting another user's dashboard.
 *  - Add your username to the second exclude line to keep from lighting up your own page.
 *  - Will not highlight tags. If that's your goal, use this: https://greasyfork.org/en/scripts/424852-ao3-highlight-tags-v2)
 *
 * (Cannibalised from fangirlishness's ao3 Highlight tags V1, with thanks)
 */

(function () {
    'use strict'
    const errPrefix = '⚠ AO3 Fandom Highlighter CONFIG'

    // check that config extension is loaded, throw error if not
    if (!window.fandomHighlighterConfig) { throw new Error(`${errPrefix} not loaded`) }

    // pass variables from config script
    const config = window.fandomHighlighterConfig,
        fandomsToHighlight = config.fandomsToHighlight,
        fandomsInColour = config.fandomsInColour,
        highlightIsOn = config.highlightIsOn,
        boldIsOn = config.boldIsOn,
        customHighlightIsOn = config.customHighlightIsOn,
        highlightDefaultCol = config.highlightDefaultCol

    // check that settings make sense; if not, throw error and halt script
    if (!highlightIsOn && !boldIsOn && !customHighlightIsOn && !highlightDefaultCol) {
        throw new Error(`${errPrefix}: no highlight/bold/colours selected`)
    }
    if (!fandomsToHighlight.some(Boolean) && !fandomsInColour.some(Boolean)) {
        throw new Error(`${errPrefix}: no fandoms selected`)
    }

    // for each fandom in the list, iterate through fandoms, check against list, then highlight and/or bold
    document.querySelectorAll('#user-fandoms li>a').forEach((fandom) => {

        // custom highlighting, if applicable (priority over normal highlighting).
        if (customHighlightIsOn) {
            for (const [fandomRegex, col] of Object.entries(fandomsInColour)) {
                if (RegExp(fandomRegex, 'gi').test(fandom.textContent)) {
                    formatFandom(fandom, col)
                    return // go to next fandom
                }
            }
        }

        // default highlighting (user-defined colour).
        if (highlightIsOn || boldIsOn) {
            for (const fandomRegex of fandomsToHighlight) {
                if (RegExp(fandomRegex, 'gi').test(fandom.textContent)) {
                    formatFandom(fandom, highlightDefaultCol)
                    return // go to next fandom
                }
            }
        }
    })

    function formatFandom(fandom, colour) {
        fandom.style.backgroundColor = colour
        if (boldIsOn) fandom.style.fontWeight = 'bold'
    }

})()
