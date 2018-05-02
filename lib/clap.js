'use babel';

import ClapView from './clap-view';
import { CompositeDisposable } from 'atom';
import fs from 'fs';
import mkdirp from 'mkdirp';

var project = atom.project;
var folderPath = project.getPaths()[0];

mkdirp(folderPath + '/.clap/', function (err) {
  if (err)
    throw err;
});

export default {

  clapView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.clapView = new ClapView(state.clapViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.clapView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'clap:save': () => this.save(),
      'clap:load': () => this.loader()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.clapView.destroy();
  },

  serialize() {
    return {
      clapViewState: this.clapView.serialize()
    };
  },

  save() {
    let editor, repo, files = {};
    repo = atom.project.getRepositories()[0];
    branch = repo.getShortHead();

    if (branch == '')
      atom.notifications.addError("Not a Git repository",
      {
          detail: "This project works on git repos only!"
      });

    files[branch] = [];

    if (editor = atom.workspace.getTextEditors()) {
      editor.forEach(function (element) {
        files[branch].push((project.relativizePath(element.getPath()))[1]);
      })
    }

    fs.writeFile(folderPath + '/.clap/' + branch  + '.json', JSON.stringify(files), function (err) {
      if (err)
        throw err;
      atom.notifications.addSuccess("Saved " + files[branch].length + " files");
    });
  },

  loader () {
    let repo = atom.project.getRepositories()[0];
    let branch = repo.getShortHead();

    fs.readFile(folderPath + '/.clap/' + branch +'.json', 'utf8', function (err, data) {
      if (err) {
        atom.notifications.addWarning(
          "No files saved for this branch",
          {
              detail: "You need to save some files before you can load them for this branch. Use ctrl+alt+s to save your files. You can also use the command palette and search Clap:save."
          }
        );
      } else {

      }

      data = data.trim();
      let obj = JSON.parse(data);

      if (!obj.hasOwnProperty(branch)) {
        atom.notifications.addWarning(
          "No files saved for this branch",
          {
              detail: "You need to save some files before you can load them for this branch. Use ctrl+alt+s to save your files. You can also use the command palette and search Clap:save."
          }
        );
      } else {
        let editor = atom.workspace;
        for (file in obj[branch]) {
          editor.open(folderPath + '/' + obj[branch][file]);
        }
        atom.notifications.addSuccess("Opened " + obj[branch].length + " files");
      }
    });
  }

};
