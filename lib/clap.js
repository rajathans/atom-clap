'use babel';

import ClapView from './clap-view';
import { CompositeDisposable } from 'atom';

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
      'clap:toggle': () => this.toggle()
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

  toggle() {
  let editor
  if (editor = atom.workspace.getActiveTextEditor()) {
    let selection = editor.getSelectedText()
    let reversed = selection.split('').reverse().join('')
    editor.insertText(reversed)
  }
}


};
