import path from 'path';
import fs from 'fs-extra';
import express from 'express';

import { web_config } from '../constants/constants';
import Logger from '../logger/logger';

export enum WebPanelFunctions {
    startWebServer
}

export default class WebPanel {
    private log_: Logger;

    /**
     * @param logger - logger
     */
    constructor(logger: Logger) {
        this.log_ = logger;
    }


    /**
     * @name createMainRouter()
     * @returns express router for admin pages
    */
    async createMainRouter(): Promise<express.Router> {
        const mainRouter = express.Router();

        mainRouter.get('/', (req, res) => {
            res.send('Hello World!');
        });

        return mainRouter;
    }

    /**
     * @name createGuildRouter()
     * @returns express router for admin pages
    */
    async createGuildRouter(): Promise<express.Router> {
        const guildRouter = express.Router();

        guildRouter.get('/', (req, res) => {
            res.send('Guild!');
        });

        return guildRouter;
    }

    /**
     * @name createThumbnailRouter()
     * @returns express router for admin pages
    */
    async createThumbnailRouter(): Promise<express.Router> {

        const thumbnailRouter = express.Router();

        thumbnailRouter.get('/:id', async (req, res) => {
            try {
                await fs.promises.access(path.join(web_config.default_thumbnail_url, 'thumbnails', req.params.id));
                res.send(path.join(web_config.default_thumbnail_url, 'thumbnails', req.params.id));
            }
            catch {
                res.sendFile(path.join(web_config.default_thumbnail_url, 'thumbnails', 'defaultThumbnail.jpg'));
            }
        });
        return thumbnailRouter;
    }
    async createAdminRouter(): Promise<express.Router> {
        const adminRouter = express.Router();
    
        adminRouter.get('/', (req, res) => {
            res.send('admin');
        });
    
    
        return adminRouter;
    }

    async startWebServer(): Promise<void> {
        this.log_.profile('(1.0) Start Web Server');

        const app = express();
        app.use(express.static(web_config.default_thumbnail_url));

        app.use('/',           await this.createMainRouter());
        app.use('/admin',      await this.createAdminRouter());
        app.use('/thumbnails', await this.createThumbnailRouter());
        app.use('/guild',      await this.createGuildRouter());

        return new Promise((resolve, reject) => {
            try {
                app.listen(web_config.port, () => {
                    this.log_.info(`Webserver listening on {port:${web_config.port}}`);
                    this.log_.profile('(1.0) Start Web Server');
                    }
                );
            }
            catch (error) {
                this.log_.error(`{error:${error.message}} while starting webserver`, error);
                this.log_.profile('(1.0) Start Web Server');
                reject();
            }
        });
    }
}
