// ==UserScript==
// @name         ao3 secondary char&pairing filter NIMG
// @namespace    https://greasyfork.org/en/users/36620
// @version      0.3.5
// @description  hides works if chosen tags are late in sequence
// @author       scriptfairy
// @match        http*://archiveofourown.org/works*
// @match        http*://archiveofourown.org/tags*
// @exclude      /\/works\/[0-9].*/
// @exclude      /^https?:\/\/archiveofourown\.org(?!.*\/works)/
// @grant        none
// ==/UserScript==

// MODIFIED -- NIMG
// If I ever share this, replace GM_addStyle with $('<style>').text(...).appendTo($('head'))

/* CONFIG ---------------------------------------------------------------------------------------
   keep a plaintext file of your config because they will not be saved when the script updates */

let relationships = [];
// the relationship tags you want to see (regex, case-insensitive, use '.' in place of special characters)

let characters = ['Yagi Toshinori', 'Toshinori Yagi', 'All Might',
                  'Aizawa Shouta', 'Shouta Aizawa', 'Eraserhead',
                  'Musashi . Jessie', 'Kojirou . James', 'Nyarth . Team Rocket Meowth', 'Team Rocket Trio',
                  'Spy.*Team Fortress 2', 'Ishtar', 3]
// the character tags you want to see (regex, case-insensitive, use '.' in place of special characters)

const relpad = 3;
// you want to see at least one of your relationships within this many relationship tags. Set 0 to ignore relationships

const charpad = 3;
// you want to see at least one of your characters within this many character tags. Set 0 to ignore characters

/* END CONFIG ----------------------------------------------------------------------------------*/

(function() {
    'use strict'

    // validation: remove incorrect values. If no valid characters/relationships are found, exit early
    relationships = relationships.filter(Boolean && isString)
    characters = characters.filter(Boolean && isString)
    const checkRels = (relationships.length > 0 && relpad > 0)
    const checkChars = (characters.length > 0 && charpad > 0)
    if (!checkRels && !checkChars) { return }

    // iterate through works
    const works = document.querySelectorAll('.work.blurb');
    for (let i=0; i < works.length; i++) {
        let relMatch, charMatch

        // Get first n relationships/characters and check if any are in the user settings
        if (checkRels) {
            let firstNrels = [...works[i].querySelectorAll('.work.blurb .relationships')]
            .slice(0, relpad)
            .map (tag => tag.textContent);
            relMatch = checkTagsAgainstRegex (relationships, firstNrels);
        }

        if (checkChars) {
            let firstNchars = [...works[i].querySelectorAll('.work.blurb .characters')]
            .slice(0, charpad)
            .map (tag => tag.textContent);
            charMatch = checkTagsAgainstRegex (characters, firstNchars);
        }

        if (relMatch || charMatch) { continue; } // if at least one match is found, don't hide work

        // Hide works which don't prioritise your characters/relationships. Add explanation and "show work" button.
        works[i].classList.add('hiddenwork');

        const fragment = document.createDocumentFragment();
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

        fragment.append(note)
        works[i].after(fragment)
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

    function checkTagsAgainstRegex (userList, tagList) {
        for (let userTag of userList) {
            let rx = RegExp(userTag, 'gi')
            for (let workTag of tagList) {
                if (rx.test(workTag)) { return true }
            }
        }
    }

    function createNewElement(elementType, className, textContent) {
        const el = document.createElement(elementType);
        el.className = className
        el.textContent = textContent
        return el
    }

    // UNUSED REGEX ALTERNATIVES --------------------------------------------------------------------------------------

    // Transform wildcard * search pattern (allowing all other special characters) to a functional regex, and execute .test
    function simpleRegex (pattern, str) {
        // const allowedChars = ['*'] // WIP: could use this to quickly modify the function and allow different levels of RegEx. Array of characters?
        function escapeRegex (s) { return s.replace(/[.*+?^=!:${}()|\]\[\/\\]/g, "\\$&") }
        pattern = "^" + pattern.split('*').map(escapeRegex).join('.*') + "$"
        return RegExp(pattern, 'i').test(str)
    }

    // Match test with wildcards (*) that does NOT use regex.
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