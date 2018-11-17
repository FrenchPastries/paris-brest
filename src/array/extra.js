if (!Array.prototype.mapFirst) {
  Array.prototype.mapFirst = function(mapper) {
    return [ mapper(this[0]), this[1] ]
  }
}

if (!Array.prototype.mapSecond) {
  Array.prototype.mapSecond = function(mapper) {
    return [ this[0], mapper(this[1]) ]
  }
}

if (!Array.prototype.mapTuple) {
  Array.prototype.mapTuple = function(mapperFirst, mapperSecond) {
    return [ mapperFirst(this[0]), mapperSecond(this[1]) ]
  }  
}
