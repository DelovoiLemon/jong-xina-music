import { ipc_config } from '../constants/constants';
import Logger from '../logger/logger';

import IPCInterface from '../ipc_template/ipc_interface';
import { WebPanelFunctions } from './web_panel';

/**
 * WebPanelInterface - Connects to a WebPanel component running as a seperate thread
 */
export default class WebPanelInterface extends IPCInterface<WebPanelFunctions> {
  constructor(logger: Logger) {
    super(ipc_config.web_panel_ipc_id, logger);
    }
}