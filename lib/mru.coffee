class Node
  constructor: (item) ->
    @next = null
    @previous = null
    @item = item

# This is a double linked list that loops around. The list has a reference to
# the first item. Adding a new item always adds it to the frong and the new item
# becomes the new |_first| item.
class MruStack
  constructor: ->
    @_map = new WeakMap
    @_first = null

  _getNode: (item) ->
    node = @_map.get item
    unless node
      node = new Node item
      @_map.set item, node
    node

  removeItem: (item) ->
    node = @_map.get item
    return unless node
    previous = node.previous
    next = node.next
    previous.next = next
    next.previous = previous
    @_first = next if @_first == node
    @_map.delete item

  addItem: (item) ->
    node = @_getNode item
    next = @_first
    if next
      previous = next.previous
      node.next = next
      next.previous = node
      previous.next = node
      node.previous = previous
    else
      node.next = node.previous = node
    @_first = node

  moveItemToFront: (item) ->
    @removeItem item
    @addItem item

  nextItem: (item) ->
    @_getNode(item).next.item

  previousItem: (item) ->
    @_getNode(item).previous.item

module.exports = MruStack
