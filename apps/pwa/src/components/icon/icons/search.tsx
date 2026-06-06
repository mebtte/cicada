import Icon, { IconProps } from '../base';

function Search(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <line x1="14.8" y1="14.8" x2="19.5" y2="19.5" />
    </Icon>
  );
}

export default Search;
