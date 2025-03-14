// ==UserScript==
// @name         =ÿ‡ﬁ AO3: secondary char&pairing filter CONFIG
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.0
// @description  Config script for AO3 secondary character&relationship filter - EXTENDED
// @author       CertifiedDiplodocus (from scriptfairy)
// @match        http*://archiveofourown.org/works*
// @match        http*://archiveofourown.org/tags*
// @exclude      /\/works\/[0-9].*/
// @exclude      /^https?:\/\/archiveofourown\.org(?!.*\/works)/
// @icon         https://upload.wikimedia.org/wikipedia/commons/8/8c/Cib-archive-of-our-own_%28CoreUI_Icons_v1.0.0%29.svg
// @license      GPL-3.0-or-later
// @grant        none
// @run-at       document-start
// ==/UserScript==
/* Icon by FSock on Wikimedia Commons. Licensed under CC4.0 https://creativecommons.org/licenses/by/4.0/deed.en
https://commons.wikimedia.org/wiki/File:Cib-archive-of-our-own_(CoreUI_Icons_v1.0.0).svg

Currently active on works/* and tags/* pages. To also enable on user pages, add the following line in the header:
    // @match        http*://archiveofourown.org/users/*
'------------------------------------------------------------------------------------------------------------------*/

(function() {
    'use strict';

    window.secondaryCharAndRelFilter = {

        /******************************** CONFIG **********************************/
        // Edit this file with your own settings, then check that both it and     //
        // the main script are enabled in Tampermonkey/Violentmonkey.             //
        // When the main script updates, your configuration will be unchanged.    //
        /**************************************************************************/

        ao3SaviorIsInstalled: true,
        // prevent conflicts with "ao3 savior" userscript. If true, adds a delay to allow ao3 savior to finish executing

        useRegex: true,
        // choose *wildcards (default) or regex (more flexible, for advanced users). Wildcards are usually enough for most purposes, but NOTE:
        //     - 'Naruto' (wildcard search) will match EXACTLY that character tag. To also match 'Naruto Uzumaki' and 'Uzumaki Naruto' you must enter '*Naruto*'
        //     - 'Naruto' (regex search) will match all tags containing that word, including 'Naruto Uzumaki's Evil Twin'. For an exact match, enter '^Naruto$'
        //     - If a name contains apostrophes, wrap it in double quotes: "O'Malley"
        // (more tips below)
        //----------------------------------------------------------------------------------------------------

        // You want to see one at least one of these relationships/character tags... (case insensitive)
        relationships: ['Eraserhead.*&.*Toshinori', 'Toshinori.*&.*Eraserhead'],
        characters: ['Yagi Toshinori', 'Toshinori Yagi', 'All Might',
                     'Aizawa Shouta', 'Shouta Aizawa', 'Eraserhead',
                     'Musashi . Jessie', 'Kojirou . James', 'Nyarth . Team Rocket Meowth', 'Team Rocket Trio',
                     'Spy.*Team Fortress 2', 'Ishtar'],

        relLim: 0, //  ...within the first N relationship tags. (0: ignore relationships)
        charLim: 3, // ...within the first N character tags. (0: ignore characters)

        //----------------------------------------------------------------------------------------------------

        // Relationships/characters you DON'T want to see...
        excludedRelationships: ['Eraserhead.*/.*Toshinori', 'Toshinori.*/.*Eraserhead'],
        excludedCharacters: ['Izuku', 'Bakugou'],

        xRelLim: 3, //   ...within the first X relationship tags (0: do nothing)
        xCharLim: 1, // ...within the first Y character tags    (0: do nothing)

        /*(†& don't use to block tags completely: AO3 savior will be faster †&)

        //----------------------------------------------------------------------------------------------------

        Example (with simple *wildcard matching): you want to find fics focusing on Han Solo, so
            characters: ['Han Solo']
            charLim: 3 (if he's in the first three characters)
        ...but don't want fics with Luke or Leia as the main characters, so
            excludedCharacters: ['Luke Skywalker', 'Leia*'] // matches 'Leia', 'Leia Organa' and 'Leia Skywalker'
            xCharLim: 1 (it's fine if they're in second place)
        This HIDES all fics with Luke or Leia in first place, as well as fics where Han is NOT in the first three.

        Example 2 (with regex): you don't want to read fics focusing on original characters, but don't mind if they're part of the story
            excludedCharacters: ['Original.*Character', 'O[FM]?C'] // matches 'Original Characters', 'Original Female Character', 'OC', 'OMC'...
            xCharLim: 2
        HIDE all fics with OCs in first or second place

        Example 3 (with regex): you want Katara shipfic *except* with Aang, but don't mind if they're in the background*/
        //  relationships: ['(!Aang.*/).*Katara.*(!/.*Aang)']
        /*          charLim: 1 (first ship is Katara/someone)
*/

/*      *** SOME NOTES ON REGEXP AND SEARCH RESULTS *******************************

        By default, the search matches any string containing the text in quotes:
            "Sherlock" matches "Sherlock (TV)", "Sherlock Holmes" and "Young Sherlock Holmes"
        For more control, use the regex symbols "^" (string start) and/or "$" (string end):
            "^Sherlock" matches "Sherlock Holmes" but not "Young Sherlock Holmes"
            "^Star Trek$" matches only "Star Trek", not "Star Trek: The Original Series" or "Star Trek: Picard"
        "." matches any single character:
            "Scooby.Doo" matches "Scooby Doo" and "Scooby-Doo"

        SPECIAL CHARACTERS: If a tag contains any of the following characters
        . + * ? ^ $ { } | \
        they must be preceded (escaped) with a backslash (e.g. "House M\.D\.")
        for the script to work. You can also replace them with "."(=match a single character)

        ( ) and [ ]
        must be escaped with a double backslash: "Thor \\(Marvel\\)"
        Or just use a period, which matches any character: "Thor .Marvel."
*/

    }

})();