/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaQuestion } from 'react-icons/fa';
import { t } from 'ttag';

import { showHelpModal } from '../actions';


const HelpButton = ({ open }) => (
  <div
    id="helpbutton"
    className="actionbuttons"
    onClick={open}
    role="button"
    title={t`Help`}
    tabIndex={-1}
  >
    <FaQuestion />
  </div>
);


function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showHelpModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(HelpButton);
