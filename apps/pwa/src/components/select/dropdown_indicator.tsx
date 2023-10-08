import { CSSVariable } from '@/global_style';
import { CSSProperties } from 'react';
import { MdOutlineArrowDropDown } from 'react-icons/md';

const style: CSSProperties = {
  margin: '0 5px',
  color: CSSVariable.TEXT_COLOR_PRIMARY,
};

function DropdownIndicator() {
  return <MdOutlineArrowDropDown style={style} />;
}

export default DropdownIndicator;
