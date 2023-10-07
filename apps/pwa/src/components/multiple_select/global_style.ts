import { UtilZIndex } from '@/constants/style';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  .react-select-multiple-container {
    -webkit-app-region: no-drag;
  }

  .react-select-multiple-menu {
    -webkit-app-region: no-drag;
    overflow: hidden;
    font-size: 14px;
    border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL} !important;
  }

  .react-select-multiple-menu-portal {
    z-index: ${UtilZIndex.SELECT} !important;
  }

  .react-select-multiple-indicator-separator {
    background-color: ${CSSVariable.COLOR_BORDER} !important;
  }

  .react-select-multiple-control {
    font-size: 14px !important;
    cursor: pointer !important;
    min-height: initial !important;
    box-shadow: none !important;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL} !important;
    border-color: ${CSSVariable.COLOR_BORDER} !important;

    &.focused {
      border-color: ${CSSVariable.COLOR_PRIMARY} !important;
    }

    &.disabled {
      border-color: ${CSSVariable.TEXT_COLOR_DISABLED} !important;
    }
  }

  .react-select-multiple-option {
    cursor: pointer !important;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY} !important;
    background-color: transparent !important;
    
    &:hover {
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE} !important;
    }
  }

  .react-select-multiple-dropdown-indicator {
    padding: 0 5px !important;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY} !important;

    &:hover {
      color: ${CSSVariable.TEXT_COLOR_PRIMARY} !important;
    }
  }

  .react-select-multiple-menu-list {
    max-height: 200px !important;
    ${autoScrollbar}
  }

  .react-select-multiple-multi-value {
    font-size: 12px;
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE} !important;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    border-radius: ${CSSVariable.BORDER_RADIUS_LIGHT} !important;

    &.disabled {
      opacity: 0.5;
    }
  }

  .react-select-multiple-multi-value-remove {
    background-color: transparent;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};

    &:hover {
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE} !important;
      color: ${CSSVariable.COLOR_DANGEROUS} !important;
    }
  }

  .react-select-multiple-placeholder {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY} !important;
  }
`;
