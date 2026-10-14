const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ticketzDesktop", {
  name: "CRM - CNRO",
  version: "1.0.0"
});
