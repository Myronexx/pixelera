/* @flow */

import type { Action } from '../actions/types';
import type { Cell } from '../core/Cell';


export type GUIState = {
  showGrid: boolean,
  showPixelNotify: boolean,
  hover: ?Cell,
  pixelsPlaced: number,
  autoZoomIn: boolean,
  isPotato: boolean,
  isLightGrid: boolean,
  compactPalette: boolean,
  paletteOpen: boolean,
  menuOpen: boolean,
  chatChannel: number,
  // timestamps of last read post per channel
  // { 1: Date.now() }
  chatRead: {},
  style: string,
};

const initialState: GUIState = {
  showGrid: false,
  showPixelNotify: false,
  hover: null,
  pixelsPlaced: 0,
  autoZoomIn: false,
  isPotato: false,
  isLightGrid: false,
  compactPalette: false,
  paletteOpen: true,
  menuOpen: false,
  chatChannel: 1,
  chatRead: {},
  style: 'default',
};


export default function gui(
  state: GUIState = initialState,
  action: Action,
): GUIState {
  switch (action.type) {
    case 'TOGGLE_GRID': {
      return {
        ...state,
        showGrid: !state.showGrid,
      };
    }

    case 'TOGGLE_PIXEL_NOTIFY': {
      return {
        ...state,
        showPixelNotify: !state.showPixelNotify,
      };
    }

    case 'TOGGLE_AUTO_ZOOM_IN': {
      return {
        ...state,
        autoZoomIn: !state.autoZoomIn,
      };
    }

    case 'TOGGLE_POTATO_MODE': {
      return {
        ...state,
        isPotato: !state.isPotato,
      };
    }

    case 'TOGGLE_LIGHT_GRID': {
      return {
        ...state,
        isLightGrid: !state.isLightGrid,
      };
    }

    case 'TOGGLE_COMPACT_PALETTE': {
      return {
        ...state,
        compactPalette: !state.compactPalette,
      };
    }

    case 'TOGGLE_OPEN_PALETTE': {
      return {
        ...state,
        paletteOpen: !state.paletteOpen,
      };
    }

    case 'TOGGLE_OPEN_MENU': {
      return {
        ...state,
        menuOpen: !state.menuOpen,
      };
    }

    case 'SELECT_STYLE': {
      const { style } = action;
      return {
        ...state,
        style,
      };
    }

    case 'SET_CHAT_CHANNEL': {
      return {
        ...state,
        chatChannel: action.cid,
      };
    }

    case 'SELECT_COLOR': {
      const {
        compactPalette,
      } = state;
      let {
        paletteOpen,
      } = state;
      if (compactPalette || window.innerWidth < 300) {
        paletteOpen = false;
      }
      return {
        ...state,
        paletteOpen,
      };
    }

    case 'SET_HOVER': {
      const { hover } = action;
      return {
        ...state,
        hover,
      };
    }

    case 'PLACE_PIXEL': {
      let { pixelsPlaced } = state;
      pixelsPlaced += 1;
      return {
        ...state,
        pixelsPlaced,
      };
    }

    case 'UNSET_HOVER': {
      return {
        ...state,
        hover: null,
      };
    }

    default:
      return state;
  }
}
