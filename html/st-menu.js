// ==UserScript==
// @name         AO3: TEST filter menu
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      0.1
// @description  TEST filter menu in search pages
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/*
// @icon         https://raw.githubusercontent.com/EmeraldBoa/Userscripts-by-a-Certified-Diplodocus/refs/heads/main/images/icons/ao3-logo-by-bingeling-GPL.svg
// @grant        GM_addStyle
// @license      GPL-3.0-or-later
// ==/UserScript==

/*
[ ] hide filters by default, but show if any are loaded (similar to in my DB)
*/

(function () {
    'use strict'
    const $ = document.querySelector.bind(document) // shorthand for readability
    const $$ = document.querySelectorAll.bind(document)

    // check if menu is available
    const worksNavBar = $('.works-index ul.navigation.actions')
    if (!worksNavBar) { console.log('no valid page found'); return }

    // create & add menu button
    const btnEnable = createNewElement('li')
    btnEnable.insertAdjacentHTML('afterbegin', '<a href="#">▽▼</a>')
    const btnFilters = createNewElement('li')
    btnFilters.insertAdjacentHTML('afterbegin', '<a href="#">Tag filters</a>')
    worksNavBar.prepend(btnEnable, btnFilters)

    // create the menu div (TEMPORARY as string, for testing only)
    document.body.insertAdjacentHTML('beforeend', `
    <nav class="st-menu hidden">
        <section class="wrap">
            <div>
                <h3>Include</h3> (at least one)
                <button type="button" class="question">?</button>
            </div>
            <section class="tag-block include characters">
                <label>
                    <input type="checkbox">
                    Characters
                </label>
                <textarea class="tag-list" rows="5" placeholder="Gilgamesh, Enkidu"></textarea>
                <div class="within">...within the first <input type="text" class="tag-lim"> tags</div>
            </section>
            <section class="tag-block include relationships">
                <label>
                    <input type="checkbox">
                    Relationships
                </label>
                <textarea class="tag-list" rows="5" placeholder="Gilgamesh*Enkidu, Enkidu*Gilgamesh"></textarea>
                <div class="within">...within the first <input type="text" class="tag-lim"> tags</div>
            </section>
        </section>
        <section class="wrap">
            <div>
                <h3>Exclude</h3>
                <button type="button" class="question">?</button>
            </div>
            <section class="tag-block exclude characters">
                <label>
                    <input type="checkbox">
                    Characters
                </label>
                <textarea class="tag-list" rows="5"></textarea>
                <div class="within">...within the first <input type="text" class="tag-lim"> tags</div>
            </section>
            <section class="tag-block exclude relationships">
                <label>
                    <input type="checkbox">
                    Relationships
                </label>
                <textarea class="tag-list" rows="5" placeholder="*Ishtar*"></textarea>
                <div class="within">...within the first <input type="text" class="tag-lim"> tags</div>
            </section>
        </section>
        <section class="bottom">
            <fieldset>
                <legend>
                    Format
                    <button type="button" class="question">?</button>
                </legend>
                <label><input type="radio" name="format" id="wc" value="wc" checked>wildcards (*)</label>
                <label><input type="radio" name="format" id="rx" value="rx">regex</label>
            </fieldset>
            <button type="button">⚙️ Config, 💾 Import / Export </button>
            <button type="button">🡆 Apply filters</button>
        </section>
    </nav>`)
    const filterMenu = $('nav.st-menu')
    btnFilters.addEventListener('click', () => filterMenu.classList.toggle('hidden'))

    // functions --------------
    function createNewElement(elementType, className, textContent) {
        const el = document.createElement(elementType)
        className && (el.className = className)
        el.textContent = textContent
        return el
    }
    class elWithAttr {
        constructor(type, attributes = {}) {
            const el = document.createElement(type)
            Object.entries(attributes).forEach(at => el.setAttribute(...at))
            return el
        }
    }

    GM_addStyle(`
.st-menu {
    font-family: "Lucida Grande", "Lucida Sans Unicode", Verdana, Helvetica, sans-serif;
    font-size: 0.8em;
    position: fixed; /* relative to browser window */
        inset: 0;

    &.hidden {
        display:none
    }

    & h3, h4 {
        margin: unset;
        font-family: Georgia, serif;
    }
    & section {
        padding: 2px;
        &.tag-block {
            display: inline-block;
            width: 13rem;
        };
        &.wrap {
            border-bottom:solid 2px firebrick;
            min-width: max-content;
            margin-bottom: 7px
        };
        &.bottom {
            display: grid;
            grid-template-columns: 1.3fr 0.8fr;
            grid-template-rows: 1fr 1fr;
            column-gap: 10%;
        }
    }
    & div {
        margin:4px;
    }
    & button {
        margin: 2px;
        min-width: max-content; /*keep text on one line*/
    }
    
    /* INITIAL FILTER MENU */
    &, nav {
        background-color: antiquewhite;
        padding: 0.4em;
        max-width: min-content;
        & h3 {
            display: inline-block;
        }
    }
    & fieldset {
        grid-row-start: 1;
        grid-row-end:3;
        & legend {
            font-weight:bold;
            font-family: Georgia, serif;
        }
    }
    & textarea {
        resize: vertical;
        width: 100%;
        box-sizing: border-box;
        padding: 0.3em;
    }
    & input[type="checkbox"], input[type="radio"] {
        vertical-align: text-top /*align with label text*/
    }
    & label {
        vertical-align: middle;
    }
    & .within {
        text-align: right;
    }
    & .tag-lim {
        width: 1.1em;
    }
    & .question {
        padding:0 6px;
        margin: 0 1px;
        border: 1px solid;
        border-radius: 0.75em;
        font-size: 0.75em;
        vertical-align: super;
        cursor: help;
        font-family: Georgia, serif;
        font-weight: bold;
    }

    /**/

    &.popup {
        display: grid;
        row-gap: 0.3em;
        padding: 0.8em;
        & .head {
            display: grid;
            grid-template-columns: 50fr 1fr; /*align element to the far right, even if parent is very large */
            border-bottom: solid 2px firebrick;
        }
        & section:not(.head) h3 {
            display: block;
            border-bottom: solid 2px firebrick;
        }
        & button {
            &.exit-btn {
                width: 1.5em;
                &:hover {
                    color: firebrick;
                }
            }
        }
        & .underline {
            text-decoration: underline;
        }
        & .search-term {
            font-family: 'Courier New', Courier, monospace;
        }
        & .scrollable {
            overflow: auto;
        }
        &.config {
            background-color:azure;
            max-width: 17em;
        }
        &.info {
            font-size: 1em;
            background-color:floralwhite;
            max-width: 50em;
            height: 650px;
        }
        & li > table {
            margin: 0.5em 0; /*spacing around table*/
        }
        & table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8em;
            & th, td {
                padding: 0.4em;
                &.narrow {
                    width: 1em;
                }
            }
            &.match-exclude{
                border: 1px solid cadetblue;
                thead {
                    background-color: lightblue;
                    & th:nth-child(1), th:nth-child(2) { width: 8em; }
                }
                & td:nth-child(1), td:nth-child(2)  {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.9rem;
                    text-align: center;
                }
            }
            &:not(.match-exclude){
                border: 1px solid firebrick;
                & thead {
                    background-color: lightpink;
                    & th:nth-child(2) { width: 7em;}
                    & th:nth-child(4) { width: 1em;}
                }
                & th + th, td + td {
                    border-left: 1px solid palevioletred;
                }
                & td:nth-child(2), td:nth-child(3), td:nth-child(4) {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.9rem;
                }
                & td:nth-child(4) {
                    text-align: center;
                }
            }
        }
    }

}
    `)

})()
