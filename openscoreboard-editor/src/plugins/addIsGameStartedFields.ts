export function addIsGameStartedFields(editor:grapesjs.default.Editor){

    const gameNumbers = [1,2,3,4,5,6,7,8,9]

    for (const game of gameNumbers) {
        editor.Components.addType(`isGame${game}Started`, {
        model: {
            defaults: {
                style: {
                   width:"100%",
                   height:"100%",
                   display:"flex"
                   
                },
                dragMode: "absolute",
                resizable: true,
               
                attributes: { class: `isGame${game}Started`,  },
               
            }
        }
    });

    editor.BlockManager.add(`isGame${game}Started`, {
       // media: `<img src="${defaultServiceIconSVG}" />`,
        label: `Game ${game} Score Container`,
        attributes: { class: 'fa fa-text' },
        content: { type: `isGame${game}Started`, dmode: "absolute" },
        category: "Show Game Score Containers",
        // layerable:true,
    });
    }
    

   
}