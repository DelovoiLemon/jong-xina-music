import path from 'path';
import fs from 'fs-extra';
import express from 'express';

import { web_config } from '../constants/constants';
import Logger from '../logger/logger';


export enum WebPanelFunctions {
  startWebServer,
  stopWebServer
}

export default class WebPanel {
    private log_: Logger;
    private app;
    /**
     * @param logger - logger
     */
    constructor(logger: Logger) {
        this.log_ = logger;
        this.app = express();
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

        this.app.use(express.static(web_config.default_thumbnail_url));

        this.app.use('/',           await this.createMainRouter());
        this.app.use('/admin',      await this.createAdminRouter());
        this.app.use('/thumbnails', await this.createThumbnailRouter());
        this.app.use('/guild',      await this.createGuildRouter());
        
        this.app.on("Web Panel", () => {
            this.log_.info("New connection to Web Server");
        });

        return new Promise((resolve, reject) => {
            try {
                this.app.listen(web_config.port, web_config.domain);
                this.log_.info(`Webserver listening on {port:${web_config.port}}`);
                this.log_.profile('(1.0) Start Web Server');
            }
            catch (error) {
                this.log_.error(`{error:${error.message}} while starting webserver`, error);
                this.log_.profile('(1.0) Start Web Server');
                reject();
            }
        });

        


    }
    async stopWebServer(): Promise<void> {
        this.app.removeListener("Web Panel", () => {
            this.log_.info(`Webserver stopped on {port:${web_config.port}}`);
            this.log_.profile('(1.0) Stop Web Server');
                    
        });
    }
}
