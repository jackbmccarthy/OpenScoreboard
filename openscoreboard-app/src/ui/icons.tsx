import React from 'react';
import { AntDesign, Feather } from '@expo/vector-icons';

export function Icon({ children }: any) {
  return <>{children}</>;
}

export function AddIcon(props: any) {
  return <AntDesign name="plus" size={props.size === 'xl' ? 24 : 18} color={props.color ?? '#111827'} />;
}

export function MinusIcon(props: any) {
  return <AntDesign name="minus" size={props.size === 'xl' ? 24 : 18} color={props.color ?? '#111827'} />;
}

export function ChevronLeftIcon(props: any) {
  return <Feather name="chevron-left" size={20} color={props.color ?? '#111827'} />;
}
