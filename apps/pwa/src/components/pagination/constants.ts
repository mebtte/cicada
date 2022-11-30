export interface PageItem {
  text: string | number;
  active?: boolean;
  onClick: () => void;
}
