{CompositeDisposable} = require 'atom'
MruStack = require './mru.coffee'

createMruStack = ->
  stack = new MruStack
  items = atom.workspace.getPaneItems()
  activeItem = atom.workspace.getActivePaneItem()
  index = items.indexOf activeItem
  if (index != -1)
    for i in [index...items.length]
      stack.addItem items[i]
    for i in [0...index]
      stack.addItem items[i]
  stack

module.exports =
  subscriptions: null
  releaseListener: null
  stack: null

  activate: (state) ->
    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.commands.add 'atom-workspace',
      'ctrl-last-tab:next': =>
        @next()
      'ctrl-last-tab:previous': =>
        @previous()

    @stack = createMruStack()

    @subscriptions.add atom.workspace.onDidAddPaneItem (e) =>
      @stack.addItem e.item

    @subscriptions.add atom.workspace.onDidDestroyPaneItem (e) =>
      @stack.removeItem e.item

    areModifiersDown = false

    @subscriptions.add atom.workspace.onDidChangeActivePaneItem (item) =>
      @stack.moveItemToFront item if !@releaseListener && item && !areModifiersDown

    onDown = (e) =>
      if e.metaKey && e.shiftKey && !areModifiersDown
        areModifiersDown = true

    onUp = (e) =>
      if !e.metaKey && !e.shiftKey && areModifiersDown
        areModifiersDown = false
        item = atom.workspace.getActivePaneItem()
        @stack.moveItemToFront item if item?

    atom.views.getView(atom.workspace).addEventListener 'keydown', onDown, true
    atom.views.getView(atom.workspace).addEventListener 'keyup', onUp, true


  deactivate: ->
    @subscriptions.dispose()

  addCtrlUpListener: ->
    if !@releaseListener
      f = (e) =>
        if e.keyCode == 17  # Ctrl
          atom.views.getView(atom.workspace).removeEventListener 'keyup', f, true
          @releaseListener = null
          item = atom.workspace.getActivePaneItem()
          @stack.moveItemToFront item if item
      atom.views.getView(atom.workspace).addEventListener 'keyup', f, true
      @releaseListener = f

  next: ->
    @addCtrlUpListener()
    item = atom.workspace.getActivePaneItem()
    return unless item
    pane = atom.workspace.getActivePane()
    next = @stack.nextItem item
    pane.activateItem next

  previous: ->
    @addCtrlUpListener()
    item = atom.workspace.getActivePaneItem()
    return unless item
    previous = @stack.previousItem item
    pane = atom.workspace.getActivePane()
    pane.activateItem previous
