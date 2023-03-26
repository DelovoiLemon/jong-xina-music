import Logger from '../logger/logger';

import IPCInterface from '../ipc_template/ipc_interface';
import { WebPanelFunctions } from './web_panel';
import { ipc_config } from '../constants/constants';

/**
 * WebPanelInterface - Connects to a WebPanel component running as a seperate thread
 */
export default class WebPanelInterface extends IPCInterface<WebPanelFunctions> {
  constructor(logger: Logger) {
    super(ipc_config.web_panel_ipc_id, logger);
  }
  
  async startServer() {
    await this.RequestFunction(WebPanelFunctions.startWebServer, []);
  }
  
  async stopServer(): Promise<void> {
    await this.RequestFunction(WebPanelFunctions.stopWebServer, []);
  }
}