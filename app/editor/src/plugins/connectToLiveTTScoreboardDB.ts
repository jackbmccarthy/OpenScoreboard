import db from '../../database';

export const connectToLiveTTScoreboardDB = (editor: grapesjs.default.Editor) => {
    editor.Storage.add('remote', {
        async load(options) {
            let data = await db.ref(`scoreboards/${options.key}/config`).get();
            return data.val();
        },

        async store(data, options) {
            //console.log("AutoSave", editor.StorageManager);
            //console.log(JSON.stringify(data));
            //console.log("storing data", `scoreboards/${options.key}/config`);
            console.log(editor.getHtml());
            console.log(editor.getCss());

            await db.ref(`scoreboards/${options.key}/web/html`).set(editor.getHtml());
            await db.ref(`scoreboards/${options.key}/web/css`).set(editor.getCss());
            await db.ref(`scoreboards/${options.key}/web/javascript`).set(editor.getJs());
            return await db.ref(`scoreboards/${options.key}/config`).set(data);
        }
    });
};
