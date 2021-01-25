/**
 *
 * @flow
 */

import React from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import { IconContext } from 'react-icons';

import store from '../ui/store';

import Style from './Style';
import CoordinatesBox from './CoordinatesBox';
import CanvasSwitchButton from './CanvasSwitchButton';
import OnlineBox from './OnlineBox';
import ChatButton from './ChatButton';
import ChatBox from './ChatBox';
import Menu from './Menu';
import UI from './UI';
import ExpandMenuButton from './ExpandMenuButton';
import ModalRoot from './ModalRoot';
import ChristmasButton from './ChristmasButton';

const App = () => (
  <div>
    <Style />
    <div id="outstreamContainer" />
    <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
      <CanvasSwitchButton />
      <Menu />
      <ChatButton />
      <ChatBox />
      <OnlineBox />
      <CoordinatesBox />
      <ExpandMenuButton />
      <UI />
      <ModalRoot />
      <ChristmasButton />
    </IconContext.Provider>
  </div>
);

function renderApp(domParent) {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    domParent,
  );
}

export default renderApp;
