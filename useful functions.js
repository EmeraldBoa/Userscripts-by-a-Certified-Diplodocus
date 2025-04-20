/* eslint-disable userscripts/no-invalid-metadata */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^_" }] */
// use underscore before function names to prevent eslint error

/** Console log with paragraph breaks between arguments */
function _cons(...args) {
    args.forEach(x => console.log(x + '\n'))
}

/** Copy to clipboard, alert on error, return 'true' on success. */
async function _copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch (error) {
        const errMsg = 'Couldn\'t copy to clipboard.'
        alert (errMsg + ' See console for details.')
        console.error(
            errMsg, '\n\nLogged error:\n', error.message, `\n\ntext = "${text}"`
        )
    }
}

/** Custom rounding (1-300 exact, 300+ round to nearest 1000, 1k+) with 'k' units */
function round(n) {
    const rounding = [
        { to: 1, upperLim: 300 },
        { to: 100, upperLim: 1000 },
        { to: 1000 },
    ]
    const roundThis = rounding.find(interval => !(interval.upperLim < n))
    n = Math.round(n / roundThis.to) * roundThis.to
    if (n % 1000 === 0) { n = n / 1000 + 'k' }
    return n
}

/** CLASSES */
/** Create a single element with multiple attributes */
class _elWithAttr {
    constructor(type, attributes = {}) {
        const el = document.createElement(type)
        Object.entries(attributes).forEach(at => el.setAttribute(...at))
        return el
    }
}