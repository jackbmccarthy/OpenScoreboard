import { createElement } from 'react';

/**
 * 
 * @param {*} props 
 * @param {date | time |datetime} props.type  
 * @returns 
 */

export function DateTimePicker({ value, onChange, type }) {

    return createElement('input', {
        type: type,
        value: value,
        onInput: onChange,
    });
}
