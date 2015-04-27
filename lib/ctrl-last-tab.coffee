{CompositeDisposable} = require 'atom'

module.exports = CtrlLastTab =

  subscriptions: null
  index: 1

  activate: (state) ->

    @subscriptions = new CompositeDisposable
    @subscriptions.add atom.commands.add 'atom-workspace', 'ctrl-last-tab:previous': => @previous()
    #@subscriptions.add atom.commands.add 'atom-workspace', 'ctrl-last-tab:next': => @next()

    @disposables = new CompositeDisposable
    @disposables.add atom.keymaps.onDidFailToMatchBinding ({keystrokes, keyboardEventTarget}) =>
      @ctrlReleased(keystrokes, null, keyboardEventTarget)

  deactivate: ->
    @subscriptions.dispose()

  ctrlReleased: (keystrokes, binding, keyboardEventTarget) ->
    console.log "c"
    @index = 1

  previous: ->
    console.log @index
    tabs = atom.workspace.getPaneItems()
    pane = atom.workspace.getActivePane()
    tabs = tabs.filter (tab) -> tab.id?
    tabs.sort (a,b) ->
      return if a.lastOpened < b.lastOpened then 1 else -1
    pane.activateItem(tabs[@index])
    @index = (@index+1) % tabs.length
