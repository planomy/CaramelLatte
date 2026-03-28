/**
 * Clipboard export for plain text vs inline-styled HTML highlights.
 * Kept in a separate file so strings may contain "</script>" without breaking index.html parsing.
 */
(function () {
    'use strict';

    const HL_EXPORT_STYLES = {
        hl: 'display:inline',
        'hl-glue': 'background-color:#facc15;color:#000;',
        'hl-passive': 'background-color:#ef4444;color:#fff;',
        'hl-filter': 'background-color:#a855f7;color:#fff;',
        'hl-basic': 'background-color:#10b981;color:#fff;',
        'hl-adverb': 'background-color:#991b1b;color:#fff;',
        'hl-filler': 'background-color:#ec4899;color:#fff;',
        'hl-cliche': 'background-color:#64748b;color:#fff;',
        'hl-modal': 'background-color:#06b6d4;color:#000;',
        'hl-subjective': 'background-color:#f43f5e;color:#fff;',
        'hl-contraction': 'background-color:#f97316;color:#fff;',
        'hl-bad-start': 'border-left:4px solid #3b82f6;padding-left:3px;',
        'hl-frequent': 'border-bottom:2px dotted #d97706;padding-bottom:2px;'
    };

    function getEditor() {
        return document.getElementById('editor');
    }

    function applyExportStylesToHlSpans(root) {
        const walk = (el) => {
            for (const child of Array.from(el.childNodes)) {
                if (child.nodeType !== Node.ELEMENT_NODE) continue;
                if (child.tagName === 'BR') continue;
                if (child.classList && child.classList.contains('hl')) {
                    child.classList.remove('dimmed-focus');
                    const parts = ['padding:1px 0', 'border-radius:2px'];
                    const classes = Array.from(child.classList);
                    for (const cls of classes) {
                        const block = HL_EXPORT_STYLES[cls];
                        if (block) parts.push(block);
                    }
                    if (!parts.some((p) => p.indexOf('display:') === 0)) parts.unshift('display:inline');
                    child.setAttribute('style', parts.join(';'));
                    child.removeAttribute('class');
                    child.removeAttribute('data-tip-id');
                    child.removeAttribute('data-repeat-stem');
                }
                walk(child);
            }
        };
        walk(root);
    }

    function getExportHtmlFragmentString() {
        const editor = getEditor();
        if (!editor) return '<div></div>';
        const wrap = document.createElement('div');
        wrap.style.cssText =
            "font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.75;color:#262626;white-space:pre-wrap;word-wrap:break-word;";
        wrap.innerHTML = editor.innerHTML;
        applyExportStylesToHlSpans(wrap);
        return wrap.outerHTML;
    }

    /** Brief toast — #copy-toast in index.html */
    function showCopyToast(message, isError) {
        const el = document.getElementById('copy-toast');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('border-red-500/45', !!isError);
        el.classList.toggle('text-red-200/95', !!isError);
        el.classList.toggle('border-amber-600/35', !isError);
        el.classList.toggle('text-amber-100/95', !isError);
        el.classList.remove('opacity-0', 'translate-y-4');
        el.classList.add('opacity-100', 'translate-y-0');
        clearTimeout(el._toastTimer);
        el._toastTimer = setTimeout(function () {
            el.classList.add('opacity-0', 'translate-y-4');
            el.classList.remove('opacity-100', 'translate-y-0');
        }, 2600);
    }

    /** Plain text only: innerText is the rendered text without tags — highlights/underlines (CSS on spans) are not copied. */
    function copyPlainText() {
        const editor = getEditor();
        if (!editor) return;
        const text = editor.innerText;
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } finally {
            document.body.removeChild(ta);
        }
        if (ok) showCopyToast('Copied');
        else showCopyToast('Could not copy — select text and press Ctrl+C or ⌘C', true);
    }

    /** @returns {boolean} */
    function legacyCopyRichHtml(fragmentOuterHtml) {
        const host = document.createElement('div');
        host.contentEditable = 'true';
        host.style.position = 'fixed';
        host.style.left = '0';
        host.style.top = '0';
        host.style.opacity = '0';
        host.style.pointerEvents = 'none';
        host.innerHTML = fragmentOuterHtml;
        document.body.appendChild(host);
        const range = document.createRange();
        range.selectNodeContents(host);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } finally {
            sel.removeAllRanges();
            document.body.removeChild(host);
        }
        return ok;
    }

    async function copyWithHighlights() {
        const editor = getEditor();
        if (!editor) return;
        const plain = editor.innerText;
        const fragment = getExportHtmlFragmentString();
        const fullHtml =
            '<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"></head><body>' +
            fragment +
            '</body></html>';

        try {
            if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([fullHtml], { type: 'text/html' }),
                        'text/plain': new Blob([plain], { type: 'text/plain' })
                    })
                ]);
                showCopyToast('Copied with highlights');
                return;
            }
        } catch (e) {
            showCopyToast('Could not copy — try Copy text or allow clipboard access', true);
            return;
        }
        const legacyOk = legacyCopyRichHtml(fragment);
        if (legacyOk) showCopyToast('Copied with highlights');
        else showCopyToast('Rich copy failed — use Copy text', true);
    }

    window.copyPlainText = copyPlainText;
    window.copyWithHighlights = copyWithHighlights;
    window.copyToClipboard = copyPlainText;
})();
