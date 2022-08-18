function chain(a) {
  const val = a
  .first()
  .second()
  .third()
  .fourth()
  .fifth();

  return val;
}

function littleChain(a) {
  const val = a.first().second();

  return val;
}
