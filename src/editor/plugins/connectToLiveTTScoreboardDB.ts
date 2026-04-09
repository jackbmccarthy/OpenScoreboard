import type grapesjs from 'grapesjs'
import db from '@/lib/database';

export const connectToLiveTTScoreboardDB = (editor: grapesjs.Editor) => {
    editor.Storage.add('remote', {
        async load(options: { key: string | null }) {
            let data = await db.ref(`scoreboards/${options.key}/config`).get();
            return data.val();
        },

        async store(data: unknown, options: { key: string | null }) {
            //console.log("AutoSave", editor.StorageManager);
            //console.log(JSON.stringify(data));
            //console.log("storing data", `scoreboards/${options.key}/config`);
            await db.ref(`scoreboards/${options.key}/web/html`).set(editor.getHtml());
            await db.ref(`scoreboards/${options.key}/web/css`).set(editor.getCss());
            await db.ref(`scoreboards/${options.key}/web/javascript`).set(editor.getJs());
            return await db.ref(`scoreboards/${options.key}/config`).set(data);
        }
    });
};
