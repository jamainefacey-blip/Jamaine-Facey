'use strict';
// Preload — minimal surface, context isolation enabled
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('psOS', {
  version: '1.0.0',
});
