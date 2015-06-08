'use strict';

const CompositeDisposable = require('atom').CompositeDisposable;

class Node {
  constructor(item) {
    this.next = null;
    this.previous = null;
    this.item = item;
  }
}

class MruStack {
  constructor() {
    this._map = new WeakMap();
    this._first = null;
  }

  _getNode(item) {
    let node = this._map.get(item);
    if (!node) {
      node = new Node(item);
      this._map.set(item, node);
    }
    return node;
  }

  removeItem(item) {
    let node = this._map.get(item);
    if (!node) return;
    let previous = node.previous;
    let next = node.next;
    previous.next = next;
    next.previous = previous;
    if (this._first === node) this._first = next;
    this._map.delete(item);
  }

  addItem(item) {
    let node = this._getNode(item);
    let next = this._first;
    if (next) {
      let previous = next.previous;
      node.next = next;
      next.previous = node;
      previous.next = node;
      node.previous = previous;
    } else {
      node.next = node.previous = node;
    }
    this._first = node;
  }

  moveItemToFront(item) {
    this.removeItem(item);
    this.addItem(item);
  }

  nextItem(item) {
    return this._getNode(item).next.item;
  }

  previousItem(item) {
    return this._getNode(item).previous.item;
  }
}

function createMruStack() {
  let stack = new MruStack();
  let items = atom.workspace.getPaneItems();
  let activeItem = atom.workspace.getActivePaneItem();
  let index = items.indexOf(activeItem);
  if (index !== -1) {
    for (let i = index; i < items.length; i++) {
      stack.addItem(items[i]);
    }
    for (let i = 0; i < index; i++) {
      stack.addItem(items[i]);
    }
  }
  return stack;
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
      self.stack.addItem(e.item);
    }));
    this.subscriptions.add(atom.workspace.onDidDestroyPaneItem(function(e) {
      self.stack.removeItem(e.item);
    }));

    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem(function(item) {
      if (!self.releaseListener && item) {
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
          let item = atom.workspace.getActivePaneItem();
          if (item) {
            self.stack.moveItemToFront(item);
          }
        }
      };
      atom.views.getView(atom.workspace).addEventListener('keyup', f, true);
      this.releaseListener = f;
    }
  },

  next() {
    this._setupCtrlUp();
    let item = atom.workspace.getActivePaneItem();
    if (!item) return;
    let pane = atom.workspace.getActivePane();
    let next = this.stack.nextItem(item);
    pane.activateItem(next);
  },

  previous() {
    this._setupCtrlUp();
    let item = atom.workspace.getActivePaneItem();
    if (!item) return;
    let previous = this.stack.previousItem(item);
    let pane = atom.workspace.getActivePane();
    pane.activateItem(previous);
  }
}
