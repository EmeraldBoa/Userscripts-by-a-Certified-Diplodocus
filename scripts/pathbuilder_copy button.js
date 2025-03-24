// ==UserScript==
// @name         Copy button for Pathbuilder
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.1
// @description  Adds a copy button to Pathbuilder's feat, feature and item descriptions.
// @author       CertifiedDiplodocus
// @match        http*://pathbuilder2e.com/app.html*
// @icon         https://pathbuilder2e.com/favicon.ico
// @license      GPL-3.0-or-later
// @grant        none
// @run-at       document-start
// ==/UserScript==

/* TODOs
        [ ] identify location
        [x] jquery or not? NOT. Do I want to use it?
        [ ] create simple button & add to page
        [ ] add copy code

// TODO IMPORTANT: Will it work even though the page only loads after the user clicks to load a character?

        Steps: 
            [ ] 1. Test adding button to feats page
            [ ] 2. Test on sidebar
----------------------------------------------------------------------------------------------------------------------*/

(function() {
    'use strict';

    // wait for body to load
    const docObserver = new MutationObserver (() => {
        if (document.body) {
            buildSheetObserver()
            docObserver.disconnect()
        }
    })
    docObserver.observe (document.documentElement, {childList: true})

    // wait for the user to load a character sheet (loader div is gone)
    function buildSheetObserver() {
        const sheetObserver = new MutationObserver (()=>{
            const sheetIsVisible = document.getElementById('main-container').offsetParent 
            //https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent

            if (sheetIsVisible) {
                modifyCharSheet()
                sheetObserver.disconnect()
            }
        })
        sheetObserver.observe (document.body, {childList: true})
    }

    function modifyCharSheet() {
        console.log('done! Run the rest of the script')

        // Character sheet section ----------------------------
        // Feats tab
        const featBlock = document.querySelector('.listview-item')
        const featNameDiv = featBlock.querySelector('.top-div.listview-topdiv')
        //const featNameDiv = document.querySelectorAll('.top-div.listview-topdiv')
        
        const featText = {
            Title: featBlock.querySelector('.listview-title').textContent,
            Info: featBlock.querySelector('.listview-detail').textContent
        }
        const formattedFeatText = `**${featText.Title}**
        ${featText.Info}`

        // Make button
        const buttonTest = createButton ('div', 'div-button-simple copy-button', function(event) {copyText(formattedFeatText, event)})
        featNameDiv.appendChild(buttonTest)

    }

    // &#128203; // html code for copy

    //for...of (for nodelists like queryselectorall)

    // copy function
    function copyText (text, clickEvent) {
        clickEvent.stopPropagation(); // stop from bubbling
        console.log('copied something!')
        copyToClipboard (text)
    }


    function copyToClipboard(text) {
        var dummy = document.createElement("textarea");
        // to avoid breaking orgain page when copying more words
        // cant copy when adding below this code
        // dummy.style.display = 'none'
        document.body.appendChild(dummy);
        //Be careful if you use textarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }

/*----------------------------------------------------------------------------------------------*/
    // Create a button with an event listener
    function createButton (elementType, buttonClass, callbackFunctionName) {
        const newButton = document.createElement (elementType)
        newButton.className = buttonClass
        newButton.textContent = '📋'
        newButton.addEventListener ('click', callbackFunctionName, false)
        return newButton
    }

    function createNewElement(elementType, className, textContent) {
        const el = document.createElement(elementType);
        el.className = className
        el.textContent = textContent
        return el
    }

})();