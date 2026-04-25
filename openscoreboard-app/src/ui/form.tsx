import React, {
  Children,
  createElement,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  Switch as RNSwitch,
  Text as RNText,
  TextInput,
  View as RNView,
} from 'react-native';
import { Checkbox as HeroCheckbox } from 'heroui-native/checkbox';
import { Separator } from 'heroui-native/separator';

function mapSpacing(value: any) {
  return typeof value === 'number' ? value : value;
}

function extractStyleFromProps(props: Record<string, any>, kind: 'view' | 'text' = 'view') {
  const style: Record<string, any> = {};

  const spacingMap: Array<[string, string]> = [
    ['p', 'padding'],
    ['padding', 'padding'],
    ['pt', 'paddingTop'],
    ['paddingTop', 'paddingTop'],
    ['pb', 'paddingBottom'],
    ['paddingBottom', 'paddingBottom'],
    ['pl', 'paddingLeft'],
    ['paddingLeft', 'paddingLeft'],
    ['pr', 'paddingRight'],
    ['paddingRight', 'paddingRight'],
    ['px', 'paddingHorizontal'],
    ['py', 'paddingVertical'],
    ['m', 'margin'],
    ['margin', 'margin'],
    ['mt', 'marginTop'],
    ['mb', 'marginBottom'],
    ['ml', 'marginLeft'],
    ['mr', 'marginRight'],
    ['mx', 'marginHorizontal'],
    ['my', 'marginVertical'],
  ];

  for (const [key, target] of spacingMap) {
    if (typeof props[key] !== 'undefined') {
      style[target] = mapSpacing(props[key]);
    }
  }

  const directMap: Array<[string, string]> = [
    ['width', 'width'],
    ['w', 'width'],
    ['height', 'height'],
    ['h', 'height'],
    ['maxW', 'maxWidth'],
    ['maxWidth', 'maxWidth'],
    ['maxH', 'maxHeight'],
    ['maxHeight', 'maxHeight'],
    ['minW', 'minWidth'],
    ['minWidth', 'minWidth'],
    ['minH', 'minHeight'],
    ['minHeight', 'minHeight'],
    ['flex', 'flex'],
    ['flexBasis', 'flexBasis'],
    ['flexGrow', 'flexGrow'],
    ['flexShrink', 'flexShrink'],
    ['justifyContent', 'justifyContent'],
    ['alignItems', 'alignItems'],
    ['alignSelf', 'alignSelf'],
    ['flexDirection', 'flexDirection'],
    ['flexDir', 'flexDirection'],
    ['backgroundColor', 'backgroundColor'],
    ['bg', 'backgroundColor'],
    ['borderRadius', 'borderRadius'],
    ['borderWidth', 'borderWidth'],
    ['borderColor', 'borderColor'],
    ['opacity', 'opacity'],
    ['gap', 'gap'],
  ];

  for (const [key, target] of directMap) {
    if (typeof props[key] !== 'undefined') {
      style[target] = props[key];
    }
  }

  if (kind === 'text') {
    if (typeof props.color !== 'undefined') style.color = props.color;
    if (typeof props.fontSize !== 'undefined') style.fontSize = props.fontSize;
    if (typeof props.fontWeight !== 'undefined') style.fontWeight = props.fontWeight;
    if (typeof props.textAlign !== 'undefined') style.textAlign = props.textAlign;
    if (typeof props.lineHeight !== 'undefined') style.lineHeight = props.lineHeight;
    if (props.underline) style.textDecorationLine = 'underline';
  }

  return style;
}

function omitProps<T extends Record<string, any>>(props: T, keys: string[]) {
  const clone: Record<string, any> = {};
  for (const key of Object.keys(props)) {
    if (!keys.includes(key)) {
      clone[key] = props[key];
    }
  }
  return clone;
}

function FormControlRoot({ children, ...props }: any) {
  return <RNView {...props} style={[styles.formControl, extractStyleFromProps(props, 'view'), props.style]}>{children}</RNView>;
}

function FormControlLabel({ children, ...props }: any) {
  return <RNText {...props} style={[styles.formLabel, extractStyleFromProps(props, 'text'), props.style]}>{children}</RNText>;
}

function FormControlErrorMessage({ children, ...props }: any) {
  return <RNText {...props} style={[styles.formError, extractStyleFromProps(props, 'text'), props.style]}>{children}</RNText>;
}

export const FormControl = Object.assign(FormControlRoot, {
  Label: FormControlLabel,
  ErrorMessage: FormControlErrorMessage,
});

export const Input = forwardRef<any, any>(function AppInput(props, ref) {
  const {
    value,
    onChangeText,
    isReadOnly,
    InputRightElement,
    style,
    ...rest
  } = props;
  const inputRef = useRef<any>(null);
  const generatedId = useId().replace(/:/g, '');
  useImperativeHandle(ref, () => ({
    id: generatedId,
    value,
    focus: () => inputRef.current?.focus?.(),
  }), [generatedId, value]);

  const inputProps = omitProps(rest, [
    'flex', 'p', 'padding', 'fontSize', 'fontWeight', 'textAlign', 'lineHeight',
    'w', 'width', 'h', 'height', 'maxW', 'maxWidth', 'maxH', 'maxHeight', 'minW', 'minWidth', 'minH', 'minHeight',
  ]);

  return (
    <RNView style={[styles.inputWrap, extractStyleFromProps(rest, 'view'), style]}>
      <TextInput
        {...inputProps}
        editable={!isReadOnly}
        id={generatedId as any}
        onChangeText={onChangeText}
        ref={inputRef}
        style={[styles.input, extractStyleFromProps(rest, 'text')]}
        value={value}
      />
      {InputRightElement ? <RNView style={styles.inputRight}>{InputRightElement}</RNView> : null}
    </RNView>
  );
});

type SelectItemElementProps = { label: string; value: string };

function SelectItem(_props: SelectItemElementProps) {
  return null;
}

export function Select(props: any) {
  const options = Children.toArray(props.children)
    .filter(isValidElement)
    .map((child: any) => child.props as SelectItemElementProps);

  return createElement(
    'select',
    {
      value: props.selectedValue,
      onChange: (event: any) => props.onValueChange?.(event.target.value),
      style: {
        border: '1px solid #d4d4d8',
        borderRadius: 8,
        minHeight: 40,
        padding: '8px 10px',
        width: '100%',
        backgroundColor: '#fff',
      },
    },
    options.map((option) =>
      createElement('option', { key: option.value, value: option.value }, option.label)
    )
  );
}

Select.Item = SelectItem as any;

const RadioGroupContext = React.createContext<{ value?: string; onChange?: (value: string) => void }>({});

function RadioGroup({ children, value, onChange, ...props }: any) {
  return (
    <RadioGroupContext.Provider value={{ value, onChange }}>
      <RNView {...props} style={[styles.radioGroup, extractStyleFromProps(props, 'view'), props.style]}>{children}</RNView>
    </RadioGroupContext.Provider>
  );
}

function RadioItem({ value, children }: any) {
  const group = useContext(RadioGroupContext);
  const checked = group.value === value;
  return createElement(
    'label',
    { style: { display: 'flex', alignItems: 'center', gap: 6 } },
    createElement('input', {
      checked,
      onChange: () => group.onChange?.(value),
      type: 'radio',
    }),
    children
  );
}

export const Radio = Object.assign(RadioItem, { Group: RadioGroup });

export function Checkbox({ children, isChecked, onChange, ...props }: any) {
  return (
    <HeroCheckbox
      isSelected={!!isChecked}
      onSelectedChange={(checked) => onChange?.({ target: { checked } })}
      {...props}
    >
      {children}
    </HeroCheckbox>
  );
}

export function Switch(props: any) {
  return <RNSwitch onValueChange={props.onToggle ?? props.onValueChange} value={!!props.isChecked || !!props.value} />;
}

export function Divider(props: any) {
  return <Separator {...props} />;
}

export function TextField(props: any) {
  return <Input multiline numberOfLines={4} textAlignVertical="top" {...props} />;
}

const styles = {
  formControl: {
    gap: 8,
  },
  formLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  formError: {
    color: '#dc2626',
    fontSize: 12,
  },
  inputWrap: {
    alignItems: 'center' as const,
    backgroundColor: '#fff',
    borderColor: '#d4d4d8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row' as const,
    minHeight: 42,
    paddingHorizontal: 10,
  },
  input: {
    color: '#111827',
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  inputRight: {
    marginLeft: 8,
  },
  radioGroup: {
    gap: 8,
  },
};
