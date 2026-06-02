import { viewAnimationOptions } from '../animationOptions';
import { scoreboardAnimationCSS } from '../../../openscoreboard-scoreboard/src/animations/scoreboardAnimations';
import {
    conditionalShowFieldList,
    courtSideGameFieldList,
    currentGameFieldList,
    imageFieldList,
    solidColorFieldList,
    teamFieldList,
    textFieldList,
} from '../fieldLists';

export type TestScoreboardTemplate = {
    css: string;
    description: string;
    html: string;
    id: string;
    name: string;
};

type FieldCard = {
    attrs?: Record<string, string>;
    field: string;
    kind?: 'text' | 'image' | 'color' | 'conditional' | 'timer';
    label: string;
    sample?: string | number;
};

const placeholderImage = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <rect width="320" height="180" fill="#202a44"/>
  <circle cx="160" cy="82" r="34" fill="#2d5bff"/>
  <text x="160" y="138" text-anchor="middle" font-family="Arial" font-size="20" fill="white">IMAGE</text>
</svg>
`)}`;

const aspectRatios = [
    ['16:9', '16 / 9'],
    ['9:16', '9 / 16'],
    ['16:10', '16 / 10'],
    ['4:3', '4 / 3'],
    ['3:2', '3 / 2'],
    ['5:4', '5 / 4'],
    ['1:1', '1 / 1'],
    ['21:9', '21 / 9'],
    ['32:9', '32 / 9'],
];

function escapeHtml(value: unknown) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function attrsToString(attrs: Record<string, string> = {}) {
    return Object.entries(attrs)
        .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
        .join(' ');
}

function labelFromField(field: string) {
    return field
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^is /, 'Is ')
        .replace(/\bA\b/g, 'A')
        .replace(/\bB\b/g, 'B');
}

function fieldCard({ attrs = {}, field, kind = 'text', label, sample = field }: FieldCard) {
    const attributeText = attrsToString(attrs);
    const title = `
        <div class="osb-test-card__label">${escapeHtml(label)}</div>
        <div class="osb-test-card__field">${escapeHtml(field)}</div>
    `;

    if (kind === 'image') {
        return `
            <article class="osb-test-card">
                ${title}
                <img class="osb-test-value osb-test-image ${field}" src="${placeholderImage}" alt="${escapeHtml(label)}" ${attributeText}>
            </article>
        `;
    }

    if (kind === 'color') {
        return `
            <article class="osb-test-card">
                ${title}
                <div class="osb-test-value osb-test-color ${field}" ${attributeText}>${escapeHtml(label)}</div>
            </article>
        `;
    }

    if (kind === 'conditional') {
        return `
            <article class="osb-test-card">
                ${title}
                <div class="osb-test-value osb-test-conditional ${field}" ${attributeText}>${escapeHtml(sample)}</div>
            </article>
        `;
    }

    if (kind === 'timer') {
        return `
            <article class="osb-test-card">
                ${title}
                <div class="osb-test-value osb-test-timer ${field}" data-timeout-duration="${escapeHtml(attrs['data-timeout-duration'] || '60')}">${escapeHtml(sample)}</div>
            </article>
        `;
    }

    return `
        <article class="osb-test-card">
            ${title}
            <div class="osb-test-value ${field}" ${attributeText}>${escapeHtml(sample)}</div>
        </article>
    `;
}

function section(title: string, cards: string[]) {
    return `
        <section class="osb-test-section">
            <header class="osb-test-section__header">
                <h2>${escapeHtml(title)}</h2>
                <span>${cards.length} items</span>
            </header>
            <div class="osb-test-grid">
                ${cards.join('\n')}
            </div>
        </section>
    `;
}

function page(title: string, subtitle: string, sections: string[]) {
    return `
        <main class="osb-test-page">
            <header class="osb-test-hero">
                <p>OpenScoreboard Test Template</p>
                <h1>${escapeHtml(title)}</h1>
                <div>${escapeHtml(subtitle)}</div>
            </header>
            ${sections.join('\n')}
        </main>
    `;
}

function fieldCards(fields: Array<{ field: string; label?: string; sample?: string | number }>, kind: FieldCard['kind'] = 'text') {
    return fields.map((field) => fieldCard({
        field: field.field,
        kind,
        label: field.label || labelFromField(field.field),
        sample: field.sample ?? field.field,
    }));
}

function gameScoreCards() {
    return textFieldList
        .filter((field) => /^game\d+[AB]Score$/.test(field.field))
        .map((field) => fieldCard({
            field: field.field,
            label: field.label,
            sample: field.sample,
        }));
}

function conditionalCards(fields: string[]) {
    return fields.map((field) => fieldCard({
        field,
        kind: 'conditional',
        label: labelFromField(field),
        sample: labelFromField(field),
    }));
}

function serviceCards() {
    return [
        fieldCard({
            attrs: { isA: 'true' },
            field: 'isACurrentlyServing',
            kind: 'conditional',
            label: 'A Serving Indicator',
            sample: 'A Serving',
        }),
        fieldCard({
            field: 'isACurrentlyServing',
            kind: 'conditional',
            label: 'B Serving Indicator',
            sample: 'B Serving',
        }),
        fieldCard({
            attrs: { isA: 'true' },
            field: 'isSecondServer',
            kind: 'conditional',
            label: 'Second Server A',
            sample: 'A Second Server',
        }),
        fieldCard({
            field: 'isSecondServer',
            kind: 'conditional',
            label: 'Second Server B',
            sample: 'B Second Server',
        }),
        fieldCard({
            attrs: { isA: 'true' },
            field: 'isACurrentlyServing',
            kind: 'conditional',
            label: 'Custom Service Icon A',
            sample: 'Serve A Icon',
        }),
        fieldCard({
            field: 'isACurrentlyServing',
            kind: 'conditional',
            label: 'Custom Service Icon B',
            sample: 'Serve B Icon',
        }),
    ];
}

function gameContainerCards() {
    return Array.from({ length: 9 }, (_, index) => {
        const game = index + 1;
        return `
            <article class="osb-test-card osb-test-card--wide">
                <div class="osb-test-card__label">Game ${game} Started Container</div>
                <div class="osb-test-card__field">isGame${game}Started</div>
                <div class="osb-test-game-container isGame${game}Started">
                    <div class="game${game}AScore">A${game}</div>
                    <div class="game${game}BScore">B${game}</div>
                </div>
            </article>
        `;
    });
}

function timeoutCards() {
    return [
        fieldCard({ field: 'isATimeOutActive', kind: 'conditional', label: 'A Timeout Active', sample: 'A Timeout Active' }),
        fieldCard({ field: 'isBTimeOutActive', kind: 'conditional', label: 'B Timeout Active', sample: 'B Timeout Active' }),
        fieldCard({ field: 'isTimeOutActive', kind: 'conditional', label: 'Either Timeout Active', sample: 'Any Timeout Active' }),
        fieldCard({ field: 'isATimeOutUsed', kind: 'conditional', label: 'A Timeout Used', sample: 'A Timeout Used' }),
        fieldCard({ field: 'isBTimeOutUsed', kind: 'conditional', label: 'B Timeout Used', sample: 'B Timeout Used' }),
        fieldCard({ attrs: { 'data-timeout-duration': '60' }, field: 'timeOutTimerA', kind: 'timer', label: 'A Timeout Timer 60s', sample: '60' }),
        fieldCard({ attrs: { 'data-timeout-duration': '60' }, field: 'timeOutTimerB', kind: 'timer', label: 'B Timeout Timer 60s', sample: '60' }),
        fieldCard({ attrs: { 'data-timeout-duration': '60' }, field: 'timeOutTimer', kind: 'timer', label: 'Either Timeout Timer 60s', sample: '60' }),
        fieldCard({ attrs: { 'data-timeout-duration': '120' }, field: 'timeOutTimerA', kind: 'timer', label: 'A Timeout Timer 120s', sample: '120' }),
        fieldCard({ attrs: { 'data-timeout-duration': '120' }, field: 'timeOutTimerB', kind: 'timer', label: 'B Timeout Timer 120s', sample: '120' }),
        fieldCard({ attrs: { 'data-timeout-duration': '120' }, field: 'timeOutTimer', kind: 'timer', label: 'Either Timeout Timer 120s', sample: '120' }),
    ];
}

function containerCard(label: string, className: string, body: string, style = '', attrs: Record<string, string> = {}) {
    const defaultStyle = [
        'align-items:center',
        'background:#ffffff',
        'border:1px solid #d8deec',
        'border-radius:10px',
        'color:#111827',
        'display:flex',
        'flex-direction:column',
        'gap:10px',
        'justify-content:center',
        'min-height:120px',
        'overflow:visible',
        'padding:18px',
        'position:relative',
        'width:100%',
    ].join(';');

    return `
        <article class="osb-test-card osb-test-card--wide">
            <div class="osb-test-card__label">${escapeHtml(label)}</div>
            <div class="osb-test-card__field">${escapeHtml(className)}</div>
            <div class="${className}" style="${defaultStyle};${style}" ${attrsToString(attrs)}>
                ${body}
            </div>
        </article>
    `;
}

function viewAnimationAttrs(animation: string, triggerGroup: string) {
    return {
        'data-osb-animation-duration': '1600ms',
        'data-osb-animation-easing': 'linear',
        'data-osb-view-animation': animation,
        'data-osb-view-animation-trigger-group': triggerGroup,
    };
}

function viewAnimationStyle(animation: string, triggerGroup: string) {
    return [
        `--osb-view-animation:${animation}`,
        `--osb-view-animation-trigger-group:${triggerGroup}`,
        '--osb-animation-duration:1600ms',
        '--osb-animation-easing:linear',
        '--osb-view-animation-color:#2d5bff',
        '--osb-view-animation-accent:#ffffff',
        '--osb-view-animation-width:4px',
        '--osb-view-animation-offset:0px',
    ].join(';');
}

function viewAnimationCards(triggerGroup: 'always-on' | 'score-fields') {
    return viewAnimationOptions
        .filter((animation) => animation.value !== 'none')
        .map((animation) => {
            const runtimeClasses = triggerGroup === 'always-on'
                ? `osb-view-animating osb-view-animation-always-on osb-view-animate-${animation.value}`
                : '';

            return containerCard(
                `${animation.name} ${triggerGroup === 'always-on' ? 'Always On' : 'Score Triggered'}`,
                `rowContainer ${runtimeClasses}`.trim(),
                `
                    <div class="osb-test-mini-label">${escapeHtml(animation.name)}</div>
                    <div class="currentAGameScore">Score Field</div>
                `,
                viewAnimationStyle(animation.value, triggerGroup),
                viewAnimationAttrs(animation.value, triggerGroup),
            );
        });
}

function aspectRatioCards() {
    return aspectRatios.map(([label, ratio]) => containerCard(
        `Aspect Ratio ${label}`,
        'aspectRatioContainer',
        `<div>${escapeHtml(label)}</div>`,
        `aspect-ratio:${ratio};width:${ratio === '1 / 1' ? '220px' : '320px'};height:auto;`,
    ));
}

const baseCss = `
${scoreboardAnimationCSS}

* { box-sizing: border-box; }
body { margin: 0; }
.osb-test-page {
    background: #101421;
    color: #f6f8ff;
    font-family: Arial, Helvetica, sans-serif;
    min-height: 100vh;
    padding: 36px;
}
.osb-test-hero {
    border-bottom: 1px solid rgba(255,255,255,.18);
    margin-bottom: 24px;
    padding-bottom: 18px;
}
.osb-test-hero p {
    color: #8fb4ff;
    font-size: 14px;
    letter-spacing: 0;
    margin: 0 0 8px;
    text-transform: uppercase;
}
.osb-test-hero h1 {
    font-size: 38px;
    line-height: 1.1;
    margin: 0 0 8px;
}
.osb-test-hero div {
    color: #c5cbdb;
    font-size: 17px;
}
.osb-test-section {
    margin: 0 0 30px;
}
.osb-test-section__header {
    align-items: end;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
}
.osb-test-section__header h2 {
    font-size: 24px;
    margin: 0;
}
.osb-test-section__header span {
    color: #8fb4ff;
    font-size: 14px;
}
.osb-test-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}
.osb-test-card {
    background: #f7f8fc;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 8px;
    color: #161a24;
    min-height: 150px;
    padding: 12px;
}
.osb-test-card--wide {
    min-height: 180px;
}
.osb-test-card__label {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
}
.osb-test-card__field {
    color: #5c6474;
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
    margin-bottom: 12px;
}
.osb-test-value {
    align-items: center;
    background: #ffffff;
    border: 1px solid #d8deec;
    border-radius: 6px;
    display: flex;
    font-size: 20px;
    font-weight: 700;
    justify-content: center;
    min-height: 74px;
    padding: 12px;
    text-align: center;
    width: 100%;
}
.osb-test-image {
    height: 96px;
    object-fit: cover;
    padding: 0;
}
.osb-test-color {
    color: #fff;
}
.jerseyColorA { background: #d82828; }
.jerseyColorB { background: #2456d8; }
.osb-test-conditional {
    background: #14234a;
    color: #ffffff;
}
.osb-test-timer {
    background: #001b44;
    color: #ffffff;
    font-size: 38px;
}
.osb-test-game-container {
    align-items: center;
    background: #ffffff;
    border: 1px solid #d8deec;
    border-radius: 6px;
    color: #111827;
    display: flex;
    gap: 8px;
    justify-content: center;
    min-height: 82px;
    padding: 12px;
}
.osb-test-game-container > div {
    align-items: center;
    background: #eaf0ff;
    border-radius: 4px;
    display: flex;
    flex: 1;
    font-size: 22px;
    font-weight: 800;
    justify-content: center;
    min-height: 54px;
}
.osb-test-card > .rowContainer .currentAGameScore,
.osb-test-card > .columnContainer .currentAGameScore,
.osb-test-card > .aspectRatioContainer .currentAGameScore {
    background: #101421;
    border-radius: 4px;
    color: #ffffff;
    padding: 8px 12px;
}
.osb-test-mini-label {
    color: #4b5567;
    font-size: 13px;
    font-weight: 700;
}
.aspectRatioContainer {
    min-height: 0;
}
`;

export const testScoreboardTemplates: TestScoreboardTemplate[] = [
    {
        id: 'test-basic-score-components',
        name: 'Test: Player, Score, and Match Fields',
        description: 'Player names, combined names, current score fields, game scores, and match labels.',
        html: page('Player, Score, and Match Fields', 'Use this board to inspect text and number field updates plus value-change animations.', [
            section('Player Names', fieldCards([
                ...textFieldList.filter((field) => ['playerA', 'playerB', 'playerA2', 'playerB2'].includes(field.field)),
                ...currentGameFieldList.filter((field) => ['combinedAName', 'combinedBName'].includes(field.field)),
            ])),
            section('Current Score Fields', fieldCards(currentGameFieldList.filter((field) => !['combinedAName', 'combinedBName'].includes(field.field)))),
            section('Game Score Fields', gameScoreCards()),
            section('Match Fields', fieldCards(textFieldList.filter((field) => field.field === 'matchRound'))),
        ]),
        css: baseCss,
    },
    {
        id: 'test-team-media-components',
        name: 'Test: Teams, Flags, Images, and Colors',
        description: 'Team fields, jersey colors, flags, player images, and team logos.',
        html: page('Teams, Flags, Images, and Colors', 'Use this board to inspect image loading, color updates, and team field value changes.', [
            section('Team Fields', fieldCards(teamFieldList)),
            section('Jersey Colors', fieldCards(solidColorFieldList, 'color')),
            section('Images and Flags', fieldCards(imageFieldList, 'image')),
        ]),
        css: baseCss,
    },
    {
        id: 'test-conditional-components',
        name: 'Test: Conditional and Status Fields',
        description: 'Service, point, penalty, and game-start conditional components.',
        html: page('Conditional and Status Fields', 'Use this board to inspect appear/disappear animations and show/hide behavior.', [
            section('Service Indicators', serviceCards()),
            section('Point and Penalty Flags', conditionalCards([
                'isGamePoint',
                'isMatchPoint',
                'isAYellowCarded',
                'isBYellowCarded',
                'isARedCarded',
                'isBRedCarded',
            ])),
            section('Game Started Containers', gameContainerCards()),
        ]),
        css: baseCss,
    },
    {
        id: 'test-timeout-components',
        name: 'Test: Timeout Components',
        description: 'A/B timeout active fields, combined timeout active field, timeout used fields, and 60/120 second timers.',
        html: page('Timeout Components', 'Use this board to inspect timeout show/hide behavior and countdown timers.', [
            section('Timeout Fields and Timers', timeoutCards()),
        ]),
        css: baseCss,
    },
    {
        id: 'test-court-side-components',
        name: 'Test: Court Side Components',
        description: 'Court-side score, match score, combined names, and service indicators.',
        html: page('Court Side Components', 'Use this board to inspect court-side-specific fields and switched scoreboard behavior.', [
            section('Court Side Fields', fieldCards(courtSideGameFieldList)),
            section('Court Side Service', conditionalCards([
                'courtSideIsACurrentlyServing',
                'courtSideIsBCurrentlyServing',
            ])),
        ]),
        css: baseCss,
    },
    {
        id: 'test-container-view-animations',
        name: 'Test: Containers and View Animations',
        description: 'Container blocks, aspect ratio frames, always-on view animations, and triggered view animations.',
        html: page('Containers and View Animations', 'Use this board to inspect structural containers and view animation behavior around child fields.', [
            section('Base Containers', [
                containerCard('Row Container', 'rowContainer', '<div>Row container</div><div class="currentAGameScore">Score child</div>'),
                containerCard('Column Container', 'columnContainer', '<div>Column container</div><div class="currentBGameScore">Score child</div>'),
                ...aspectRatioCards(),
            ]),
            section('Always On View Animations', viewAnimationCards('always-on')),
            section('Score Triggered View Animations', viewAnimationCards('score-fields')),
        ]),
        css: baseCss,
    },
];
