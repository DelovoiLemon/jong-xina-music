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
        web_panel.startWebServer(args[0]);
        return '';
      }
    }
  });
}

// only start component if 'start-component' argument is passed in
export function CheckStartComponent() {
  process.argv.forEach((arg) => {
    if (arg === 'start-component') StartWebComponent();
    console.log(`start.server ${arg}`);
  });
}

CheckStartComponent();