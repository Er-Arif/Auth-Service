function stub(t, target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  t.after(() => {
    target[key] = original;
  });
}

module.exports = {
  stub,
};
