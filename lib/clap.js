'use babel';

import ClapView from './clap-view';
import { CompositeDisposable } from 'atom';
import fs from 'fs';
import mkdirp from 'mkdirp';
import git from 'git-rev';

var project = atom.project;
var folderPath = project.getPaths()[0];

mkdirp(folderPath + '/.clap/', function (err) {
  if (err) throw err;
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

    if (branch == '') {
      throw "Git not initialized";
    }

    files[branch] = [];

    if (editor = atom.workspace.getTextEditors()) {
      editor.forEach(function (element) {
        files[branch].push((project.relativizePath(element.getPath()))[1]);
      })
    }

    console.log(files);

    fs.writeFile(folderPath + '/.clap/' + branch  + '.json', JSON.stringify(files), function (err) {
      if (err)
        throw err;
      console.log('Saved!');
    });
  },

  loader () {
    let repo = atom.project.getRepositories()[0];
    let branch = repo.getShortHead();
    console.log(branch);

    fs.readFile(folderPath + '/.clap/' + branch +'.json', 'utf8', function (err, data) {
      if (err)
        console.log("NOPE");
          // throw "File not found";

      let obj = JSON.parse(data);
      console.log(obj);

      if (!obj.hasOwnProperty(branch)) {
        throw "No files saved for this branch!"
      }

      let editor = atom.workspace;
      for (file in obj[branch]) {
        editor.open(folderPath + '/' + obj[branch][file]);
      }
    });
  }

};
