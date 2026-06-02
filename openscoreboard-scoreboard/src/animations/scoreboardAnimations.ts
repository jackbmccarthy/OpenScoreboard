type ScoreboardAnimationEvent = 'appear' | 'disappear' | 'change';

type ElementState = {
    backgroundColor: string;
    display: string;
    height: string;
    html: string;
    inlineDisplay: string;
    inlineHeight: string;
    inlineOpacity: string;
    inlineVisibility: string;
    opacity: string;
    src: string;
    text: string;
    visibility: string;
};

const animationAttributeMap: Record<ScoreboardAnimationEvent, string> = {
    appear: 'data-osb-appear-animation',
    disappear: 'data-osb-disappear-animation',
    change: 'data-osb-change-animation',
};

const animationVariableMap: Record<ScoreboardAnimationEvent, string> = {
    appear: '--osb-appear-animation',
    disappear: '--osb-disappear-animation',
    change: '--osb-change-animation',
};

const viewAnimationAttribute = 'data-osb-view-animation';
const viewAnimationVariable = '--osb-view-animation';
const viewTriggerFieldsAttribute = 'data-osb-view-animation-trigger-fields';
const viewTriggerFieldsVariable = '--osb-view-animation-trigger-fields';
const viewTriggerGroupAttribute = 'data-osb-view-animation-trigger-group';
const viewTriggerGroupVariable = '--osb-view-animation-trigger-group';
const viewTriggerScopeAttribute = 'data-osb-view-animation-trigger-scope';
const viewTriggerScopeVariable = '--osb-view-animation-trigger-scope';
const alwaysOnViewTriggerValue = 'always-on';

const gameScoreFields = [
    'game1AScore',
    'game1BScore',
    'game2AScore',
    'game2BScore',
    'game3AScore',
    'game3BScore',
    'game4AScore',
    'game4BScore',
    'game5AScore',
    'game5BScore',
    'game6AScore',
    'game6BScore',
    'game7AScore',
    'game7BScore',
    'game8AScore',
    'game8BScore',
    'game9AScore',
    'game9BScore',
];

const currentScoreFields = [
    'currentAGameScore',
    'currentBGameScore',
    'currentAMatchScore',
    'currentBMatchScore',
    'courtSideAGameScore',
    'courtSideBGameScore',
    'courtSideAMatchScore',
    'courtSideBMatchScore',
];

const viewTriggerFieldGroups: Record<string, string[]> = {
    'score-fields': [
        ...currentScoreFields,
        ...gameScoreFields,
        'teamAScore',
        'teamBScore',
    ],
    'current-score-fields': currentScoreFields,
    'game-score-fields': gameScoreFields,
    'player-name-fields': [
        'playerA',
        'playerB',
        'playerA2',
        'playerB2',
        'combinedAName',
        'combinedBName',
        'courtSideCombinedAName',
        'courtSideCombinedBName',
    ],
    'team-fields': [
        'teamAName',
        'teamBName',
        'teamAScore',
        'teamBScore',
        'teamLogoURLA',
        'teamLogoURLB',
    ],
    'status-fields': [
        'isGamePoint',
        'isMatchPoint',
        'isSecondServer',
        'isGame1Started',
        'isGame2Started',
        'isGame3Started',
        'isGame4Started',
        'isGame5Started',
        'isGame6Started',
        'isGame7Started',
        'isGame8Started',
        'isGame9Started',
    ],
    'timeout-fields': [
        'isATimeOutActive',
        'isBTimeOutActive',
        'isATimeOutUsed',
        'isBTimeOutUsed',
        'timeOutTimerA',
        'timeOutTimerB',
        'timeOutTimer',
        'isTimeOutActive',
    ],
    'service-fields': [
        'isACurrentlyServing',
        'courtSideIsACurrentlyServing',
        'courtSideIsBCurrentlyServing',
    ],
    'penalty-fields': [
        'isAYellowCarded',
        'isBYellowCarded',
        'isARedCarded',
        'isBRedCarded',
    ],
    'image-fields': [
        'countryA',
        'countryB',
        'imageURLA',
        'imageURLB',
        'teamLogoURLA',
        'teamLogoURLB',
    ],
    'color-fields': [
        'jerseyColorA',
        'jerseyColorB',
    ],
};

export const scoreboardAnimationCSS = `
@property --osb-view-runner-angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
}
.osb-animating {
    animation-duration: var(--osb-active-animation-duration, var(--osb-animation-duration, 450ms));
    animation-timing-function: var(--osb-active-animation-easing, var(--osb-animation-easing, ease));
    animation-fill-mode: both;
    will-change: opacity, transform, filter, clip-path;
}
.osb-animate-fade-in { animation-name: osb-fade-in; }
.osb-animate-fade-out { animation-name: osb-fade-out; }
.osb-animate-fade-up-in { animation-name: osb-fade-up-in; }
.osb-animate-fade-up-out { animation-name: osb-fade-up-out; }
.osb-animate-fade-down-in { animation-name: osb-fade-down-in; }
.osb-animate-fade-down-out { animation-name: osb-fade-down-out; }
.osb-animate-fade-left-in { animation-name: osb-fade-left-in; }
.osb-animate-fade-left-out { animation-name: osb-fade-left-out; }
.osb-animate-fade-right-in { animation-name: osb-fade-right-in; }
.osb-animate-fade-right-out { animation-name: osb-fade-right-out; }
.osb-animate-zoom-in { animation-name: osb-zoom-in; }
.osb-animate-zoom-out { animation-name: osb-zoom-out; }
.osb-animate-pop-in { animation-name: osb-pop-in; }
.osb-animate-pop-out { animation-name: osb-pop-out; }
.osb-animate-flip-x-in { animation-name: osb-flip-x-in; }
.osb-animate-flip-x-out { animation-name: osb-flip-x-out; }
.osb-animate-flip-y-in { animation-name: osb-flip-y-in; }
.osb-animate-flip-y-out { animation-name: osb-flip-y-out; }
.osb-animate-rotate-in { animation-name: osb-rotate-in; }
.osb-animate-rotate-out { animation-name: osb-rotate-out; }
.osb-animate-slide-up-in { animation-name: osb-slide-up-in; }
.osb-animate-slide-up-out { animation-name: osb-slide-up-out; }
.osb-animate-slide-down-in { animation-name: osb-slide-down-in; }
.osb-animate-slide-down-out { animation-name: osb-slide-down-out; }
.osb-animate-slide-left-in { animation-name: osb-slide-left-in; }
.osb-animate-slide-left-out { animation-name: osb-slide-left-out; }
.osb-animate-slide-right-in { animation-name: osb-slide-right-in; }
.osb-animate-slide-right-out { animation-name: osb-slide-right-out; }
.osb-animate-wipe-left-in { animation-name: osb-wipe-left-in; }
.osb-animate-wipe-left-out { animation-name: osb-wipe-left-out; }
.osb-animate-wipe-right-in { animation-name: osb-wipe-right-in; }
.osb-animate-wipe-right-out { animation-name: osb-wipe-right-out; }
.osb-animate-wipe-up-in { animation-name: osb-wipe-up-in; }
.osb-animate-wipe-up-out { animation-name: osb-wipe-up-out; }
.osb-animate-wipe-down-in { animation-name: osb-wipe-down-in; }
.osb-animate-wipe-down-out { animation-name: osb-wipe-down-out; }
.osb-animate-pixel-in { animation-name: osb-pixel-in; animation-timing-function: steps(8, end); }
.osb-animate-pixel-out { animation-name: osb-pixel-out; animation-timing-function: steps(8, end); }
.osb-animate-snake-in { animation-name: osb-snake-in; }
.osb-animate-snake-out { animation-name: osb-snake-out; }
.osb-animate-blur-in { animation-name: osb-blur-in; }
.osb-animate-blur-out { animation-name: osb-blur-out; }
.osb-animate-elastic-in { animation-name: osb-elastic-in; }
.osb-animate-elastic-out { animation-name: osb-elastic-out; }
.osb-animate-change-pulse { animation-name: osb-change-pulse; }
.osb-animate-change-pop { animation-name: osb-change-pop; }
.osb-animate-change-flip-x { animation-name: osb-change-flip-x; }
.osb-animate-change-flip-y { animation-name: osb-change-flip-y; }
.osb-animate-change-tick-up { animation-name: osb-change-tick-up; }
.osb-animate-change-tick-down { animation-name: osb-change-tick-down; }
.osb-animate-change-slide-up { animation-name: osb-change-slide-up; }
.osb-animate-change-slide-down { animation-name: osb-change-slide-down; }
.osb-animate-change-spin { animation-name: osb-change-spin; }
.osb-animate-change-shake { animation-name: osb-change-shake; }
.osb-animate-change-flash { animation-name: osb-change-flash; }
.osb-animate-change-glow { animation-name: osb-change-glow; }
.osb-animate-change-explode { animation-name: osb-change-explode; }
.osb-animate-change-compress { animation-name: osb-change-compress; }
.osb-animate-change-bounce { animation-name: osb-change-bounce; }
.osb-view-animating {
    position: relative;
    isolation: isolate;
    overflow: visible !important;
}
.osb-view-animating::before,
.osb-view-animating::after {
    animation-duration: var(--osb-active-animation-duration, var(--osb-animation-duration, 450ms));
    animation-timing-function: var(--osb-active-animation-easing, var(--osb-animation-easing, ease));
    animation-fill-mode: both;
    border-radius: inherit;
    box-sizing: border-box;
    content: "";
    inset: calc(-1 * var(--osb-view-animation-offset, 0px));
    pointer-events: none;
    position: absolute;
    z-index: 2147483647;
}
.osb-view-animation-always-on::before,
.osb-view-animation-always-on::after {
    animation-iteration-count: infinite;
}
.osb-view-animate-border-flash::before {
    animation-name: osb-view-border-flash;
    border: var(--osb-view-animation-width, 4px) solid var(--osb-view-animation-color, #2d5bff);
}
.osb-view-animate-border-pulse::before {
    animation-name: osb-view-border-pulse;
    border: var(--osb-view-animation-width, 4px) solid var(--osb-view-animation-color, #2d5bff);
}
.osb-view-animate-border-glow::before {
    animation-name: osb-view-border-glow;
    border: var(--osb-view-animation-width, 4px) solid var(--osb-view-animation-color, #2d5bff);
}
.osb-view-animate-border-pop::before {
    animation-name: osb-view-border-pop;
    border: var(--osb-view-animation-width, 4px) solid var(--osb-view-animation-color, #2d5bff);
}
.osb-view-animate-border-sweep::before {
    animation-name: osb-view-border-sweep;
    border: var(--osb-view-animation-width, 4px) solid transparent;
    background:
        linear-gradient(var(--osb-view-animation-color, #2d5bff), var(--osb-view-animation-color, #2d5bff)) border-box;
    clip-path: inset(0 100% 0 0);
}
.osb-view-animate-border-spin::before,
.osb-view-animate-twin-lights::before,
.osb-view-animate-twin-lights::after,
.osb-view-animate-corner-chase::before,
.osb-view-animate-comet-trace::before,
.osb-view-animate-neon-trace::before,
.osb-view-animate-spotlight-orbit::before {
    animation-name: osb-view-border-runner;
    animation-timing-function: linear;
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 230deg,
            var(--osb-view-animation-color, #2d5bff) 270deg,
            var(--osb-view-animation-accent, #ffffff) 300deg,
            var(--osb-view-animation-color, #2d5bff) 330deg,
            transparent 360deg
        );
    padding: var(--osb-view-animation-width, 4px);
    -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
    mask-composite: exclude;
    transform: translateZ(0);
    will-change: --osb-view-runner-angle, opacity;
}
.osb-view-animate-border-spin::before {
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 195deg,
            var(--osb-view-animation-color, #2d5bff) 250deg,
            var(--osb-view-animation-accent, #ffffff) 292deg,
            var(--osb-view-animation-color, #2d5bff) 335deg,
            transparent 360deg
        );
}
.osb-view-animate-twin-lights::before {
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 278deg,
            var(--osb-view-animation-color, #2d5bff) 302deg,
            var(--osb-view-animation-accent, #ffffff) 318deg,
            transparent 344deg 360deg
        );
}
.osb-view-animate-twin-lights::after {
    animation-direction: reverse;
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 278deg,
            var(--osb-view-animation-accent, #ffffff) 302deg,
            var(--osb-view-animation-color, #2d5bff) 318deg,
            transparent 344deg 360deg
        );
}
.osb-view-animate-corner-chase::before {
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 268deg,
            var(--osb-view-animation-color, #2d5bff) 290deg,
            var(--osb-view-animation-accent, #ffffff) 310deg,
            var(--osb-view-animation-color, #2d5bff) 330deg,
            transparent 352deg 360deg
        );
}
.osb-view-animate-comet-trace::before {
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 260deg,
            transparent 286deg,
            var(--osb-view-animation-color, #2d5bff) 307deg,
            var(--osb-view-animation-accent, #ffffff) 318deg,
            transparent 345deg 360deg
        );
}
.osb-view-animate-neon-trace::before {
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 145deg,
            transparent 205deg,
            var(--osb-view-animation-color, #2d5bff) 280deg,
            var(--osb-view-animation-accent, #ffffff) 312deg,
            var(--osb-view-animation-color, #2d5bff) 340deg,
            transparent 360deg
        );
}
.osb-view-animate-scan-border::before {
    animation-name: osb-view-scan-border;
    border: var(--osb-view-animation-width, 4px) solid var(--osb-view-animation-color, #2d5bff);
    background: linear-gradient(90deg, transparent, var(--osb-view-animation-accent, #ffffff), transparent);
    background-size: 220% 100%;
}
.osb-view-animate-spotlight-orbit::before {
    background:
        conic-gradient(
            from var(--osb-view-runner-angle, 0deg),
            transparent 0deg 292deg,
            var(--osb-view-animation-color, #2d5bff) 310deg,
            var(--osb-view-animation-accent, #ffffff) 321deg,
            transparent 338deg 360deg
        );
}
.osb-view-animation-always-on.osb-view-animate-border-spin::before,
.osb-view-animation-always-on.osb-view-animate-twin-lights::before,
.osb-view-animation-always-on.osb-view-animate-twin-lights::after,
.osb-view-animation-always-on.osb-view-animate-corner-chase::before,
.osb-view-animation-always-on.osb-view-animate-comet-trace::before,
.osb-view-animation-always-on.osb-view-animate-neon-trace::before,
.osb-view-animation-always-on.osb-view-animate-spotlight-orbit::before {
    animation-name: osb-view-border-runner-loop;
}
@keyframes osb-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes osb-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes osb-fade-up-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes osb-fade-up-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-16px); } }
@keyframes osb-fade-down-in { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes osb-fade-down-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(16px); } }
@keyframes osb-fade-left-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes osb-fade-left-out { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-16px); } }
@keyframes osb-fade-right-in { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
@keyframes osb-fade-right-out { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(16px); } }
@keyframes osb-zoom-in { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
@keyframes osb-zoom-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(.7); } }
@keyframes osb-pop-in { 0% { opacity: 0; transform: scale(.4); } 70% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes osb-pop-out { 0% { opacity: 1; transform: scale(1); } 35% { opacity: 1; transform: scale(1.08); } 100% { opacity: 0; transform: scale(.4); } }
@keyframes osb-flip-x-in { from { opacity: 0; transform: perspective(700px) rotateX(-90deg); } to { opacity: 1; transform: perspective(700px) rotateX(0deg); } }
@keyframes osb-flip-x-out { from { opacity: 1; transform: perspective(700px) rotateX(0deg); } to { opacity: 0; transform: perspective(700px) rotateX(90deg); } }
@keyframes osb-flip-y-in { from { opacity: 0; transform: perspective(700px) rotateY(-90deg); } to { opacity: 1; transform: perspective(700px) rotateY(0deg); } }
@keyframes osb-flip-y-out { from { opacity: 1; transform: perspective(700px) rotateY(0deg); } to { opacity: 0; transform: perspective(700px) rotateY(90deg); } }
@keyframes osb-rotate-in { from { opacity: 0; transform: rotate(-12deg) scale(.8); } to { opacity: 1; transform: rotate(0) scale(1); } }
@keyframes osb-rotate-out { from { opacity: 1; transform: rotate(0) scale(1); } to { opacity: 0; transform: rotate(12deg) scale(.8); } }
@keyframes osb-slide-up-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes osb-slide-up-out { from { transform: translateY(0); } to { transform: translateY(-100%); } }
@keyframes osb-slide-down-in { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes osb-slide-down-out { from { transform: translateY(0); } to { transform: translateY(100%); } }
@keyframes osb-slide-left-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes osb-slide-left-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }
@keyframes osb-slide-right-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes osb-slide-right-out { from { transform: translateX(0); } to { transform: translateX(100%); } }
@keyframes osb-wipe-left-in { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0); } }
@keyframes osb-wipe-left-out { from { clip-path: inset(0); } to { clip-path: inset(0 100% 0 0); } }
@keyframes osb-wipe-right-in { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } }
@keyframes osb-wipe-right-out { from { clip-path: inset(0); } to { clip-path: inset(0 0 0 100%); } }
@keyframes osb-wipe-up-in { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0); } }
@keyframes osb-wipe-up-out { from { clip-path: inset(0); } to { clip-path: inset(100% 0 0 0); } }
@keyframes osb-wipe-down-in { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0); } }
@keyframes osb-wipe-down-out { from { clip-path: inset(0); } to { clip-path: inset(0 0 100% 0); } }
@keyframes osb-pixel-in { from { opacity: 0; filter: blur(8px); transform: scale(.94); } to { opacity: 1; filter: blur(0); transform: scale(1); } }
@keyframes osb-pixel-out { from { opacity: 1; filter: blur(0); transform: scale(1); } to { opacity: 0; filter: blur(8px); transform: scale(.94); } }
@keyframes osb-snake-in { 0% { opacity: 0; clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); } 50% { opacity: 1; clip-path: polygon(0 0, 65% 0, 35% 100%, 0 100%); } 100% { opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); } }
@keyframes osb-snake-out { 0% { opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); } 50% { opacity: 1; clip-path: polygon(35% 0, 100% 0, 65% 100%, 0 100%); } 100% { opacity: 0; clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); } }
@keyframes osb-blur-in { from { opacity: 0; filter: blur(14px); } to { opacity: 1; filter: blur(0); } }
@keyframes osb-blur-out { from { opacity: 1; filter: blur(0); } to { opacity: 0; filter: blur(14px); } }
@keyframes osb-elastic-in { 0% { opacity: 0; transform: scale(.45); } 55% { opacity: 1; transform: scale(1.12); } 75% { transform: scale(.96); } 100% { opacity: 1; transform: scale(1); } }
@keyframes osb-elastic-out { 0% { opacity: 1; transform: scale(1); } 35% { transform: scale(1.1); } 100% { opacity: 0; transform: scale(.45); } }
@keyframes osb-change-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes osb-change-pop { 0% { transform: scale(.82); } 65% { transform: scale(1.12); } 100% { transform: scale(1); } }
@keyframes osb-change-flip-x { from { transform: perspective(700px) rotateX(-90deg); } to { transform: perspective(700px) rotateX(0); } }
@keyframes osb-change-flip-y { from { transform: perspective(700px) rotateY(-90deg); } to { transform: perspective(700px) rotateY(0); } }
@keyframes osb-change-tick-up { from { opacity: .35; transform: translateY(55%); } to { opacity: 1; transform: translateY(0); } }
@keyframes osb-change-tick-down { from { opacity: .35; transform: translateY(-55%); } to { opacity: 1; transform: translateY(0); } }
@keyframes osb-change-slide-up { 0% { transform: translateY(0); } 45% { transform: translateY(-100%); opacity: 0; } 46% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes osb-change-slide-down { 0% { transform: translateY(0); } 45% { transform: translateY(100%); opacity: 0; } 46% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
@keyframes osb-change-spin { from { transform: rotate(-180deg) scale(.9); } to { transform: rotate(0) scale(1); } }
@keyframes osb-change-shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8%); } 40% { transform: translateX(8%); } 60% { transform: translateX(-5%); } 80% { transform: translateX(5%); } }
@keyframes osb-change-flash { 0%, 100% { filter: brightness(1); } 45% { filter: brightness(1.9); } }
@keyframes osb-change-glow { 0%, 100% { filter: drop-shadow(0 0 0 rgba(255,255,255,0)); } 50% { filter: drop-shadow(0 0 16px rgba(255,255,255,.9)); } }
@keyframes osb-change-explode { 0% { opacity: .2; transform: scale(1.6) rotate(-5deg); filter: blur(6px); } 60% { opacity: 1; transform: scale(.92) rotate(2deg); filter: blur(0); } 100% { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); } }
@keyframes osb-change-compress { 0% { transform: scaleX(1.35) scaleY(.7); } 65% { transform: scaleX(.92) scaleY(1.08); } 100% { transform: scale(1); } }
@keyframes osb-change-bounce { 0%, 100% { transform: translateY(0); } 35% { transform: translateY(-18%); } 70% { transform: translateY(8%); } }
@keyframes osb-view-border-flash { 0%, 100% { opacity: 0; } 20%, 72% { opacity: 1; } }
@keyframes osb-view-border-pulse { 0% { opacity: .15; transform: scale(.985); } 50% { opacity: 1; transform: scale(1.035); } 100% { opacity: 0; transform: scale(1.06); } }
@keyframes osb-view-border-glow { 0%, 100% { opacity: 0; box-shadow: 0 0 0 var(--osb-view-animation-color, #2d5bff); } 45% { opacity: 1; box-shadow: 0 0 22px var(--osb-view-animation-color, #2d5bff), inset 0 0 16px var(--osb-view-animation-color, #2d5bff); } }
@keyframes osb-view-border-pop { 0% { opacity: 0; transform: scale(.92); } 45% { opacity: 1; transform: scale(1.04); } 100% { opacity: 0; transform: scale(1.08); } }
@keyframes osb-view-border-sweep { 0% { clip-path: inset(0 100% 0 0); opacity: 1; } 50% { clip-path: inset(0 0 0 0); opacity: 1; } 100% { clip-path: inset(0 0 0 100%); opacity: 0; } }
@keyframes osb-view-border-runner {
    0% {
        opacity: 0;
        --osb-view-runner-angle: 0deg;
    }
    8% {
        opacity: 1;
    }
    92% {
        opacity: 1;
    }
    100% {
        opacity: 0;
        --osb-view-runner-angle: 360deg;
    }
}
@keyframes osb-view-border-runner-loop {
    from {
        opacity: 1;
        --osb-view-runner-angle: 0deg;
    }
    to {
        opacity: 1;
        --osb-view-runner-angle: 360deg;
    }
}
@keyframes osb-view-corner-chase {
    0% { opacity: 1; border-top-color: var(--osb-view-animation-color, #2d5bff); }
    25% { border-top-color: transparent; border-right-color: var(--osb-view-animation-color, #2d5bff); }
    50% { border-right-color: transparent; border-bottom-color: var(--osb-view-animation-color, #2d5bff); }
    75% { border-bottom-color: transparent; border-left-color: var(--osb-view-animation-color, #2d5bff); }
    100% { opacity: 0; border-left-color: transparent; border-top-color: var(--osb-view-animation-color, #2d5bff); }
}
@keyframes osb-view-scan-border { 0% { opacity: 0; background-position: 220% 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; background-position: -220% 0; } }
`;

function getComputedValue(element: HTMLElement, property: string) {
    return window.getComputedStyle(element).getPropertyValue(property).trim();
}

function readAnimationValue(element: HTMLElement, eventName: ScoreboardAnimationEvent) {
    const attributeValue = element.getAttribute(animationAttributeMap[eventName]);
    const inlineValue = element.style.getPropertyValue(animationVariableMap[eventName]).trim();
    const computedValue = getComputedValue(element, animationVariableMap[eventName]);

    return (attributeValue || inlineValue || computedValue || 'none').trim();
}

function readTimingValue(element: HTMLElement, attributeName: string, variableName: string, fallback: string) {
    const attributeValue = element.getAttribute(attributeName);
    const inlineValue = element.style.getPropertyValue(variableName).trim();
    const computedValue = getComputedValue(element, variableName);

    return (attributeValue || inlineValue || computedValue || fallback).trim();
}

function readElementSetting(element: HTMLElement, attributeName: string, variableName: string, fallback = '') {
    const attributeValue = element.getAttribute(attributeName);
    const inlineValue = element.style.getPropertyValue(variableName).trim();
    const computedValue = getComputedValue(element, variableName);

    return (attributeValue || inlineValue || computedValue || fallback).trim();
}

function hasCSSRuleValue(element: HTMLElement, variableName: string) {
    for (const stylesheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;

        try {
            rules = stylesheet.cssRules;
        } catch (error) {
            continue;
        }

        for (const rule of Array.from(rules)) {
            if (!(rule instanceof CSSStyleRule)) {
                continue;
            }

            if (!rule.style.getPropertyValue(variableName).trim()) {
                continue;
            }

            try {
                if (element.matches(rule.selectorText)) {
                    return true;
                }
            } catch (error) {
                continue;
            }
        }
    }

    return false;
}

function hasExplicitAnimationSetting(element: HTMLElement, attributeName: string, variableName: string) {
    return element.hasAttribute(attributeName)
        || !!element.style.getPropertyValue(variableName).trim()
        || hasCSSRuleValue(element, variableName);
}

function readViewAnimationValue(element: HTMLElement) {
    const attributeValue = element.getAttribute(viewAnimationAttribute);
    const inlineValue = element.style.getPropertyValue(viewAnimationVariable).trim();
    const computedValue = getComputedValue(element, viewAnimationVariable);

    return (attributeValue || inlineValue || computedValue || 'none').trim();
}

function parseFieldList(value: string) {
    return value
        .split(/[,\s]+/)
        .map(field => field.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
}

function getChangedFieldNames(element: HTMLElement) {
    const fieldNames = new Set<string>();

    if (element.dataset.osbField) {
        fieldNames.add(element.dataset.osbField);
    }

    for (const className of Array.from(element.classList)) {
        if (!className.startsWith('osb-')) {
            fieldNames.add(className);
        }
    }

    return fieldNames;
}

function matchesFieldList(changedElement: HTMLElement, fieldList: string[]) {
    if (!fieldList.length) {
        return false;
    }

    const changedFields = getChangedFieldNames(changedElement);

    return fieldList.some(field => changedFields.has(field) || changedElement.classList.contains(field));
}

function isDirectViewChild(viewElement: HTMLElement, changedElement: HTMLElement) {
    let current = changedElement.parentElement;

    while (current && current !== viewElement) {
        if (current.dataset.osbField) {
            return false;
        }

        current = current.parentElement;
    }

    return current === viewElement;
}

function shouldTriggerViewAnimation(viewElement: HTMLElement, changedElement: HTMLElement) {
    const triggerScope = readElementSetting(
        viewElement,
        viewTriggerScopeAttribute,
        viewTriggerScopeVariable,
        'descendants',
    );

    if (triggerScope === 'direct-children' && !isDirectViewChild(viewElement, changedElement)) {
        return false;
    }

    const customFieldList = parseFieldList(readElementSetting(
        viewElement,
        viewTriggerFieldsAttribute,
        viewTriggerFieldsVariable,
    ));

    if (customFieldList.length > 0) {
        return matchesFieldList(changedElement, customFieldList);
    }

    const triggerGroup = readViewTriggerGroup(viewElement);

    if (!triggerGroup || triggerGroup === 'any') {
        return true;
    }

    const groupFields = viewTriggerFieldGroups[triggerGroup] || [];

    return matchesFieldList(changedElement, groupFields);
}

function parseDuration(duration: string) {
    const value = duration.trim();

    if (value.endsWith('ms')) {
        return Number.parseFloat(value) || 450;
    }

    if (value.endsWith('s')) {
        return (Number.parseFloat(value) || 0.45) * 1000;
    }

    return Number.parseFloat(value) || 450;
}

function captureElementState(element: HTMLElement): ElementState {
    const styles = window.getComputedStyle(element);
    const source = element instanceof HTMLImageElement ? element.src : element.getAttribute('src') || '';

    return {
        backgroundColor: element.style.backgroundColor || styles.backgroundColor,
        display: styles.display,
        height: styles.height,
        html: element.innerHTML,
        inlineDisplay: element.style.display,
        inlineHeight: element.style.height,
        inlineOpacity: element.style.opacity,
        inlineVisibility: element.style.visibility,
        opacity: element.style.opacity || styles.opacity || '1',
        src: source,
        text: element.innerText,
        visibility: element.style.visibility || styles.visibility || 'visible',
    };
}

function isVisible(state: ElementState) {
    const opacity = Number.parseFloat(state.opacity);
    const height = Number.parseFloat(state.height);

    return state.display !== 'none'
        && state.visibility !== 'hidden'
        && opacity !== 0
        && height !== 0;
}

function getRestoredDisplay(before: ElementState) {
    if (before.inlineDisplay && before.inlineDisplay !== 'none') {
        return before.inlineDisplay;
    }

    if (before.display && before.display !== 'none') {
        return before.display;
    }

    return 'flex';
}

function changedValue(before: ElementState, after: ElementState) {
    return before.text !== after.text
        || before.html !== after.html
        || before.src !== after.src
        || before.backgroundColor !== after.backgroundColor
        || before.height !== after.height;
}

function getAnimationClass(element: HTMLElement) {
    return Array.from(element.classList).filter(className => className.startsWith('osb-animate-'));
}

function getViewAnimationClass(element: HTMLElement) {
    return Array.from(element.classList).filter(className => className.startsWith('osb-view-animate-'));
}

function isNoAnimationValue(animationName: string) {
    return !animationName || animationName.trim().toLowerCase() === 'none';
}

function clearScoreboardAnimationState(element: HTMLElement) {
    element.classList.remove('osb-animating', ...getAnimationClass(element));
    element.style.removeProperty('--osb-active-animation-duration');
    element.style.removeProperty('--osb-active-animation-easing');
    delete element.dataset.osbAnimationEvent;
    delete element.dataset.osbAnimationName;
    delete element.dataset.osbAnimationKey;
}

function clearScoreboardViewAnimationState(element: HTMLElement) {
    element.classList.remove('osb-view-animating', 'osb-view-animation-always-on', ...getViewAnimationClass(element));
    element.style.removeProperty('--osb-active-animation-duration');
    element.style.removeProperty('--osb-active-animation-easing');
    delete element.dataset.osbViewAnimationEvent;
    delete element.dataset.osbViewAnimationName;
    delete element.dataset.osbViewAnimationKey;
}

function isRunnerViewAnimation(animationName: string) {
    return [
        'border-spin',
        'twin-lights',
        'corner-chase',
        'comet-trace',
        'neon-trace',
        'spotlight-orbit',
    ].includes(animationName);
}

function readViewTriggerGroup(element: HTMLElement) {
    return readElementSetting(
        element,
        viewTriggerGroupAttribute,
        viewTriggerGroupVariable,
        'any',
    );
}

function isAlwaysOnViewAnimation(element: HTMLElement) {
    return readViewTriggerGroup(element) === alwaysOnViewTriggerValue;
}

function getViewAnimationTiming(element: HTMLElement, animationName: string) {
    const defaultDuration = isRunnerViewAnimation(animationName) ? '1200ms' : '450ms';

    return {
        duration: readTimingValue(element, 'data-osb-animation-duration', '--osb-animation-duration', defaultDuration),
        easing: readTimingValue(element, 'data-osb-animation-easing', '--osb-animation-easing', 'ease'),
    };
}

function isAlwaysOnViewAnimationActive(element: HTMLElement, animationName: string) {
    return element.dataset.osbViewAnimationEvent === alwaysOnViewTriggerValue
        && element.dataset.osbViewAnimationName === animationName
        && element.classList.contains('osb-view-animation-always-on')
        && element.classList.contains(`osb-view-animate-${animationName}`);
}

function activateAlwaysOnViewAnimation(element: HTMLElement, forceRestart = false) {
    const animationName = readViewAnimationValue(element);

    if (isNoAnimationValue(animationName)) {
        clearScoreboardViewAnimationState(element);
        return;
    }

    if (!forceRestart && isAlwaysOnViewAnimationActive(element, animationName)) {
        return;
    }

    const { duration, easing } = getViewAnimationTiming(element, animationName);
    const animationClass = `osb-view-animate-${animationName}`;

    element.classList.remove('osb-view-animating', 'osb-view-animation-always-on', ...getViewAnimationClass(element));
    element.style.setProperty('--osb-active-animation-duration', duration);
    element.style.setProperty('--osb-active-animation-easing', easing);
    element.dataset.osbViewAnimationEvent = alwaysOnViewTriggerValue;
    element.dataset.osbViewAnimationName = animationName;
    element.dataset.osbViewAnimationKey = `${Date.now()}`;

    void element.offsetWidth;

    element.classList.add('osb-view-animating', 'osb-view-animation-always-on', animationClass);
}

export function initializeAlwaysOnViewAnimations(root: ParentNode = document) {
    const candidates = root instanceof HTMLElement
        ? [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
        : Array.from(root.querySelectorAll<HTMLElement>('*'));

    candidates.forEach((element) => {
        if (!hasExplicitAnimationSetting(element, viewAnimationAttribute, viewAnimationVariable)) {
            if (element.classList.contains('osb-view-animation-always-on')) {
                clearScoreboardViewAnimationState(element);
            }

            return;
        }

        if (!isAlwaysOnViewAnimation(element)) {
            if (element.classList.contains('osb-view-animation-always-on')) {
                clearScoreboardViewAnimationState(element);
            }

            return;
        }

        activateAlwaysOnViewAnimation(element, true);
    });
}

export function addScoreboardAnimationStyles() {
    if (document.getElementById('osb-scoreboard-animation-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'osb-scoreboard-animation-styles';
    style.innerHTML = scoreboardAnimationCSS;
    document.head.appendChild(style);
}

export function triggerScoreboardAnimation(
    element: HTMLElement,
    eventName: ScoreboardAnimationEvent,
    onComplete?: () => void,
) {
    const animationName = readAnimationValue(element, eventName);

    if (isNoAnimationValue(animationName)) {
        clearScoreboardAnimationState(element);
        onComplete?.();
        return;
    }

    const duration = readTimingValue(element, 'data-osb-animation-duration', '--osb-animation-duration', '450ms');
    const easing = readTimingValue(element, 'data-osb-animation-easing', '--osb-animation-easing', 'ease');
    const animationClass = `osb-animate-${animationName}`;

    element.classList.remove('osb-animating', ...getAnimationClass(element));
    element.style.setProperty('--osb-active-animation-duration', duration);
    element.style.setProperty('--osb-active-animation-easing', easing);
    element.dataset.osbAnimationEvent = eventName;
    element.dataset.osbAnimationName = animationName;
    element.dataset.osbAnimationKey = `${Date.now()}`;

    // Force a reflow so repeated updates restart the same animation class.
    void element.offsetWidth;

    element.classList.add('osb-animating', animationClass);

    window.setTimeout(() => {
        element.classList.remove('osb-animating', animationClass);
        element.style.removeProperty('--osb-active-animation-duration');
        element.style.removeProperty('--osb-active-animation-easing');
        delete element.dataset.osbAnimationEvent;
        delete element.dataset.osbAnimationName;
        delete element.dataset.osbAnimationKey;
        onComplete?.();
    }, parseDuration(duration));
}

export function triggerScoreboardViewAnimation(element: HTMLElement, changedElement: HTMLElement) {
    if (!hasExplicitAnimationSetting(element, viewAnimationAttribute, viewAnimationVariable)) {
        return;
    }

    if (isAlwaysOnViewAnimation(element)) {
        activateAlwaysOnViewAnimation(element);
        return;
    }

    if (!shouldTriggerViewAnimation(element, changedElement)) {
        return;
    }

    const animationName = readViewAnimationValue(element);

    if (isNoAnimationValue(animationName)) {
        return;
    }

    const { duration, easing } = getViewAnimationTiming(element, animationName);
    const animationClass = `osb-view-animate-${animationName}`;

    element.classList.remove('osb-view-animating', 'osb-view-animation-always-on', ...getViewAnimationClass(element));
    element.style.setProperty('--osb-active-animation-duration', duration);
    element.style.setProperty('--osb-active-animation-easing', easing);
    element.dataset.osbViewAnimationEvent = 'change';
    element.dataset.osbViewAnimationName = animationName;
    element.dataset.osbViewAnimationKey = `${Date.now()}`;

    void element.offsetWidth;

    element.classList.add('osb-view-animating', animationClass);

    window.setTimeout(() => {
        element.classList.remove('osb-view-animating', animationClass);
        element.style.removeProperty('--osb-active-animation-duration');
        element.style.removeProperty('--osb-active-animation-easing');
        delete element.dataset.osbViewAnimationEvent;
        delete element.dataset.osbViewAnimationName;
        delete element.dataset.osbViewAnimationKey;
    }, parseDuration(duration));
}

function triggerParentViewAnimations(element: HTMLElement) {
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
        triggerScoreboardViewAnimation(current, element);
        current = current.parentElement;
    }
}

export function runAnimatedFieldAction(
    element: HTMLElement,
    action: (matchNode: HTMLElement, value: unknown, currentMatchSettings?: unknown) => void,
    value: unknown,
    currentMatchSettings?: unknown,
    fieldName?: string,
) {
    const before = captureElementState(element);
    const initialized = element.dataset.osbAnimationInitialized === 'true';

    if (fieldName) {
        element.dataset.osbField = fieldName;
    }

    action(element, value, currentMatchSettings);

    const after = captureElementState(element);
    const wasVisible = isVisible(before);
    const isNowVisible = isVisible(after);

    element.dataset.osbAnimationInitialized = 'true';

    if (!initialized) {
        return;
    }

    if (wasVisible && !isNowVisible) {
        triggerParentViewAnimations(element);

        if (isNoAnimationValue(readAnimationValue(element, 'disappear'))) {
            clearScoreboardAnimationState(element);
            return;
        }

        element.style.display = getRestoredDisplay(before);
        element.style.opacity = before.inlineOpacity || before.opacity || '1';
        element.style.visibility = before.inlineVisibility || 'visible';

        if (after.inlineHeight === '0px' || Number.parseFloat(after.height) === 0) {
            element.style.height = before.inlineHeight || before.height;
        }

        triggerScoreboardAnimation(element, 'disappear', () => {
            element.style.display = after.inlineDisplay;
            element.style.opacity = after.inlineOpacity;
            element.style.visibility = after.inlineVisibility;
            element.style.height = after.inlineHeight;
        });
        return;
    }

    if (!wasVisible && isNowVisible) {
        triggerParentViewAnimations(element);

        if (isNoAnimationValue(readAnimationValue(element, 'appear'))) {
            clearScoreboardAnimationState(element);
            return;
        }

        triggerScoreboardAnimation(element, 'appear');
        return;
    }

    if (isNowVisible && changedValue(before, after)) {
        triggerParentViewAnimations(element);

        if (isNoAnimationValue(readAnimationValue(element, 'change'))) {
            clearScoreboardAnimationState(element);
            return;
        }

        triggerScoreboardAnimation(element, 'change');
    }
}
