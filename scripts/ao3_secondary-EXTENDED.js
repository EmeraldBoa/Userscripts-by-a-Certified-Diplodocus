// ==UserScript==
// @name         AO3: Secondary char&pairing filter - EXTENDED
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.0
// @description  Hide work if chosen tags are late in sequence, or if blacklisted tags are early
// @author       CertifiedDiplodocus (from scriptfairy)
// @match        http*://archiveofourown.org/works*
// @match        http*://archiveofourown.org/tags*
// @exclude      /\/works\/[0-9].*/
// @exclude      /^https?:\/\/archiveofourown\.org(?!.*\/works)/
// @icon         https://raw.githubusercontent.com/EmeraldBoa/Userscripts-by-a-Certified-Diplodocus/refs/heads/main/images/icons/ao3-logo-by-bingeling-GPL.svg
// @license      GPL-3.0-or-later
// @grant        none
// ==/UserScript==

/* AO3 logo designed by bingeling. Licensed under GNU 2+ https://commons.wikimedia.org/wiki/File:Archive_of_Our_Own_logo.png

Currently active on works/* and tags/* pages. To also enable on user pages, add the following line in the header:
    // @match        http*://archiveofourown.org/users/*

// TODO: list functions and changes from scriptfairy's version
'------------------------------------------------------------------------------------------------------------------*/
(function() {
    'use strict'

    // check that config extension is loaded, then pass variables
    if (!window.secondaryCharAndRelFilter) {throw new Error("⚠ AO3 Secondary tag filter CONFIG not loaded")}
    const config = window.secondaryCharAndRelFilter,
          relLim = config.relLim,
          charLim = config.charLim,
          xRelLim = config.xRelLim,
          xCharLim = config.xCharLim;

    // validation: remove incorrect values. If no valid characters/relationships are found, exit early
    const relationships = config.relationships.filter(Boolean && isString),
          characters = config.characters.filter(Boolean && isString),
          excludedRelationships = config.excludedRelationships.filter(Boolean && isString),
          excludedCharacters = config.excludedCharacters.filter(Boolean && isString),
          checkRels = (relationships.length > 0 && relLim > 0),
          checkChars = (characters.length > 0 && charLim > 0),
          checkXRels = (excludedRelationships.length > 0 && xRelLim > 0),
          checkXChars = (excludedCharacters.length > 0 && xCharLim > 0);
    if (!checkRels && !checkChars && !checkXRels && !checkXChars) { return }

    const delay = config.ao3SaviorIsInstalled ? 20 : 0 // add 20ms delay to prevent conflicts with AO3 savior (which runs after a 15ms delay)
    setTimeout(runEverything, delay)
    function runEverything() {

        // iterate through works
        const works = document.querySelectorAll('.work.blurb');
        for (let i=0; i < works.length; i++) {

            // If AO3 saviour hid the work, add no further warnings
            // TODO : consider modifying to use AO3's fold/message. Will it still work when AO3s is not installed? What if it updates?
            if (works[i].classList.contains('ao3-savior-work')) { continue } // go to next work

            // Get first n relationships/characters and check if any are in the user settings
            function getFirstNTags (tagClassString, tagLim, xTagLim) {
                return [...works[i].querySelectorAll(tagClassString)].slice(0, Math.max(tagLim, xTagLim)).map(tag => tag.textContent)
            }
            const firstNrels = (checkRels||checkXRels) && getFirstNTags('.relationships', relLim, xRelLim),
                  firstNchars = (checkChars||checkXChars) && getFirstNTags('.characters', charLim, xCharLim),
                  relMatch = checkRels && isMatch (firstNrels, relLim, relationships),
                  charMatch = checkChars && isMatch (firstNchars, charLim, characters),
                  xRelMatch = checkXRels && isMatch (firstNrels, xRelLim, excludedRelationships),
                  xCharMatch = checkXChars && isMatch (firstNchars, xCharLim, excludedCharacters);
             
            // Hide works which don't prioritise your characters/relationships. Add explanation and "show work" button.
            if ((relMatch || charMatch) && !(xRelMatch || xCharMatch)) { continue } // skip if at least one match and no blacklist
            works[i].classList.add('hiddenwork');

            const note = createNewElement('div', 'hidereasons'),
                  div1 = createNewElement('div', 'left', 'This work does not prioritize your preferred tags.'),
                  div2 = createNewElement('div', 'right'),
                  button = createNewElement('button', 'showwork', 'Show Work');

            button.addEventListener(
                'click', function() {
                    works[i].classList.remove('hiddenwork');
                    note.remove();
                });
            note.append(div1, div2)
            div2.append(button)
            works[i].after(note)
        }
    }

    const newCss = document.createElement('style')
    newCss.textContent = `
        .hidereasons {
            border:1px solid rgb(221,221,221);
            margin:0.643em 0em;
            padding:0.429em 0.75em;
            height:29px;
        }
        .hidereasons .left {
            float:left;
            padding-top:5px;
        }
        .hidereasons .right {
            float:right
        }
        li.hiddenwork {
            display:none
        }`;
    document.head.append(newCss)

    function isString (element) {return (typeof element === "string")}

    function createNewElement(elementType, className, textContent) {
        const el = document.createElement(elementType);
        el.className = className
        el.textContent = textContent
        return el
    }

    function isMatch (tagList, tagLim, userList) {
        tagList = tagList.slice(0, tagLim)
        for (let userTag of userList) {
            const pattern = config.useRegex ? userTag : wildcardPattern(userTag)
            const rx = RegExp(pattern, 'gi')
            for (let workTag of tagList) {
                if (rx.test(workTag)) { return true }
            }
        }
        return false
    }

    // REGEX ALTERNATIVES --------------------------------------------------------------------------------------
    // Format wildcard * search pattern (escaping all other special characters)
    function wildcardPattern (pattern) {
        pattern = '^' + pattern
                    .replaceAll (/[\.+?^=!:${}()|\]\[\/\\]/g, "\\$&")
                    .replaceAll ('*','.*')
                    + '$'
        return pattern
    }

    // Match test with wildcards (*) that does NOT use regex. --NIMG
    function wildcardMatch (userPattern, tagToTest) {
        userPattern = userPattern.toLowerCase()
        tagToTest = tagToTest.toLowerCase()
        let pattern = userPattern.split('*')
        if (pattern.length <= 1) return (userPattern===tagToTest)

        for (let i = 0, pos = 0; i < pattern.length; i++) {
            pos = tagToTest.indexOf(pattern[i], pos) // move to start of matched chunk
            if (pos < 0) {return false} // no match found
            pos += pattern[i].length; // move to end of current chunk
            switch (i) {
                case 0: // first: always matches if it's a wildcard, else can fail
                    if (pattern[i].length > 0 && pattern[i].length != pos) {return false}
                    break;
                case pattern.length - 1: // last: always matches if it's a wildcard, else can fail
                    if (pattern[i].length > 0 && tagToTest.length != pos) {return false}
            }
        }
        return true
    }

})();