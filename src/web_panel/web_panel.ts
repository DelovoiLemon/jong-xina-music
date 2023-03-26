import path from 'path';
import fs from 'fs-extra';
import express from 'express';
import winston from 'winston';
import { AuthPlus, OAuth2Client } from 'googleapis-common';

import { web_config } from '../constants/constants';
import Logger from '../logger/logger';
import BotMaster from '../bot_master/bot_master';

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
    async createAdminRouter(oAuth2Client: OAuth2Client): Promise<express.Router> {
        const adminRouter = express.Router();
    
        adminRouter.get('/', (req, res) => {
            // <<<<<<<<<<<<<<<< Should authenticate first
            res.send('admin');
        });
    
        adminRouter.get('/driveAuth/', (req, res) => {
            // <<<<<<<<<<<<<<< Should authenticate first
            if (req.query.code) {
                this.log_.info('Recieved google drive oauth code, getting token');
                oAuth2Client.getToken(req.query.code as string, async (err, token) => {
                    if (err) {
                        this.log_.error(`{error:${err}} when retrieving access token`);
                        // <<<<<<<<<<<<<<<<<<<<< send an error
                        // res.redirect()
                        return;
                    }
    
                    try {
                        await fs.promises.writeFile(web_config.google_token_loc, JSON.stringify(token));
                        this.log_.info(`Saved Google Drive token to {location:${web_config.google_token_loc}}`);
                        res.redirect(`${web_config.domain}/admin`);
                    }
                    catch (error) {
                        this.log_.error(`{error:${error}} while saving google drive token to {location:${web_config.google_token_loc}}`);
                        // <<<<<<<<<<<<<<<<<<<<< send an error
                        // res.redirect()
                    }
                });
                return;
            }
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: web_config.google_scope,
            });
    
            this.log_.info(`Recieved request to authenticate Google Drive API, redirecting user to {url:${authUrl}}`);
            res.redirect(authUrl);
        });
    
        return adminRouter;
    }

    async startWebServer(botMaster: BotMaster): Promise<void> {
        this.log_.profile('(1.0) Start Web Server');

        const app = express();
        app.use(express.static(web_config.default_thumbnail_url));

        const authPlus     = new AuthPlus();
        const oAuth2Client = new authPlus.OAuth2(web_config.google_client_id, 
                                                 web_config.google_client_secret, 
                                                 web_config.google_redirect_uri);

        app.use('/',           await this.createMainRouter());
        app.use('/admin',      await this.createAdminRouter(oAuth2Client));
        app.use('/thumbnails', await this.createThumbnailRouter());
        app.use('/guild',      await this.createGuildRouter());

        return new Promise((resolve, reject) => {
            try {
                app.listen(web_config.port, () => {
                    this.log_.info(`Webserver listening on {port:${web_config.port}}`);
                    this.log_.profile('(1.0) Start Web Server');
                    try {
                        fs.accessSync(web_config.google_token_loc);
                        this.log_.debug(`Found Google Drive token data at {location:${web_config.google_token_loc}}`);
                        resolve();
                    }
                    catch {
                        this.log_.info(`Google Drive token data not found at "${web_config.google_token_loc}", head to "${web_config.google_redirect_uri}", to authenticate Google Drive API!`);

                        // Keep checking for file until found
                        const recheck = async () => {
                            try {
                                await fs.promises.access(web_config.google_token_loc);
                                this.log_.info(`Found Google Drive token data at {location:${web_config.google_token_loc}}`);
                                resolve();
                            }
                            catch (error) {
                                this.log_.error(`{error:${error.message}} failed to read Google Drive token data at {location:${web_config.google_token_loc}}`, error);
                                setTimeout(() => { recheck(); }, 5_000);
                            }
                        };
                        recheck();
                    }
                });
            }
            catch (error) {
                this.log_.error(`{error:${error.message}} while starting webserver`, error);
                this.log_.profile('(1.0) Start Web Server');
                reject();
            }
        });
    }
}