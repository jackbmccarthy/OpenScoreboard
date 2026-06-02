import {
    animationEasingOptions,
    appearAnimationOptions,
    changeAnimationOptions,
    disappearAnimationOptions,
    viewAnimationOptions,
    viewTriggerGroupOptions,
    viewTriggerScopeOptions,
} from '../animationOptions';
import {
    conditionalShowFieldList,
    courtSideGameFieldList,
    currentGameFieldList,
    imageFieldList,
    solidColorFieldList,
    teamFieldList,
    textFieldList,
} from '../fieldLists';

const appearAnimationProperty = '--osb-appear-animation';
const disappearAnimationProperty = '--osb-disappear-animation';
const changeAnimationProperty = '--osb-change-animation';
const viewAnimationProperty = '--osb-view-animation';
const viewTriggerGroupProperty = '--osb-view-animation-trigger-group';
const viewTriggerScopeProperty = '--osb-view-animation-trigger-scope';
const viewTriggerFieldsProperty = '--osb-view-animation-trigger-fields';
const viewColorProperty = '--osb-view-animation-color';
const viewAccentProperty = '--osb-view-animation-accent';
const viewWidthProperty = '--osb-view-animation-width';
const viewOffsetProperty = '--osb-view-animation-offset';
const durationProperty = '--osb-animation-duration';
const easingProperty = '--osb-animation-easing';

const valueChangeAnimationProperties = [
    changeAnimationProperty,
    durationProperty,
    easingProperty,
];

const conditionalAnimationProperties = [
    appearAnimationProperty,
    disappearAnimationProperty,
    durationProperty,
    easingProperty,
];

const timerAnimationProperties = [
    appearAnimationProperty,
    disappearAnimationProperty,
    changeAnimationProperty,
    durationProperty,
    easingProperty,
];

const viewAnimationProperties = [
    viewAnimationProperty,
    viewTriggerGroupProperty,
    viewTriggerScopeProperty,
    viewTriggerFieldsProperty,
    viewColorProperty,
    viewAccentProperty,
    viewWidthProperty,
    viewOffsetProperty,
    durationProperty,
    easingProperty,
];

const allAnimationProperties = Array.from(new Set([
    ...valueChangeAnimationProperties,
    ...conditionalAnimationProperties,
    ...timerAnimationProperties,
    ...viewAnimationProperties,
]));

const valueChangeComponentTypes = new Set([
    ...textFieldList,
    ...currentGameFieldList,
    ...teamFieldList,
    ...solidColorFieldList,
    ...courtSideGameFieldList,
    ...imageFieldList,
].map((field) => field.field));

const gameScoreContainerTypes = Array.from({ length: 9 }, (_, index) => `isGame${index + 1}Started`);

const conditionalComponentTypes = new Set([
    ...conditionalShowFieldList.map((field) => field.field),
    'isACurrentlyServing',
    'isSecondServer',
    'isGamePoint',
    'isMatchPoint',
    'isATimeOutActive',
    'isBTimeOutActive',
    'isTimeOutActive',
    'isATimeOutUsed',
    'isBTimeOutUsed',
    'isAYellowCarded',
    'isBYellowCarded',
    'isARedCarded',
    'isBRedCarded',
    'courtSideIsACurrentlyServing',
    'courtSideIsBCurrentlyServing',
    ...gameScoreContainerTypes,
]);

const timerComponentTypes = new Set([
    'timeOutTimerA',
    'timeOutTimerB',
    'timeOutTimer',
]);

const conditionalBlockTypes = new Set([
    'customServiceIconA',
    'customServiceIconB',
    'SecondServerIconA',
    'SecondServerIconB',
]);

const viewAnimationComponentTypes = new Set([
    'rowContainer',
    'columnContainer',
    'wrapper',
    'body',
    ...gameScoreContainerTypes,
]);

function getComponentType(component) {
    return component?.get?.('type') || component?.get?.('tagName') || '';
}

function getComponentStyle(component) {
    if (!component) {
        return {};
    }

    if (typeof component.getStyle === 'function') {
        return component.getStyle() || {};
    }

    return component.get?.('style') || {};
}

function getComponentClasses(component) {
    if (!component) {
        return [];
    }

    const classes = typeof component.getClasses === 'function' ? component.getClasses() : [];
    const attributes = component.getAttributes?.() || {};
    const attributeClasses = typeof attributes.class === 'string' ? attributes.class.split(/\s+/) : [];

    return [...classes, ...attributeClasses].filter(Boolean);
}

function hasComponentClass(component, componentTypes: Set<string>) {
    return getComponentClasses(component).some((className) => componentTypes.has(className));
}

function isValueChangeComponent(component) {
    const type = getComponentType(component);

    if (valueChangeComponentTypes.has(type)) {
        return true;
    }

    return hasComponentClass(component, valueChangeComponentTypes);
}

function isConditionalComponent(component) {
    const type = getComponentType(component);

    if (conditionalComponentTypes.has(type) || conditionalBlockTypes.has(type)) {
        return true;
    }

    return hasComponentClass(component, conditionalComponentTypes);
}

function isTimerComponent(component) {
    const type = getComponentType(component);

    if (timerComponentTypes.has(type)) {
        return true;
    }

    return hasComponentClass(component, timerComponentTypes);
}

function hasChildComponents(component) {
    if (typeof component?.components !== 'function') {
        return false;
    }

    return component.components().length > 0;
}

function hasStructuralContainerName(component) {
    const type = getComponentType(component).toLowerCase();
    const classNames = getComponentClasses(component).map((className) => className.toLowerCase());

    return [type, ...classNames].some((name) => name.includes('container') || name.includes('wrapper'));
}

function hasStructuralContainerStyle(component) {
    const style = getComponentStyle(component);

    return style.display === 'flex'
        || style.display === 'grid'
        || Boolean(style['flex-direction'])
        || Boolean(style['grid-template-columns'])
        || Boolean(style['grid-template-rows']);
}

function isViewAnimationComponent(component) {
    const type = getComponentType(component);
    const tagName = component?.get?.('tagName') || '';

    if (viewAnimationComponentTypes.has(type) || viewAnimationComponentTypes.has(tagName)) {
        return true;
    }

    if (hasStructuralContainerName(component)) {
        return true;
    }

    const isLeafDataComponent = isValueChangeComponent(component) || isTimerComponent(component);
    if (isLeafDataComponent) {
        return false;
    }

    return hasChildComponents(component) && hasStructuralContainerStyle(component);
}

function getAnimationRequirements(component) {
    if (!component) {
        return [];
    }

    const requirements = [];

    if (isValueChangeComponent(component)) {
        requirements.push(...valueChangeAnimationProperties);
    }

    if (isConditionalComponent(component)) {
        requirements.push(...conditionalAnimationProperties);
    }

    if (isTimerComponent(component)) {
        requirements.push(...timerAnimationProperties);
    }

    if (isViewAnimationComponent(component)) {
        requirements.push(...viewAnimationProperties);
    }

    return Array.from(new Set(requirements));
}

function updateComponentAnimationRequirements(component, requirements) {
    if (!component) {
        return;
    }

    const currentRequirements = component.get?.('stylable-require') || [];
    const nextRequirements = [
        ...currentRequirements.filter((property) => !allAnimationProperties.includes(property)),
        ...requirements,
    ];

    component.set?.('stylable-require', nextRequirements);
}

function updateAnimationSectorVisibility(editor: grapesjs.default.Editor, component = editor.getSelected()) {
    const requirements = getAnimationRequirements(component);
    const sector = editor.StyleManager.getSector('Animations');
    const shouldShowSector = requirements.length > 0;

    updateComponentAnimationRequirements(component, requirements);

    allAnimationProperties.forEach((propertyName) => {
        const property = editor.StyleManager.getProperty('Animations', propertyName);
        property?.set('visible', requirements.includes(propertyName));
    });

    sector?.set('visible', shouldShowSector);

    const sectorElement = document.querySelector<HTMLElement>('.gjs-sm-sector__Animations');
    if (sectorElement) {
        sectorElement.style.display = shouldShowSector ? '' : 'none';
    }
}

function addAnimationProperty(editor: grapesjs.default.Editor, property) {
    editor.StyleManager.addProperty('Animations', {
        ...property,
        toRequire: true,
    });
}

export function loadAnimationStyles(editor: grapesjs.default.Editor) {
    editor.StyleManager.addSector('Animations', {
        name: 'Animations',
        open: false,
        visible: false,
    });

    addAnimationProperty(editor, {
        name: 'Appear',
        property: appearAnimationProperty,
        type: 'select',
        default: 'none',
        options: appearAnimationOptions,
    });

    addAnimationProperty(editor, {
        name: 'Disappear',
        property: disappearAnimationProperty,
        type: 'select',
        default: 'none',
        options: disappearAnimationOptions,
    });

    addAnimationProperty(editor, {
        name: 'Value Change',
        property: changeAnimationProperty,
        type: 'select',
        default: 'none',
        options: changeAnimationOptions,
    });

    addAnimationProperty(editor, {
        name: 'View Reaction',
        property: viewAnimationProperty,
        type: 'select',
        default: 'none',
        options: viewAnimationOptions,
    });

    addAnimationProperty(editor, {
        name: 'View Trigger',
        property: viewTriggerGroupProperty,
        type: 'select',
        default: 'any',
        options: viewTriggerGroupOptions,
    });

    addAnimationProperty(editor, {
        name: 'Trigger Scope',
        property: viewTriggerScopeProperty,
        type: 'select',
        default: 'descendants',
        options: viewTriggerScopeOptions,
    });

    addAnimationProperty(editor, {
        name: 'Custom Fields',
        property: viewTriggerFieldsProperty,
        type: 'text',
        default: '',
    });

    addAnimationProperty(editor, {
        name: 'View Color',
        property: viewColorProperty,
        type: 'color',
        default: '#2d5bff',
    });

    addAnimationProperty(editor, {
        name: 'View Accent',
        property: viewAccentProperty,
        type: 'color',
        default: '#ffffff',
    });

    addAnimationProperty(editor, {
        name: 'View Width',
        property: viewWidthProperty,
        type: 'integer',
        default: '4',
        units: ['px'],
    });

    addAnimationProperty(editor, {
        name: 'View Offset',
        property: viewOffsetProperty,
        type: 'integer',
        default: '0',
        units: ['px'],
    });

    addAnimationProperty(editor, {
        name: 'Duration',
        property: durationProperty,
        type: 'integer',
        default: '450',
        units: ['ms', 's'],
    });

    addAnimationProperty(editor, {
        name: 'Easing',
        property: easingProperty,
        type: 'select',
        default: 'ease',
        options: animationEasingOptions,
    });

    editor.on('component:selected styleManager:update:target', () => {
        updateAnimationSectorVisibility(editor);
    });

    editor.on('component:deselected', () => {
        updateAnimationSectorVisibility(editor, null);
    });

    editor.on('load', () => {
        updateAnimationSectorVisibility(editor);
    });
}
