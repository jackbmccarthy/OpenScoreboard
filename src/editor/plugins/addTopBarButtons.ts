import CryptoJS from  'crypto-js'

export function addTopBarButtons(editor) {
    let panelConfig = {
        appendTo: "#toppanel",
        id: "editing", visible: true, buttons: [
            {
                id: "undo-button", label: "Undo", command: {
                    run: function (editor) {
                        if (editor.UndoManager.hasUndo()) {
                            editor.UndoManager.undo();
                        }
                    }
                },
            },
            {
                id: "redo-button", label: "Redo", command: {
                    run: function (editor) {
                        if (editor.UndoManager.hasRedo()) {
                            editor.UndoManager.redo();
                        }
                    }
                },
            },
            {
                id: "saveButton", label: "Save", command: {
                    run: async function (editor) {
                        await editor.StorageManager.store(editor.getProjectData(), editor.StorageManager.getStorageOptions());
                        alert("Scoreboard Saved!");
                    }
                }
            },
            {
                id: "exportButton", label: "Export", command: {
                    run: async function (editor) {
                        const password = prompt("Please enter a password for the file.")
                        const exportData = {
                            projectData: editor.getProjectData(),
                            html: editor.getHtml(),
                            css: editor.getCss(),
                        }
                        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(exportData), password).toString()
                        const element = document.createElement("a");
                        const file = new Blob([encryptedData], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = "myScoreboard.opensb";

                        document.body.appendChild(element); // Required for this to work in FireFox
                        element.click();
                      
                        await editor.StorageManager.store(editor.getProjectData(), editor.StorageManager.getStorageOptions());
                    }
                }
            },
            {
                id: "importButton", label: "Import", command: {
                    run: async function (editor) {
                        const fileInput = document.createElement('input');
                        fileInput.style="display:none;"
                        fileInput.type = 'file';
                        fileInput.onchange = function(event) {
                          const file = event.target.files[0];
                          const fileReader = new FileReader();
                          fileReader.onload = function() {
                            try {
                                
                            } catch (error) {
                                alert("Unable to upload the file, please check and make you have the correct file and password.")
                            }
                            const fileContents = fileReader.result;
                            const password = prompt("Password for the file:")
                            const decryptedFile = CryptoJS.AES.decrypt(fileContents,password).toString(CryptoJS.enc.Utf8)
                            editor.loadProjectData(JSON.parse(decryptedFile).projectData)
                            
                          }
                          fileReader.readAsText(file);

                        }
                        document.body.appendChild(fileInput);
                        fileInput.click()
                    }
                }
            },
        ]
    }
    if(process.env.NODE_ENV !=="production"){
        panelConfig.buttons.push(
            {
                id: "getTemplate", label: "GetTemplate", command: {
                    run: async function (editor) {
                       // const password = prompt("Please enter a password for the file.")
                        const exportData = {
                            projectData: editor.getProjectData(),
                            html: editor.getHtml(),
                            css: editor.getCss(),
                        }
                       // console.log(exportData)
                        //const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(exportData), password).toString()

                        const element = document.createElement("a");

                        let components = editor.getComponents();
      let style = editor.getStyle()
      let templateData = {
         components: components,
         style: style
      };

                      //  const file = new Blob([JSON.stringify(exportData.projectData["pages"][0]["frames"][0]["component"]["components"][0])], { type: 'application/json' });
                        const file = new Blob([JSON.stringify(templateData)], { type: 'application/json' });

                        element.href = URL.createObjectURL(file);
                        element.download = "myTemplate.json";

                        document.body.appendChild(element); // Required for this to work in FireFox
                        element.click();
                      
                        await editor.StorageManager.store(editor.getProjectData(), editor.StorageManager.getStorageOptions());
                    }
                }
            },
        )
    }
    editor.Panels.addPanel(
        panelConfig
    );
}
