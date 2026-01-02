
import { BoxType } from './types';

export const DEFAULT_BOX_TYPES: BoxType[] = [
  { id: 'box-1', name: 'Caja Grande', weight: 15, color: 'bg-amber-600', icon: '📦' },
  { id: 'box-2', name: 'Caja Mediana', weight: 8.5, color: 'bg-orange-500', icon: '📦' },
  { id: 'box-3', name: 'Caja Pequeña', weight: 5, color: 'bg-yellow-400', icon: '📦' },
];

export const DEFAULT_MAX_CAPACITY = 1000; // 1000kg standard van
