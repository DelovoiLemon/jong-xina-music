import ipc from 'node-ipc';
import { ipc_config } from '../../constants/constants';
import Logger from '../../logger/logger';
import StartIPCServer from '../../ipc_template/ipc_server';
import GHChild, { GHChildFunctions } from './gh_child';


export function StartGHChidComponent(id: string): typeof ipc {
    const logger = new Logger(ipc_config.web_panel_ipc_id);
    const gh_child = new GHChild(logger, id);
    
    return StartIPCServer<GHChildFunctions>(ipc_config.web_panel_ipc_id, logger, Promise.resolve(), async (function_name, args) => {
      switch (function_name) {
        case GHChildFunctions.Message: {
          await gh_child.message(args[0]);
          break;
        }
        case GHChildFunctions.Interaction: {
            await gh_child.interaction(args[0]);
            break;
          }
        case GHChildFunctions.RemoveGuild: {
            await gh_child.removeGuild(args[0]);
            break;
          }
      }
      return '';
    });
  }