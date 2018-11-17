Array.prototype.mapFirst = function(mapper) {
  return [ mapper(this[0]), this[1] ]
}

Array.prototype.mapSecond = function(mapper) {
  return [ this[0], mapper(this[1]) ]
}

Array.prototype.mapTuple = function(mapperFirst, mapperSecond) {
  return [ mapperFirst(this[0]), mapperSecond(this[1]) ]
}
