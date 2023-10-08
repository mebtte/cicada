import { ComponentSize, UtilZIndex } from '@/constants/style';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { createGlobalStyle } from 'styled-components';
import {
  ClassName,
  MultiClassName,
  SingleClassName,
  StateClassName,
} from './constants';

export default createGlobalStyle`
  .${ClassName.CONTAINER} {
    -webkit-app-region: no-drag;
  }

  .${ClassName.MENU} {
    -webkit-app-region: no-drag;
    overflow: hidden;
    font-size: 14px;
    border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL} !important;
  }

  .${ClassName.MENU_PORTAL} {
    z-index: ${UtilZIndex.SELECT} !important;
  }

  .${ClassName.INDICATOR_SEPARATOR} {
    background-color: ${CSSVariable.COLOR_BORDER} !important;
  }

  .${ClassName.CONTROL} {
    font-size: 14px !important;
    cursor: pointer !important;
    min-height: ${ComponentSize.NORMAL}px !important;
    box-shadow: none !important;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL} !important;
    border-color: ${CSSVariable.COLOR_BORDER} !important;

    &.${StateClassName.FOCUSED} {
      border-color: ${CSSVariable.COLOR_PRIMARY} !important;
    }

    &.${StateClassName.DISABLED} {
      border-color: ${CSSVariable.TEXT_COLOR_DISABLED} !important;
    }
  }

  .${ClassName.OPTION} {
    cursor: pointer !important;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY} !important;
    background-color: transparent !important;
    
    &:hover {
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE} !important;
    }

    &.${StateClassName.SELECTED} {
      color: #fff !important; 
      background-color: ${CSSVariable.COLOR_PRIMARY} !important;
    }
  }

  .${ClassName.VALUE_CONTAINER} {
    padding: 2px 10px !important;
  }

  .${ClassName.INPUT} {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY} !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .${ClassName.MENU_LIST} {
    max-height: 200px !important;
    ${autoScrollbar}
  }

  .${ClassName.PLACEHOLDER} {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY} !important;
    margin: 0 !important;
  }

  .${SingleClassName.SINGLE_VALUE} {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY} !important;
    margin: 0 !important;
  }

  .${MultiClassName.MULTI_VALUE} {
    font-size: 12px;
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE} !important;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    border-radius: ${CSSVariable.BORDER_RADIUS_LIGHT} !important;
    margin-left: 0;

    &.${StateClassName.DISABLED} {
      opacity: 0.5;
    }
  }

  .${MultiClassName.MULTI_VALUE_REMOVE} {
    background-color: transparent;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};

    &:hover {
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE} !important;
      color: ${CSSVariable.COLOR_DANGEROUS} !important;
    }
  }
`;
