/*
 * Hooks for websocket client to store changes
 *
 * @flow
 */

import ProtocolClient from '../socket/ProtocolClient';

export default (store) => (next) => (action) => {
  switch (action.type) {
    case 'RECEIVE_BIG_CHUNK':
    case 'RECEIVE_BIG_CHUNK_FAILURE': {
      if (!action.center) {
        break;
      }
      const [, cx, cy] = action.center;
      ProtocolClient.registerChunk([cx, cy]);
      break;
    }

    case 'SET_NAME':
    case 'LOGIN':
    case 'LOGOUT': {
      ProtocolClient.reconnect();
      break;
    }

    case 'REQUEST_PLACE_PIXEL': {
      const {
        i, j, offset, color,
      } = action;
      ProtocolClient.requestPlacePixel(
        i, j, offset,
        color,
      );
      break;
    }

    default:
    // nothing
  }

  const ret = next(action);

  // executed after reducers
  switch (action.type) {
    case 'RELOAD_URL':
    case 'SELECT_CANVAS':
    case 'RECEIVE_ME': {
      const state = store.getState();
      const { canvasId } = state.canvas;
      ProtocolClient.setCanvas(canvasId);
      break;
    }

    default:
    // nothing
  }

  return ret;
};
