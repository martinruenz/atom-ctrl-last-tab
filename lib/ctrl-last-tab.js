'use strict';

const CompositeDisposable = require('atom').CompositeDisposable;

class MruStack {
  constructor(arr) {
    this._stack = arr;
  }
  removeItem(item) {
    this._stack.splice(this._indexOf(item), 1);
  }
  addItem(item) {
    this._stack.unshift(item);
  }
  moveItemToFront(item) {
    this.removeItem(item);
    this.addItem(item);
  }
  nextItem(item) {
    let i = this._indexOf(item);
    return this._stack[(i + 1) % this._stack.length];
  }
  previousItem(item) {
    let i = this._indexOf(item);
    let length = this._stack.length;
    return this._stack[(i - 1 + length) % length];
  }
  _indexOf(item) {
    let index = this._stack.indexOf(item);
    console.assert(index !== -1);
    return index;
  }
}

function createStack() {
    let stack = atom.workspace.getPaneItems();
    if (stack.length === 0) return [];
    let activeItem = atom.workspace.getActivePaneItem();
    let index = stack.indexOf(activeItem);
    console.assert(index !== -1);
    return stack.slice(index).concat(stack.slice(0, index));
}

function createMruStack() {
  let stack = createStack();
  return new MruStack(stack);
}

module.exports = {
  subscriptions: null,
  releaseListener: null,
  stack: null,

  activate(state) {
    let self = this;
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'ctrl-last-tab:next'() {
        self.next();
      },
      'ctrl-last-tab:previous'() {
        self.previous();
      },
    }));

    this.stack = createMruStack();

    this.subscriptions.add(atom.workspace.onDidAddPaneItem(function(e) {
      self.stack.addItem(item);
    }));
    this.subscriptions.add(atom.workspace.onDidDestroyPaneItem(function(e) {
      self.stack.removeItem(e.item);
    }));

    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(function(item) {
      if (!self.releaseListener) {
        self.stack.moveItemToFront(item);
      }
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  _setupCtrlUp() {
    if (!this.releaseListener) {
      let self = this;
      let f = function(e) {
        if (e.keyCode === 17) {
          atom.views.getView(atom.workspace).removeEventListener('keyup', f, true);
          self.releaseListener = null;
          self.stack.moveItemToFront(atom.workspace.getActivePaneItem());
        }
      };
      atom.views.getView(atom.workspace).addEventListener('keyup', f, true);
      this.releaseListener = f;
    }
  },

  next() {
    this._setupCtrlUp();
    let item = atom.workspace.getActivePaneItem();
    let next = this.stack.nextItem(item);
    let pane = atom.workspace.getActivePane();
    pane.activateItem(next);
  },

  previous() {
    this._setupCtrlUp();
    let item = atom.workspace.getActivePaneItem();
    let previous = this.stack.previousItem(item);
    let pane = atom.workspace.getActivePane();
    pane.activateItem(previous);
  }
}
