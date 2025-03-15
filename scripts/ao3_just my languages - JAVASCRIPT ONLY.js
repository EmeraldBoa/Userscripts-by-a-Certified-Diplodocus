// ==UserScript==
// @name         AO3: just my languages - JAVASCRIPT ONLY
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.0
// @description  Reduce language options to your preferences
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/*
// @exclude      /^https?:\/\/archiveofourown\.org\/(?!((bookmarks|works)\/search)|((users|tags)\/.*\/(works|bookmarks)))/
// @icon         data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>𒈾</text></svg>
// @grant        none
// ==/UserScript==

/* jshint esversion:6 */ //          allows "let" in greasemonkey?

/* PURPOSE: Simplify language search options on AO3. Choose any combination of the following:
    1 - Show only your chosen languages in the dropdown list
    2 - Bold some languages in the dropdown (can be chosen independently from option 1)
    3 - Multilingual search by default: add a query to each search to show fic in all your chosen languages at once (e.g. English AND Spanish AND Thai)
    4 - Monolingual search by default: automatically set the dropdown to your preferred language
----------------------------------------------------------------------------------------------------------------------
*/

//TODO: thorough rewrite based on latest version

(function() {
    'use strict';
    let index = 0

    /* ================================= USER SETTINGS (save to text file in case of script updates) =================================

    LANGUAGE CODES are listed at the end of this script. (AO3 appears to use a mix of 2 and 3-character codes.)
    Leave blank for the AO3 default appearance.

    OPTIONAL: autofill new searches to your chosen language(s). Filters can still be changed by hand.
    This carries a small risk of hiding mistagged fics, so is disabled by default (useAutofill = 0).
        0 - AO3 default (blank dropdown)
        1 - MONOLINGUAL autofill (fills the dropdown with your preferred language)
        2 - MULTILINGUAL autofill (adds a search query to show fic in all your preferred languages at once)
               * note: may be slower / have more impact on the servers. If noticeable, try reducing the number of languages. */

    let shortenFilterDropdown = true
    let shortenEditorDropdown = true
    let useAutofill = 0

    let myLanguages = ['en', 'es', 'fr', 'ptBR', 'ptPT', 'sux'] //    <- dropdown will show only these
    let boldedLanguages = ['en', 'es', 'fr']
    let multiLanguages = ['ptBR', 'ptPT', 'sux']
    let defaultLanguage = 'es'

    /*
    - bold myLanguages in main list
    - bold multiLanguages in shortened list
    - show main languages only, ignore multilanguages
    */
    // ===============================================================================================================================

    if (multiLanguages.some(Boolean)==false) {
        multiLanguages = myLanguages
    }

    // select the elements depending on the page
    let dropdown, searchbox
    if (window.location.href.match(/\/bookmarks/i)) {
        dropdown = document.querySelector('#bookmark_search_language_id')
        searchbox = document.querySelector('#bookmark_search_bookmarkable_query')
    } else {
        dropdown = document.querySelector('#work_search_language_id')
        searchbox = document.querySelector('#work_search_query')
    }

    // show only my languages (and the default 'blank' value) in the dropdown
    if (myLanguages.length > 0) {
        dropdown.children().style.display = 'none'
        dropdown.children('[value=""]').style.display = ''
        for (index = 0; index < myLanguages.length; ++index) {
            dropdown.children(`[value="${myLanguages[index]}"]`).show();
        }
    }

    // bold languages in the dropdown
    for (index = 0; index < myLanguages.length; ++index) {
        dropdown.children(`[value="${boldedLanguages[index]}"]`).css('font-weight','bold');
    }

    // Autofill (if the dropdown/searchbox are blank)
    //     1 - MONOLINGUAL AUTOFILL: set dropdown to the default language.
    //     2 - MULTILINGUAL AUTOFILL: insert search string into "Search within results / Any field": "language_id:egy OR language_id:sux"

    if (
        useAutofill==1
        && !dropdown.val()
    ) {

        dropdown.children(`[value="${defaultLanguage}"]`).attr('selected','selected')

    } else if (
        useAutofill==2
        && $.trim(searchbox.val()).length > 0
    ) {

        let languageFilters = 'language_id: ' + multiLanguages.join(' OR language_id: ');
        searchbox.val(languageFilters)
    }

    /*--------- LANGUAGE CODES ON AO3 ------------------------------------------------------------------------------------------------

so:  af Soomaali
afr: Afrikaans
ain: Aynu itak | アイヌ イタㇰ
ar:  العربية
amh: አማርኛ
egy: 𓂋𓏺𓈖 𓆎𓅓𓏏𓊖
arc: ܐܪܡܝܐ | ארמיא
hy:  հայերեն
ase: American Sign Language
ast: asturianu
id:  Bahasa Indonesia
ms:  Bahasa Malaysia
bg:  Български
bn:  বাংলা
jv:  Basa Jawa
ba:  Башҡорт теле
be:  беларуская
bos: Bosanski
br:  Brezhoneg
ca:  Català
ceb: Cebuano
cs:  Čeština
chn: Chinuk Wawa
crh: къырымтатар тили | qırımtatar tili
cy:  Cymraeg
da:  Dansk
de:  Deutsch
et:  eesti keel
el:  Ελληνικά
sux: 𒅴𒂠
en:  English
ang: Eald Englisċ
es:  Español
eo:  Esperanto
eu:  Euskara
fa:  فارسی
fil: Filipino
fr:  Français
frr: Friisk
fur: Furlan
ga:  Gaeilge
gd:  Gàidhlig
gl:  Galego
got: 𐌲𐌿𐍄𐌹𐍃𐌺𐌰
gyn: Creolese
hak: 中文-客家话
ko:  한국어
hau: Hausa | هَرْشَن هَوْسَ
hi:  हिन्दी
hr:  Hrvatski
haw: ʻŌlelo Hawaiʻi
ia:  Interlingua
zu:  isiZulu
is:  Íslenska
it:  Italiano
he:  עברית
kal: Kalaallisut
kan: ಕನ್ನಡ
kat: ქართული
cor: Kernewek
khm: ភាសាខ្មែរ
qkz: Khuzdul
sw:  Kiswahili
ht:  kreyòl ayisyen
ku:  Kurdî | کوردی
kir: Кыргызча
fcs: Langue des signes québécoise
lv:  Latviešu valoda
lb:  Lëtzebuergesch
lt:  Lietuvių kalba
la:  Lingua latina
hu:  Magyar
mk:  македонски
ml:  മലയാളം
mt:  Malti
mnc: ᠮᠠᠨᠵᡠ ᡤᡳᠰᡠᠨ
qmd: Mando&#39;a
mr:  मराठी
mik: Mikisúkî
mon: ᠮᠣᠩᠭᠣᠯ ᠪᠢᠴᠢᠭ᠌ | Монгол Кирилл үсэг
my:  မြန်မာဘာသာ
myv: Эрзянь кель
nah: Nāhuatl
nan: 中文-闽南话 臺語
ppl: Nawat
nl:  Nederlands
ja:  日本語
no:  Norsk
azj: Азәрбајҹан дили | آذربایجان دیلی
ce:  Нохчийн мотт
ood: ‘O’odham Ñiok
ota: لسان عثمانى
ps:  پښتو
nds: Plattdüütsch
pl:  Polski
ptBR:  Português brasileiro
ptPT:  Português europeu
pa:  ਪੰਜਾਬੀ
kaz: qazaqşa | қазақша
qlq: Uncategorized Constructed Languages
qya: Quenya
ro:  Română
ru:  Русский
sco: Scots
sq:  Shqip
sjn: Sindarin
si:  සිංහල
sk:  Slovenčina
slv: Slovenščina
gem: Sprēkō Þiudiskō
sr:  Српски
fi:  suomi
sv:  Svenska
ta:  தமிழ்
tat: татар теле
mri: te reo Māori
tel: తెలుగు
th:  ไทย
tqx: Thermian
bod: བོད་སྐད་
vi:  Tiếng Việt
cop: ϯⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ
tlh: tlhIngan-Hol
tok: toki pona
trf: Trinidadian Creole
tsd: τσακώνικα
chr: ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ
tr:  Türkçe
uk:  Українська
urd: اُردُو
uig: ئۇيغۇر تىلى
vol: Volapük
wuu: 中文-吴语
yi:  יידיש
yua: maayaʼ tʼàan
yue: 中文-广东话 粵語
zh:  中文-普通话 國語


 Userscript should activate only for these URLs: */
    // tags/*/works
    // tags/*/bookmarks
    // users/*/works
    // users/*/bookmarks
    // bookmarks/search*
    // works/search*

})(jQuery);