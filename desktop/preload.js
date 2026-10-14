const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ticketzDesktop", {
  name: "Ticketz",
  version: "1.0.0"
});
