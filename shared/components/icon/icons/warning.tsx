import { SVGAttributes } from 'react';
import { Svg, Path } from '../base';

function Warning(props: SVGAttributes<SVGElement>) {
  return (
    <Svg {...props}>
      <Path d="M543.082667 161.173333a64 64 0 0 1 24.853333 24.853334l317.909333 572.224A64 64 0 0 1 829.866667 853.333333H194.133333a64 64 0 0 1-55.957333-95.082666L456.064 186.026667a64 64 0 0 1 87.018667-24.853334zM512 217.109333L194.112 789.333333H829.866667L512 217.109333zM544 661.333333v64h-64v-64h64z m0-276.437333V618.666667h-64V384.896h64z" />
    </Svg>
  );
}

export default Warning;
