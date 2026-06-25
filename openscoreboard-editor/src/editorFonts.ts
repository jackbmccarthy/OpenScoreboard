import { GoogleFontOption, googleFontOptions } from './googleFontOptions';

const openFontsCommand = 'open-fonts';
const googleFontsServer = import.meta.env.VITE_GOOGLE_FONTS_SERVER_URL || 'https://fonts.googleapis.com';
const fontLinkAttribute = 'data-osb-google-font';
const fontPreviewLinkAttribute = 'data-osb-google-font-preview';
const fontManagerButtonClass = 'osb-font-manager-button';

type EditorFont = GoogleFontOption & {
    name?: string;
    variants?: string[];
    value?: string;
};

function getInstalledFonts(editor): EditorFont[] {
    return editor.getModel?.().get('fonts') || [];
}

function getFontFamily(font: EditorFont) {
    return font.family || font.name || '';
}

function getFontCategory(font: Partial<EditorFont>) {
    const family = font.family || font.name || '';
    const knownFont = googleFontOptions.find((option) => option.family.toLowerCase() === family.toLowerCase());

    return font.category || knownFont?.category || 'sans-serif';
}

function getCssFontFallback(category: EditorFont['category']) {
    if (category === 'handwriting') {
        return 'cursive';
    }

    if (category === 'display') {
        return 'sans-serif';
    }

    return category;
}

function getFontValue(font: EditorFont) {
    const family = getFontFamily(font);

    return font.value || `"${family}", ${getCssFontFallback(getFontCategory(font))}`;
}

function getFontUrl(font: Partial<EditorFont>) {
    const family = font.family || font.name || '';
    const fontName = family.trim().replace(/\s+/g, '+');

    if (!fontName) {
        return '';
    }

    return `${googleFontsServer}/css2?family=${fontName}${getVariantAxis(font.variants)}&display=swap`;
}

function getVariantAxis(variants: string[] = []) {
    const pairs = variants
        .map((variant) => {
            const value = String(variant);
            const italic = value.includes('italic') ? 1 : 0;
            const weightMatch = value.match(/\d+/);
            const weight = weightMatch ? Number(weightMatch[0]) : 400;

            return `${italic},${weight}`;
        })
        .filter((pair, index, list) => list.indexOf(pair) === index)
        .sort();

    if (!pairs.length || (pairs.length === 1 && pairs[0] === '0,400')) {
        return '';
    }

    return `:ital,wght@${pairs.join(';')}`;
}

function toEditorFont(font: GoogleFontOption): EditorFont {
    return {
        ...font,
        name: font.family,
        variants: ['regular'],
        value: `"${font.family}", ${getCssFontFallback(font.category)}`,
    };
}

function setInstalledFonts(editor, fonts: EditorFont[]) {
    editor.getModel?.().set('fonts', fonts);
}

function mergeInstalledFonts(editor, fontsToInstall: EditorFont[]) {
    const installedFonts = getInstalledFonts(editor);
    const installedFamilies = new Set(installedFonts.map((font) => getFontFamily(font).toLowerCase()));
    const nextFonts = [...installedFonts];

    fontsToInstall.forEach((font) => {
        const family = getFontFamily(font).toLowerCase();

        if (!family || installedFamilies.has(family)) {
            return;
        }

        installedFamilies.add(family);
        nextFonts.push(font);
    });

    setInstalledFonts(editor, nextFonts);
}

function installGoogleFont(editor, font: GoogleFontOption) {
    const fonts = getInstalledFonts(editor);

    if (!fonts.some((installedFont) => getFontFamily(installedFont).toLowerCase() === font.family.toLowerCase())) {
        setInstalledFonts(editor, [...fonts, toEditorFont(font)]);
    }

    refreshEditorFontControls(editor);
}

function getFontSearchTextFromProject(editor, projectData = null) {
    const parts = [];

    if (projectData) {
        try {
            parts.push(JSON.stringify(projectData));
        }
        catch (error) {
            console.warn('Unable to inspect project data for fonts.', error);
        }
    }

    try {
        parts.push(editor.getCss?.() || '');
        parts.push(editor.getHtml?.() || '');
        parts.push(JSON.stringify(editor.getProjectData?.() || {}));
    }
    catch (error) {
        console.warn('Unable to inspect editor content for fonts.', error);
    }

    return parts.join('\n').toLowerCase();
}

function getGoogleFontsUsedByProject(editor, projectData = null) {
    const searchText = getFontSearchTextFromProject(editor, projectData);

    if (!searchText) {
        return [];
    }

    return googleFontOptions
        .filter((font) => {
            const family = font.family.toLowerCase();
            const quotedFamily = `"${family}"`;
            const singleQuotedFamily = `'${family}'`;
            const escapedQuotedFamily = `\\"${family}\\"`;

            return searchText.includes(quotedFamily) ||
                searchText.includes(singleQuotedFamily) ||
                searchText.includes(escapedQuotedFamily) ||
                searchText.includes(`family=${family.replace(/\s+/g, '+')}`) ||
                searchText.includes(`font-family:${family}`) ||
                searchText.includes(`font-family: ${family}`) ||
                searchText.includes(`font-family\\":\\"${family}`) ||
                searchText.includes(`font-family\\": \\"${family}`);
        })
        .map(toEditorFont);
}

function installFontsUsedByProject(editor, projectData = null) {
    const fontsUsedByProject = getGoogleFontsUsedByProject(editor, projectData);

    if (!fontsUsedByProject.length) {
        return;
    }

    mergeInstalledFonts(editor, fontsUsedByProject);
    refreshEditorFontControls(editor);
}

function removeGoogleFont(editor, family: string) {
    setInstalledFonts(
        editor,
        getInstalledFonts(editor).filter((font) => getFontFamily(font) !== family),
    );
    refreshEditorFontControls(editor);
}

function getDefaultFontOptions(editor) {
    return editor.StyleManager?.getBuiltIn?.('font-family')?.options || [];
}

function refreshEditorFontControls(editor) {
    const fonts = getInstalledFonts(editor);
    const fontProperty = editor.StyleManager?.getProperty?.('typography', 'font-family');

    if (fontProperty) {
        const options = [
            ...getDefaultFontOptions(editor),
            ...fonts.map((font) => ({
                ...font,
                name: getFontFamily(font),
                value: getFontValue(font),
            })),
        ];
        const seen = new Set<string>();

        fontProperty.setOptions(options.filter((option) => {
            const value = option.value || option.name;

            if (seen.has(value)) {
                return false;
            }

            seen.add(value);
            return true;
        }));
    }

    addFontLinksToDocument(editor.Canvas?.getDocument?.(), fonts, fontLinkAttribute);
    addFontLinksToDocument(document, fonts, fontLinkAttribute);
}

function addFontLinksToDocument(doc: Document | undefined, fonts: Partial<EditorFont>[], attribute: string) {
    if (!doc?.head) {
        return;
    }

    doc.head.querySelectorAll(`[${attribute}]`).forEach((element) => element.remove());

    const urls = fonts
        .map(getFontUrl)
        .filter(Boolean)
        .filter((url, index, list) => list.indexOf(url) === index);

    urls.forEach((href) => {
        const link = doc.createElement('link');
        link.setAttribute(attribute, 'true');
        link.rel = 'stylesheet';
        link.href = href;
        doc.head.appendChild(link);
    });
}

function getFilteredFonts(query: string, category: string) {
    const normalizedQuery = query.trim().toLowerCase();

    return googleFontOptions.filter((font) => {
        const matchesQuery = !normalizedQuery || font.family.toLowerCase().includes(normalizedQuery);
        const matchesCategory = !category || font.category === category;

        return matchesQuery && matchesCategory;
    });
}

function renderFontManager(editor, wrapper: HTMLElement) {
    const queryInput = wrapper.querySelector<HTMLInputElement>('[data-font-search]');
    const categorySelect = wrapper.querySelector<HTMLSelectElement>('[data-font-category]');
    const installedContainer = wrapper.querySelector<HTMLElement>('[data-installed-fonts]');
    const availableContainer = wrapper.querySelector<HTMLElement>('[data-available-fonts]');
    const countElement = wrapper.querySelector<HTMLElement>('[data-font-count]');
    const query = queryInput?.value || '';
    const category = categorySelect?.value || '';
    const installedFonts = getInstalledFonts(editor);
    const installedFamilies = new Set(installedFonts.map((font) => getFontFamily(font)));
    const visibleFonts = getFilteredFonts(query, category);

    addFontLinksToDocument(document, visibleFonts, fontPreviewLinkAttribute);

    if (countElement) {
        countElement.textContent = `Showing ${visibleFonts.length} fonts`;
    }

    if (installedContainer) {
        installedContainer.innerHTML = installedFonts.length
            ? installedFonts.map((font) => `
                <div class="osb-font-row">
                    <div>
                        <strong style="font-family:${getFontValue(font)}">${getFontFamily(font)}</strong>
                        <span>${getFontCategory(font)}</span>
                    </div>
                    <button type="button" data-remove-font="${getFontFamily(font)}">Remove</button>
                </div>
            `).join('')
            : '<div class="osb-font-empty">No fonts added yet.</div>';
    }

    if (availableContainer) {
        availableContainer.innerHTML = visibleFonts.map((font) => {
            const installed = installedFamilies.has(font.family);

            return `
                <div class="osb-font-row">
                    <div>
                        <strong style="font-family:'${font.family}', ${getCssFontFallback(font.category)}">${font.family}</strong>
                        <span>${font.category}</span>
                        <small style="font-family:'${font.family}', ${getCssFontFallback(font.category)}">Scoreboard Preview 0123456789</small>
                    </div>
                    <button type="button" data-add-font="${font.family}" ${installed ? 'disabled' : ''}>${installed ? 'Added' : 'Add'}</button>
                </div>
            `;
        }).join('');
    }
}

function registerStaticFontManager(editor) {
    editor.Commands.add(openFontsCommand, {
        run: () => {
            const wrapper = document.createElement('div');
            wrapper.className = 'osb-font-manager';
            wrapper.innerHTML = `
                <style>
                    .osb-font-manager { display: flex; flex-direction: column; gap: 12px; min-width: 320px; max-height: 72vh; }
                    .osb-font-toolbar { display: grid; grid-template-columns: 1fr minmax(120px, 170px); gap: 8px; }
                    .osb-font-toolbar input, .osb-font-toolbar select {
                        background: var(--gjs-main-light-color, #343434);
                        border: 1px solid var(--gjs-light-border, #555);
                        border-radius: 4px;
                        color: var(--gjs-font-color, #ddd);
                        padding: 8px;
                    }
                    .osb-font-section { display: flex; flex-direction: column; gap: 8px; }
                    .osb-font-list { display: flex; flex-direction: column; gap: 8px; overflow: auto; padding-right: 2px; }
                    .osb-font-list--available { max-height: 42vh; }
                    .osb-font-row {
                        align-items: center;
                        border: 1px solid var(--gjs-light-border, #555);
                        border-radius: 6px;
                        display: flex;
                        gap: 10px;
                        justify-content: space-between;
                        padding: 8px 10px;
                    }
                    .osb-font-row div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                    .osb-font-row strong { color: var(--gjs-font-color-active, #fff); font-size: 18px; line-height: 1.2; }
                    .osb-font-row span, .osb-font-row small, .osb-font-count {
                        color: var(--gjs-font-color, #ccc);
                        font-size: 12px;
                    }
                    .osb-font-row button {
                        background: #2d5bff;
                        border: 0;
                        border-radius: 4px;
                        color: #fff;
                        cursor: pointer;
                        padding: 6px 10px;
                    }
                    .osb-font-row button[disabled] { cursor: default; opacity: .55; }
                    .osb-font-empty {
                        border: 1px dashed var(--gjs-light-border, #555);
                        border-radius: 6px;
                        color: var(--gjs-font-color, #ccc);
                        padding: 12px;
                        text-align: center;
                    }
                </style>
                <div class="osb-font-toolbar">
                    <input data-font-search type="search" placeholder="Search fonts" />
                    <select data-font-category>
                        <option value="">All categories</option>
                        <option value="sans-serif">Sans serif</option>
                        <option value="serif">Serif</option>
                        <option value="display">Display</option>
                        <option value="monospace">Monospace</option>
                        <option value="handwriting">Handwriting</option>
                    </select>
                </div>
                <div class="osb-font-section">
                    <strong>Installed fonts</strong>
                    <div class="osb-font-list" data-installed-fonts></div>
                </div>
                <div class="osb-font-section">
                    <strong>Available fonts</strong>
                    <span class="osb-font-count" data-font-count></span>
                    <div class="osb-font-list osb-font-list--available" data-available-fonts></div>
                </div>
            `;

            wrapper.querySelector('[data-font-search]')?.addEventListener('input', () => renderFontManager(editor, wrapper));
            wrapper.querySelector('[data-font-category]')?.addEventListener('change', () => renderFontManager(editor, wrapper));
            wrapper.addEventListener('click', (event) => {
                const target = event.target;

                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const fontToAdd = target.dataset.addFont;
                const fontToRemove = target.dataset.removeFont;

                if (fontToAdd) {
                    const font = googleFontOptions.find((option) => option.family === fontToAdd);

                    if (font) {
                        installGoogleFont(editor, font);
                        renderFontManager(editor, wrapper);
                    }
                }

                if (fontToRemove) {
                    removeGoogleFont(editor, fontToRemove);
                    renderFontManager(editor, wrapper);
                }
            });

            editor.Modal.open({
                title: 'Fonts',
                content: wrapper,
            });

            renderFontManager(editor, wrapper);
        },
    });
}

function ensureFontManagerButtonStyles() {
    if (document.querySelector('[data-osb-font-manager-button-styles]')) {
        return;
    }

    const style = document.createElement('style');
    style.setAttribute('data-osb-font-manager-button-styles', 'true');
    style.innerHTML = `
        .gjs-sm-property__font-family .gjs-sm-label {
            align-items: center;
            display: flex;
            gap: 6px;
        }

        .gjs-sm-property__font-family .gjs-sm-label .gjs-sm-icon {
            flex: 1;
            min-width: 0;
        }

        .${fontManagerButtonClass} {
            align-items: center;
            background: #2d5bff;
            border: 0;
            border-radius: 4px;
            color: #fff;
            cursor: pointer;
            display: inline-flex;
            font-size: 16px;
            font-weight: 700;
            height: 20px;
            justify-content: center;
            line-height: 1;
            padding: 0;
            width: 20px;
        }

        .${fontManagerButtonClass}:hover {
            background: #446dff;
        }
    `;
    document.head.appendChild(style);
}

function attachFontManagerButton(editor) {
    ensureFontManagerButtonStyles();

    const fontProperty = document.querySelector('.gjs-sm-property__font-family');
    const label = fontProperty?.querySelector('.gjs-sm-label');

    if (!label || label.querySelector(`.${fontManagerButtonClass}`)) {
        return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = fontManagerButtonClass;
    button.title = 'Add Google fonts';
    button.setAttribute('aria-label', 'Add Google fonts');
    button.textContent = '+';
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        editor.runCommand(openFontsCommand);
    });

    label.appendChild(button);
}

function observeFontManagerButton(editor) {
    const container = document.querySelector('#style-manager-container');

    if (!container || container.getAttribute('data-osb-font-manager-observer')) {
        return;
    }

    container.setAttribute('data-osb-font-manager-observer', 'true');
    const observer = new MutationObserver(() => {
        window.requestAnimationFrame(() => attachFontManagerButton(editor));
    });

    observer.observe(container, { childList: true, subtree: true });
    attachFontManagerButton(editor);
}

export function loadGoogleFonts(editor) {
    editor.on('storage:start:store', (data) => {
        data.fonts = getInstalledFonts(editor);
    });

    const refresh = () => refreshEditorFontControls(editor);
    editor.on('storage:end:load', (data) => {
        const fonts = data?.fonts || data?.projectData?.fonts;

        if (Array.isArray(fonts)) {
            mergeInstalledFonts(editor, fonts);
        }

        installFontsUsedByProject(editor, data?.projectData || data);
        refresh();
    });
    editor.on('project:load', (projectData) => {
        installFontsUsedByProject(editor, projectData);
        refresh();
    });
    editor.on('canvas:frame:load load', refresh);
    editor.on('style:target style:custom styleManager:update selector:custom component:selected component:toggled', () => {
        window.requestAnimationFrame(() => attachFontManagerButton(editor));
    });

    registerStaticFontManager(editor);
    window.requestAnimationFrame(() => observeFontManagerButton(editor));
}

export function getEditorFontImportCss(editor) {
    const fonts = getInstalledFonts(editor);
    const urls = fonts
        .map(getFontUrl)
        .filter(Boolean)
        .filter((url, index, list) => list.indexOf(url) === index);

    if (!urls.length) {
        return '';
    }

    return `${urls.map((url) => `@import url('${url}');`).join('\n')}\n`;
}

export function getEditorCssWithFontImports(editor) {
    const fontImportCss = getEditorFontImportCss(editor);

    if (!fontImportCss) {
        return editor.getCss();
    }

    return `${fontImportCss}${stripExistingFontImports(editor.getCss())}`;
}

function stripExistingFontImports(css: string) {
    return css.replace(/@import\s+url\(['"]https?:\/\/[^'")]+\/css2\?family=[^'")]+['"]\);\s*/g, '');
}
