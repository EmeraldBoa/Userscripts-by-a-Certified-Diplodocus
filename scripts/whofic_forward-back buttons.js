// ==UserScript==
// @name         Whofic forward/back buttons
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.0
// @description  Add first/last and forward/back buttons next to the chapter selector.
// @author       CertifiedDiplodocus
// @match        https://www.whofic.com/viewstory.php?*
// @icon         https://www.whofic.com/favicon.ico
// @grant        GM_addStyle
// @license      GPL-3.0-or-later
// ==/UserScript==

(function () {
    'use strict'

    // Split off the chapter number from the URL
    //     (https://www.whofic.com/viewstory.php?sid=7495&textsize=0&chapter=1) OR ("...chapter=1#)
    const storyURL = window.location.href.split('chapter=')
    if (storyURL.length < 2) { return }
    const partialURL = storyURL[0] + 'chapter=',
        currentChapter = Number(storyURL[1].replace('#', '')),
        lastChapter = document.querySelector('.textbox').options.length

    class chapButton {
        constructor(button) {
            const btn = document.createElement('a')
            btn.textContent = button.text
            btn.classList.add('chapter-button', button.class)
            btn.href = partialURL + button.targetChap
            btn.setAttribute('aria-label', button.ariaLabel)
            return btn
        }
    }

    const buttonInfo = {
        first: {
            text: '«', // ⏮
            class: 'btn-left',
            targetChap: 1,
            ariaLabel: 'First chapter',
        },
        last: {
            text: '»', // ⏭
            class: 'btn-right',
            targetChap: lastChapter,
            ariaLabel: 'Last chapter',
        },
        prev: {
            text: '‹', // ⏴
            class: 'btn-left',
            targetChap: currentChapter - 1,
            ariaLabel: 'Previous chapter',
        },
        next: {
            text: '›', // ⏵
            class: 'btn-right',
            targetChap: currentChapter + 1,
            ariaLabel: 'Next chapter',
        },
    }

    // Add margins between selectors & text.
    const chapSelector = document.getElementsByName('jump')
    chapSelector[0].classList.add('top-selector')
    chapSelector[1].classList.add('bottom-selector')

    // Place buttons to the left and right of the chapter selectors.
    chapSelector.forEach((selector) => {
        if (currentChapter != 1) {
            selector.prepend(
                new chapButton(buttonInfo.prev),
                new chapButton(buttonInfo.first)
            )
        }
        if (currentChapter != lastChapter) {
            selector.append(
                new chapButton(buttonInfo.next),
                new chapButton(buttonInfo.last)
            )
        }
    })

    // eslint-disable-next-line no-undef
    GM_addStyle (`
        a.chapter-button {
            border-radius: 4px;
            background-color: #e9e9ed;
            color: black;
            border: 1px solid grey;
            text-align: center;
            text-decoration: none;
            font-family: "PT Sans", Helvetica, Arial, sans-serif;
            padding: 0px 10px;
            display: inline-block;
            
            &:hover {
                background-color: lightgrey;
            }
            &:active {
                background-color: grey;
            }
            &.btn-left {
                margin-left: 0;
                margin-right: 5px;
            }
            &.btn-right {
                margin-left: 5px;
                margin-right: 0;
            }
        }
        form {
            &.top-selector {
                margin-bottom: 20px;
            }
            &.bottom-selector {
                margin-top: 20px;
            }
        }
    `)
})()
