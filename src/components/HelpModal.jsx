/**
 *
 * @flow
 */

import React from 'react';
// import FaFacebook from 'react-icons/lib/fa/facebook';
// import FaTwitter from 'react-icons/lib/fa/twitter';
// import FaRedditAlien from 'react-icons/lib/fa/reddit-alien';

/* eslint-disable max-len */


const HelpModal = () => (
  <p style={{ textAlign: 'center', paddingLeft: '5%', paddingRight: '5%' }}>
    <p className="modaltext">Place color pixels on a large canvas with other players online!
      Our main canvas is a huge worldmap, you can place wherever you like, but you will have to wait a specific
      Cooldown between pixels. You can check out the cooldown and requiremnts on the Canvas Selection menu (globe button on top).
      Some canvases have a different cooldown for replacing a user-set pixels than placing on a unset pixel. i.e. 4s/7s means 4s on fresh
      pixels and 7s on already set pixels.
      Higher zoomlevels take some time to update, the 3D globe gets updated at least once per day.
      Have fun!</p>
    <p>Guilded (recommended): <a href="./guilded" target="_blank" rel="noopener noreferrer">pixelplanet.fun/guilded</a></p>
    <p>Source on <a href="https://github.com/pixelplanetdev/pixelplanet" target="_blank" rel="noopener noreferrer">github</a></p>
    <p>Reddit: <a href="https://www.reddit.com/r/PixelPlanetFun/" target="_blank" rel="noopener noreferrer">r/PixelPlanetFun</a></p>
    <p className="modaltitle">Map Data</p>
    <p className="modaltext">The bare map data that we use, together with converted OpenStreetMap tiles for orientation,
      can be downloaded from mega.nz here: <a href="https://mega.nz/#!JpkBwAbJ!EnSLlZmKv3kEBE0HDhakTgAZZycD3ELjduajJxPGaXo">pixelplanetmap.zip</a> (422MB)</p>
    <p className="modaltitle">Detected as Proxy?</p>
    <p className="modaltext">If you got detected as proxy, but you are none, please send us an e-mail with <a href="https://www.whatismyip.com/">your IP</a> to <a href="mailto:pixelplanetdev@gmail.com">pixelplanetdev@gmail.com</a>. Do not post your IP anywhere else. We are sorry for the inconvenience.</p>
    <h3 className="modaltitle">2D Controls</h3>
    <p className="modaltext">Click a color in palette to select</p>
    <p className="modaltext">Press <kbd>G</kbd> to toggle grid</p>
    <p className="modaltext">Press <kbd>X</kbd> to toggle showing of pixel activity</p>
    <p className="modaltext">Press <kbd>R</kbd> to copy coordinates</p>
    <p className="modaltext">Press <kbd>Q</kbd> or <kbd>E</kbd> to zoom</p>
    <p className="modaltext">Press <kbd>W</kbd>,<kbd>A</kbd>,<kbd>S</kbd>, <kbd>D</kbd> to move</p>
    <p className="modaltext">Press <kbd>↑</kbd>,<kbd>←</kbd>,<kbd>↓</kbd>, <kbd>→</kbd> to move</p>
    <p className="modaltext">Drag mouse to move</p>
    <p className="modaltext">Scroll mouse wheel to zoom</p>
    <p className="modaltext">Click middle mouse button to current hovering color</p>
    <p className="modaltext">Pinch to zoom (on touch devices)</p>
    <p className="modaltext">Pan to move (on touch devices)</p>
    <p className="modaltext">Click or tap to place a pixel</p>
    <h3 className="modaltitle">3D Controls</h3>
    <p className="modaltext">Press <kbd>W</kbd>,<kbd>A</kbd>,<kbd>S</kbd>, <kbd>D</kbd> to move</p>
    <p className="modaltext">Press <kbd>↑</kbd>,<kbd>←</kbd>,<kbd>↓</kbd>, <kbd>→</kbd> to move</p>
    <p className="modaltext">Scroll mouse wheel to zoom</p>
    <p className="modaltext">Left click and drag mouse to rotate</p>
    <p className="modaltext">Middle click and drag mouse to zoom</p>
    <p className="modaltext">Right click and drag mouse to pan</p>
    <p className="modaltext">Left Click or tap to place a pixel</p>
    <p className="modaltext">Right Click of double tap to remove a pixel</p>
    <p>Partners: <a href="https://www.crazygames.com/c/io" target="_blank" rel="noopener noreferrer">crazygames.com</a></p>
    { (typeof window.hcaptcha === 'undefined')
      ? (
        <p className="modaltext">
          <small>This site is protected by reCAPTCHA and the Google&nbsp;
            <a href="https://policies.google.com/privacy">Privacy Policy</a>&nbsp;and&nbsp;
            <a href="https://policies.google.com/terms">Terms of Service</a>&nbsp;apply.
          </small>
        </p>
      ) : (
        <p className="modaltext">
          <small>This site is protected by hCAPTCHA and its&nbsp;
            <a href="https://hcaptcha.com/privacy">Privacy Policy</a>&nbsp;and&nbsp;
            <a href="https://hcaptcha.com/terms">Terms of Service</a>&nbsp;apply.
          </small>
        </p>
      )}
  </p>
);

const data = {
  content: HelpModal,
  title: 'Welcome to PixelPlanet.fun',
};

export default data;
