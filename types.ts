
export interface BoxType {
  id: string;
  name: string;
  weight: number;
  color: string;
  icon: string;
  isCustom?: boolean;
}

export interface BoxQuantities {
  [key: string]: number;
}

export interface LoadingAdvice {
  status: 'safe' | 'warning' | 'danger';
  message: string;
  tips: string[];
}
