// Phone folder access for the Android app (Acode style).
// In a normal browser FolderAccess.available is false and nothing happens.
(function () {
  var cap = window.Capacitor;
  var native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  var P = native ? cap.registerPlugin('FolderAccess') : null;

  var BINARY = /\.(png|jpe?g|gif|webp|ico|bmp|svg2|mp3|wav|ogg|m4a|mp4|webm|woff2?|ttf|otf|zip|pdf)$/i;
  var MAX_BYTES = 8 * 1024 * 1024;

  function isBinary(name) { return BINARY.test(name); }

  // Pick a folder once and read every file in it.
  // Returns { name, treeUri, files: [{ path, name, uri, parentId, binary, text|base64 }] }
  async function importFolder() {
    if (!P) throw new Error('Phone folder access works in the Android app only');
    var picked = await P.pickFolder();
    try { localStorage.setItem('mb_folder_uri', picked.uri); } catch (e) {}
    return loadFolder(picked.uri, picked.name);
  }

  async function loadFolder(treeUri, name) {
    var list = await P.listFiles({ uri: treeUri });
    var out = [];
    for (var i = 0; i < list.files.length; i++) {
      var f = list.files[i];
      if (f.size > MAX_BYTES) continue;
      var bin = isBinary(f.name);
      try {
        var r = await P.readFile({ uri: f.uri, base64: bin });
        var item = { path: f.path, name: f.name, uri: f.uri, parentId: f.parentId, binary: bin };
        if (bin) item.base64 = r.data; else item.text = r.data;
        out.push(item);
      } catch (e) { /* skip unreadable files */ }
    }
    return { name: name || 'Folder', treeUri: treeUri, files: out };
  }

  // Save changes back to the real file on the phone.
  async function saveFile(file, content) {
    if (!P) throw new Error('Phone folder access works in the Android app only');
    if (file.binary) return P.writeFile({ uri: file.uri, data: content, base64: true });
    return P.writeFile({ uri: file.uri, data: content });
  }

  // Create a new file inside the folder, then write it.
  async function saveNewFile(treeUri, parentId, name, content) {
    var r = await P.createFile({ treeUri: treeUri, parentId: parentId, name: name });
    await P.writeFile({ uri: r.uri, data: content });
    return r.uri;
  }

  function lastFolderUri() {
    try { return localStorage.getItem('mb_folder_uri'); } catch (e) { return null; }
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(blob);
    });
  }

  // Save a file on the phone. The save dialog is opened first with NO file data attached
  // (Android keeps the data of a call that opens a dialog, and a big file made it fail).
  // Then the file is written in small pieces.
  var CHUNK = 3 * 128 * 1024; // bytes per piece
  async function saveBlobNative(name, blob) {
    var r = await P.saveAs({ name: name, mime: blob.type || 'application/octet-stream' });
    await P.writeStart({ uri: r.uri });
    try {
      for (var i = 0; i < blob.size; i += CHUNK) {
        await P.writeChunk({ data: await blobToBase64(blob.slice(i, i + CHUNK)) });
      }
    } finally {
      await P.writeEnd({});
    }
  }

  // Every "download" link (TXT, ZIP, backups...) goes through here.
  var plainClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var a = this;
    var isDl = a.hasAttribute('download') && a.href && a.href.indexOf('blob:') === 0;
    if (!isDl) return plainClick.apply(this, arguments);
    var name = a.getAttribute('download') || 'file';
    fetch(a.href).then(function (r) { return r.blob(); }).then(function (blob) {
      if (P) return saveBlobNative(name, blob);
      var file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: name });
      }
      return plainClick.call(a);
    }).then(function () {
      if (window.showToast) window.showToast('Saved ' + name, 'success');
    }).catch(function (err) {
      var m = String(err && err.message || err);
      if (m !== 'cancelled' && m.indexOf('AbortError') < 0 && window.showToast) window.showToast('Could not save: ' + m, 'error');
    });
  };

  window.FolderAccess = {
    available: native,
    importFolder: importFolder,
    loadFolder: loadFolder,
    saveFile: saveFile,
    saveNewFile: saveNewFile,
    lastFolderUri: lastFolderUri,
    notify: function (title, body) {
      if (!native || !P || !P.showNotification) return Promise.resolve();
      return P.showNotification({ title: title, body: body }).catch(function () {});
    }
  };
})();
