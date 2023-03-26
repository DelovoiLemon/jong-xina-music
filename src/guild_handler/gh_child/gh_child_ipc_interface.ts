import Logger from '../../logger/logger';

import IPCInterface from '../../ipc_template/ipc_interface';
import { GHChildFunctions, InteractionInfo, MessageInfo } from './gh_child';
import { ipc_config } from '../../constants/constants';

/**
 * WebPanelInterface - Connects to a WebPanel component running as a seperate thread
 */
export default class GHChildInterface extends IPCInterface<GHChildFunctions> {
  constructor(logger: Logger) {
    super(ipc_config.gh_child_ipc_id, logger);
  }
  
  async start(content: string) {
    await this.RequestFunction(GHChildFunctions.Start, [content]);
  }

  async message(content: MessageInfo): Promise<boolean> {
    return await this.RequestFunction(GHChildFunctions.Start, [content]);
  }

  async interaction(content: InteractionInfo): Promise<boolean> {
    return await this.RequestFunction(GHChildFunctions.Start, [content]);
  }

  async removeGuild(purge: boolean): Promise<void> {
    await this.RequestFunction(GHChildFunctions.RemoveGuild, [purge]);
  }
}