// ==UserScript==
// @name         AO3: highlight author fandoms CONFIG
// @namespace    https://greasyfork.org/en/users/757649-certifieddiplodocus
// @version      1.0
// @description  Config script for AO3 fandom highlighter
// @author       CertifiedDiplodocus
// @match        http*://archiveofourown.org/users/*
// @exclude      http*://archiveofourown.org/users/CertifiedDiplodocus*
// @exclude      /^https?:\/\/archiveofourown\.org\/users\/[^\/]+\/(?!pseuds)/
// @icon         https://upload.wikimedia.org/wikipedia/commons/8/8c/Cib-archive-of-our-own_%28CoreUI_Icons_v1.0.0%29.svg
// @license      GPL-3.0-or-later
// @grant        none
// @run-at       document-start
// ==/UserScript==

/* Icon by FSock on Wikimedia Commons. Licensed under CC4.0 https://creativecommons.org/licenses/by/4.0/deed.en
https://commons.wikimedia.org/wiki/File:Cib-archive-of-our-own_(CoreUI_Icons_v1.0.0).svg */

(function () {
    'use strict'

    window.fandomHighlighterConfig = {

        /** ****************************** CONFIG **********************************/
        // Edit this file with your own settings, then check that both it and     //
        // "AO3 fandom highlighter" are enabled in Greasemonkey/Tampermonkey.     //
        // When the main script updates, your configuration will be unchanged.    //
        /**************************************************************************/

        // Fill in your own username in the @exclude line above
        // to avoid lighting up your own dashboard.

        // Favourite fandoms list (regexp can be used - see below for tips)
        fandomsToHighlight: ['Original Work',
            'Alice in Wonderland .2010.', 'All Creatures Great and Small', 'Attack on Titan',
            '^Avatar:', 'Black Books', 'Blake\'s 7', 'Broadchurch', 'Buffy the Vampire Slayer',
            'Cabin Pressure', 'Campion', 'Cinderbrush', 'Colbert', 'Critical Role', 'Cowboy Bebop',
            'Daily Show', 'Discworld', 'Dishonored .Video Games.', 'Doctor Who',
            'Dresden Files', 'Dragon Age II', 'Dungeon Meshi',
            'Encanto', 'Fake News', 'Firefly', 'Fullmetal Alchemist',
            'Good Omens', 'Gravity Falls', 'Harry Potter', 'Hornblower', 'House M.D.',
            'Indiana Jones', 'Jonathan Creek', 'Jonathan Strange & Mr Norrell',
            'Kung Fu Panda', 'League of Legends', 'Life On Mars',
            'MASH', 'Mob Psycho 100', 'Monty Python', 'Mushishi', 'My Hero Academia', 'Mystery Skulls Animated',
            'Marvel Cinematic Universe', '^Marvel$', //                             **MCU**
            'The Avengers .Marvel', 'The Avengers - Ambiguous', //                  **MCU**
            '^Captain America', 'Guardians of the Galaxy', '^Iron Man .Movies.', // **MCU**
            '^Thor .Movies.', 'Loki', '^Doctor Strange', '^Captain Marvel', //      **MCU**
            'Naruto', 'Nimona', 'The Owl House', 'One-Punch Man',
            'Pirates of the Caribbean', 'Pokemon - All Media Types', 'Pokemon .Anime.', 'Sword & Shield',
            'Red Dwarf', 'Rick and Morty', 'Sagas of Sundry: Dread',
            'Scoob and Shag', 'Scooby.Doo', 'Sherlock', 'Sleepy Hollow', 'Spider-Verse',
            '^Star Trek$', 'Star Trek: (Alternate Original Series|The Next Generation|The Original Series)',
            '^Star Wars', 'Steven Universe', 'Stranger Things', 'Swallows and Amazons',
            'Team Fortress 2', 'The Brittas Empire', 'The Magnus Archives', 'The Thick of It',
            'The Umbrella Academy', 'Undeadwood', 'The X-Files', 'Tintin', 'Trigun', 'Welcome to Night Vale', 'Withnail & I'],

        // Fandoms to highlight in a different colour (specify colour for each).
        //    - overrides the default colour
        //    - you can add fandoms here without removing them from the first list

        fandomsInColour: { 'Die Hard': '#fda7d1', //    pink
            'Scooby Doo': '#adf7d1', //  light green
            '^Putin RPF': 'red', //      regexp patterns can be used
            'Naruto': 'orange', // named colors work too
        },

        // SOME NOTES ON REGEXP AND SEARCH RESULTS *******************************/

        // By default, the search matches any string containing the text in quotes:
        //     "Sherlock" matches "Sherlock (TV)", "Sherlock Holmes" and "Young Sherlock Holmes"
        // For more control, use the regex symbols "^" (string start) and/or "$" (string end):
        //     "^Sherlock" matches "Sherlock Holmes" but not "Young Sherlock Holmes"
        //     "^Star Trek$" matches only "Star Trek", not "Star Trek: The Original Series" or "Star Trek: Picard"
        // "." matches any single character:
        //     "Scooby.Doo" matches "Scooby Doo" and "Scooby-Doo"

        // SPECIAL CHARACTERS: If a fandom contains any of the following characters
        // . + * ? ^ $ { } | \
        // they must be preceded (escaped) with a backslash (e.g. "House M\.D\.")
        // for the script to work. You can also replace them with "."(=match any single character)
        //
        // ( ) and [ ]
        // must be escaped with a double backslash: "Thor \\(Marvel\\)"
        // Or just use a period, which matches any character: "Thor .Marvel."

        // FORMAT: enable/disable bold text, highlighting, and custom highlighting
        boldIsOn: true,
        highlightIsOn: true,
        customHighlightIsOn: true,

        highlightDefaultCol: 'LightYellow', // default highlight colour

    }

})()

// TODO: look into js documentation thingy
