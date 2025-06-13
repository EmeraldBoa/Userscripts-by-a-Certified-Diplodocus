/* eslint-disable userscripts/no-invalid-metadata */
/* eslint-disable no-unused-vars */

(() => {
    function addElements() {
        const dialogHtml = `
          <dialog id="tpf__modal" class="modal-closer tpf__modal-hidden">
              <div class="content userstuff">This is a test of the new dialog modal</div>
              <div class="footer"><span class="title"></span><button type="button" class="modal-closer">Close</button></div>
          </dialog>`
        document.body.insertAdjacentHTML('beforeend', dialogHtml)
        const openDialogBtn = '<li><button id="test-modal" class="showwork">Test</button></li>'
        document.querySelector('ul.user:nth-child(2)').insertAdjacentHTML('afterbegin', openDialogBtn)

        function GM_addStyle(css) {
            const style = document.createElement('style')
            style.type = 'text/css'
            style.id = 'tpf__modal-style'
            style.content = css
            document.head.appendChild(style)
        }
        GM_addStyle(`#tpf__modal {display: none; opacity: 0; transition: opacity 250ms ease-in; &::backdrop {/** start 500ms earlier */} }
      .tpf__show-modal {display: block; opacity: 1;}`)
    }
    let opener, myAo3Modal = {}
    function defineVars() {
        opener = document.querySelector('#test-modal')
        myAo3Modal = {
            window: document.querySelector('#tpf__modal'),
            content: document.querySelector('#tpf__modal .userstuff'),
            closeBtn: document.querySelector('#tpf__modal .modal-closer'),
        }
    }
    function addEventListeners() {
        opener.addEventListener('click', openMyModal)
        myAo3Modal.closeBtn.addEventListener('click', closeModal)
    }
    function removeEventListeners() {
        opener.removeEventListener('click', openMyModal)
        myAo3Modal.closeBtn.removeEventListener('click', closeModal)
    }
    addElements()
    defineVars()
    addEventListeners()
    myAo3Modal.window.close()

    console.log(opener, myAo3Modal.closeBtn)
    function openMyModal() {
        console.log('opened!')
        myAo3Modal.window.showModal()
        myAo3Modal.window.classList.add('tpf__show-modal')
    }

    function closeModal() {
        console.log('closed!')
        myAo3Modal.window.close()
        myAo3Modal.window.classList.remove('tpf__show-modal')
    }
})()


const $ = document.querySelector.bind(document) // shorthand for readability
const $$ = document.querySelectorAll.bind(document)
const enableVerboseLogging = true

// MAYBE : v2. create own modal <dialog> with styles

/*
    [x] fade in/out, with backdrop
    [ ] click outside to close (ESC is automatic) https://codepen.io/dvdvdmt/pen/BaavWbp
    [x] position on page
    [ ] box height
    [ ] add text
    [ ] add AO3 styling (unfortunately tied to #modal ID)... tiresome
    */
const infoModalHTML = `<div class="tpf__menu popup">
        <details class="info-section">
            <summary class="section-head">Basics</summary>
            <p>The script cannot use AO3's tag system, but instead <strong>matches
                    the literal tag text</strong>. <br>
                Add synonyms where necessary
                (e.g. <span class="search-term">Naruto Uzumaki, Uzumaki Naruto</span>).
                When searching for a specific relationship, you MUST include both permutations:
                <span class="search-term">A/B</span> and <span class="search-term">B/A</span>.
            </p>
            <ul>
                <li>Only character and relationship tags are checked.</li>
                <li>Comma = OR
                    <table class="matching-basics">
                        <thead>
                            <tr>
                                <th scope="col"></th>
                                <th scope="col">search term(s)</th>
                                <th scope="col" class="narrow">N</th>
                                <th scope="col">result</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>include characters</td>
                                <td>enkidu, gilgamesh</td>
                                <td>4</td>
                                <td>SHOW fics with "Enkidu" OR "Gilgamesh" within the first 4 character tags</td>
                            </tr>
                            <tr>
                                <td>exclude characters</td>
                                <td>enkidu, gilgamesh</td>
                                <td>4</td>
                                <td>HIDE fics with "Enkidu" OR "Gilgamesh" within the first 4 character tags</td>
                            </tr>
                        </tbody>
                    </table>
                </li>
                <li>
                    Search is case-insensitive and ignores diacritics (a = á, ä, ā), line breaks and extra spaces.
                    (Characters like ñ, ł, æ, ø, are letters, not diacritics: searching <span
                        class="search-term">Inigo</span> will match "<span class="str-match">Ín</span>igo" but not
                    "<span class="str-match">Íñ</span>igo")
                </li>
            </ul>
            <p>⚠ If you need a blacklist, <a href="https://greasyfork.org/en/scripts/3579-ao3-savior">AO3 savior</a>
                does it better.</p>
        </details>
        <details class="info-section">
            <summary class="section-head">How to filter</summary>
            <p>Choose between <strong>*wildcards</strong> (default) or <strong>regex</strong> (more flexible, for
                advanced users). <br>
                Wildcards are enough for most purposes:</p>
            <ul>
                <li>
                    <span class="search-term">uzumaki</span> ➜ matches "Naruto <span class="str-match">Uzumaki</span>",
                    "<span class="str-match">Uzumaki</span> Kushina"
                    but NOT "Uzumaki<span class="str-match">s</span>"
                </li>
                <li>
                    <span class="search-term">shika*</span> ➜ matches "<span class="str-match">Shika</span>ku" and
                    "<span class="str-match">Shika</span>maru Nara" but NOT "<span class="str-match">I</span>shikawa"
                </li>
            </ul>
            <p>Regex grants finer control, for example...</p>
            <ul>
                <li>alternate spellings: <span class="search-term">[RL]i[zs]a</span> ➜ Riza/Risa/Liza/Lisa
                </li>
                <li>limiting options: <span class="search-term">(Arnold|Ace).*Rimmer</span> ➜ don't match John or
                    Harold
                    Rimmer</li>
                <li>exclusions: <span class="search-term">[^(]doctor</span> ➜ match "The&nbsp;Doctor" but NOT
                    "The&nbsp;Master&nbsp;(Doctor&nbsp;Who)"
                </li>
            </ul>
            <details class="rx-cheatsheet">
                <summary class="cheatsheet-head">Regex cheatsheet</summary>
                <h4>Characters</h4>
                <dl>
                    <dt>.</dt>
                    <dd>any character</dd>
                    <dt>[abc]</dt>
                    <dd>any of a, b, or c</dd>
                    <dt>[^abc]</dt>
                    <dd>not a, b, or c</dd>
                    <dt>[a-g]</dt>
                    <dd>character between a &amp; g</dd>
                </dl>
                <h4>Operators</h4>
                <dl>
                    <dt>a* a+ a?</dt>
                    <dd>0 or more, 1 or more, 0 or 1 (.* = 0 or more of any character)</dd>
                    <dt>^abc$</dt>
                    <dd>start / end of the string (matches the exact tag "abc")</dd>
                    <dt>ab|cd</dt>
                    <dd>match ab OR cd</dd>
                    <dt>(abc)</dt>
                    <dd>group - e.g. (ab|cd)xy matches abxy or cdxy</dd>
                </dl>
                <h4>Special characters</h4>
                <dl>
                    <dt>. + * ? <br>^ $ | &#92; <br>{ } ( ) [ ]</dt>
                    <dd>
                        <p>can be:</p>
                        <ul>
                            <li>replaced with "." (=match any character)</li>
                            <li>escaped with &#92; ➜ &#92;? </li>
                            <li>enclosed in [] ➜ [?]</li>
                        </ul>
                    </dd>
                </dl>
                <p>See <a href="https://regexr.com/">https://regexr.com/</a> for more. Do note that the filter uses
                    javascript, which does not support all regex options.</p>
            </details>
        </details>
        <details class="info-section">
            <summary class="section-head">Examples</summary>
            <h5>Example 1 (with *wildcards)</h5>
            <table class="matching-examples">
                <thead>
                    <tr>
                        <th scope="col">We want…</th>
                        <th scope="col">setting</th>
                        <th scope="col">search term(s)</th>
                        <th scope="col">N</th>
                        <th scope="col">matches</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Fics with Leia in the first 3 character tags</td>
                        <td>Include Characters</td>
                        <td>leia</td>
                        <td>3</td>
                        <td>Leia, Leia Organa, Leia Skywalker</td>
                    </tr>
                    <tr>
                        <td>…that don't have Luke or Han as the main characters (it's fine if they're in second
                            place)
                        </td>
                        <td>Exclude Characters</td>
                        <td>luke skywalker, han solo</td>
                        <td>4</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            <h5>Example 2 (with *wildcards): <br></h5>
            <table class="matching-examples">
                <thead>
                    <tr>
                        <th scope="col">We want…</th>
                        <th scope="col">setting</th>
                        <th scope="col">search term(s)</th>
                        <th scope="col">N</th>
                        <th scope="col">matches</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>relationships with Servalan</td>
                        <td>Include Rels.</td>
                        <td>servalan</td>
                        <td>1</td>
                        <td>Servalan / Kerr Avon, Travis &amp; Servalan...</td>
                    </tr>
                </tbody>
            </table>
            <h5>Example 3 (with regex): <br></h5>
            <table class="matching-examples">
                <thead>
                    <tr>
                        <th scope="col">We want…</th>
                        <th scope="col">setting</th>
                        <th scope="col">search term(s)</th>
                        <th scope="col">N</th>
                        <th scope="col">matches</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><em>platonic</em> relationships with Servalan</td>
                        <td>Include Rels.</td>
                        <td>[^/]?servalan[^/]?</td>
                        <td>1</td>
                        <td>relationships containing "Servalan" but not "/"</td>
                    </tr>
                </tbody>
            </table>
            <h5>Example 4 (with regex): <br>
                you don't want to read fics focusing on original
                characters, but don't mind if they're part of the story.</h5>
            <table class="matching-examples">
                <thead>
                    <tr>
                        <th scope="col">We want…</th>
                        <th scope="col">setting</th>
                        <th scope="col">search term(s)</th>
                        <th scope="col">N</th>
                        <th scope="col">matches</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>to HIDE fics with OCs in first or second place</td>
                        <td>Exclude Characters</td>
                        <td>original.*character, O[FM]?C</td>
                        <td>1</td>
                        <td>Original Characters, Original Female Character, OC, OMC…</td>
                    </tr>
                </tbody>
            </table>
            <h5>Example 5a (with *wildcards)</h5>
            <table class="matching-examples">
                <thead>
                    <tr>
                        <th scope="col">We want…</th>
                        <th scope="col">setting</th>
                        <th scope="col">search term(s)</th>
                        <th scope="col">N</th>
                        <th scope="col">matches</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Katara/... as the first ship</td>
                        <td>Include Rels.</td>
                        <td>/*katara, katara*/</td>
                        <td>1</td>
                        <td>Aang / Katara, Katara / Toph, Katara / Zuko...</td>
                    </tr>
                    <tr>
                        <td>...EXCEPT Katara/Aang (okay in the background)</td>
                        <td>Exclude Rels.</td>
                        <td>aang/katara, katara/aang</td>
                        <td>2</td>
                        <td>Aang / Katara, Katara / Aang</td>
                    </tr>
                </tbody>
            </table>
            <p>Wait! In some fandoms this would work, but Avatar
                uses "Kataang", "Zutara", etc. <span class="search-term">"kat*, *ara"</span> would match those but
                also,
                e.g., "<span class="str-match">Kat</span>ara &amp; Sokka". <br>
                We could list them all, or...
            </p>
            <h5>Example 5b (with regex)</h5>
            <table class="matching-examples">
                <thead>
                    <tr>
                        <th scope="col">We want…</th>
                        <th scope="col">setting</th>
                        <th scope="col">search term(s)</th>
                        <th scope="col">N</th>
                        <th scope="col">matches</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Katara/... as the first ship </td>
                        <td>Include Rels.</td>
                        <td>/.*katara, katara.*/, ^kat[a-z]+$, ^[a-z]+tara$</td>
                        <td>1</td>
                        <td>as in 5a + "Kat..." followed by any letters without spaces + "...tara".</td>
                    </tr>
                    <tr>
                        <td>...EXCEPT Katara/Aang (fine if it's in the background)</td>
                        <td>Exclude Rels.</td>
                        <td>aang / katara, katara / aang</td>
                        <td>2</td>
                        <td>as in 5a</td>
                    </tr>
                </tbody>
            </table>
        </details>
    </div>`
const dialogHtml = `
        <dialog id="tpf__modal" class="modal-closer tpf__modal-hidden">
            <div class="content userstuff">${infoModalHTML}</div>
            <div class="footer"><span class="title"></span><a class="action modal-closer" href="#">Close</a></div>
        </dialog>`
document.body.insertAdjacentHTML('beforeend', dialogHtml)

// eslint-disable-next-line no-undef
GM_addStyle(`
    #tpf__modal {
        display: block;
        visibility: hidden;
        opacity: 0;
        transition: visibility 0ms, opacity 500ms ease-in;
        &::backdrop {
            background: rgba(0, 0, 0, 0.7);
        }
    }
    .tpf__show-modal {
        visibility: 1;
        opacity: 1;
    }
        `)

const myAo3Modal = {
    window: $('#tpf__modal'),
    content: $('#tpf__modal .userstuff'),
    closeBtn: $('#tpf__modal .action.modal-closer'),
}

myAo3Modal.closeBtn.addEventListener('click', closeModal)
function openMyModal() {
    debugLog('attempting to open modal...')
    myAo3Modal.window.showModal()
    myAo3Modal.window.classList.add('tpf__show-modal')
}
// add event listeners to the bg and close button, + esc, then do...
function closeModal() {
    myAo3Modal.window.closeModal()
    myAo3Modal.window.classList.remove('tpf__show-modal')
}


function debugLog(input) {
    if (enableVerboseLogging) { console.log(input) }
}
