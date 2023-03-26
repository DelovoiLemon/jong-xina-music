import ipc from 'node-ipc';
import { ipc_config } from '../constants/constants';
import Logger from '../logger/logger';
import StartIPCServer from '../ipc_template/ipc_server';
import WebPanel, { WebPanelFunctions } from './web_panel';

export function StartWebComponent(): typeof ipc {
  const logger = new Logger(ipc_config.web_panel_ipc_id);
  const web_panel = new WebPanel(logger);
  
  return StartIPCServer<WebPanelFunctions>(ipc_config.web_panel_ipc_id, logger, Promise.resolve(), async (function_name, args) => {
    switch (function_name) {
      case WebPanelFunctions.startWebServer: {
        await web_panel.startWebServer();
        break;
      }
      case WebPanelFunctions.stopWebServer: {
        await web_panel.stopWebServer();
        break;
      }
    }
    return '';
  });
}

StartWebComponent();