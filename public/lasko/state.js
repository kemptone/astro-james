const S = (function( _state, _on, f ) {

  const obj = {
    set (path, value) {
      _state[ path ] = value
      const arr = _on[ path ] || (_on[ path ] = [])
      // self cleaning on set
      _on[ path ] = arr.filter( item => item.callback )
      _on[ path ].forEach(
        event => (event.callback || f)(value, _state) 
      )
    }
    , assign (obj) {
      Object.assign(_state, obj)
    }
    , on (path, callback) {
      const event = { callback }
      const arr = _on[ path ] || (_on[ path ] = [])
      arr.push(event)
      return () => delete event.callback
    }
    , get (callback)  {
      callback(_state)
    }
    , clearAll () {
      for (let x in _on)
        _on[x].length = 0
    }
  }

  return obj

}(
  {}
  , {}
  , new Function()
))

export default S