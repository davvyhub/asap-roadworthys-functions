import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';

import CustomTaskList from './components/CustomTaskList/CustomTaskList';
import CallDispositionPanel from './components/CallDispositionPanel';

const PLUGIN_NAME = 'AsapRoadworthysPlugin';

export default class AsapRoadworthysPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  async init(flex, manager) {
    // Keep your existing CustomTaskList
    const options = { sortOrder: -1 };
    flex.AgentDesktopView.Panel1.Content.add(
      <CustomTaskList key="AsapRoadworthysPlugin-component" />, 
      options
    );

    // Add Call Disposition Panel as a new tab
    flex.TaskCanvasTabs.Content.add(
      <CallDispositionPanel key="call-disposition-panel" />,
      {
        sortOrder: 1,
        tabLabel: 'Disposition'
      }
    );

    console.log('✅ ASAP Roadworthys Plugin Loaded Successfully!');
  }
}