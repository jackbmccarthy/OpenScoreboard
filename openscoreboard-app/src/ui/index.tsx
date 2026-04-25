export { Button } from 'heroui-native/button';
export { Avatar } from 'heroui-native/avatar';
export { Spinner } from 'heroui-native/spinner';
export { Input } from './form';
export { Divider, FormControl, Radio, Select, Switch, Checkbox, TextField } from './form';
export { Modal } from './modal';
export { AddIcon, ChevronLeftIcon, Icon, MinusIcon } from './icons';
export { FlatList, Image, ScrollView, Text, View } from 'react-native';

export function NativeBaseProvider({ children }: { children?: React.ReactNode }) {
  return children ?? null;
}
