class Compiler {
  constructor(opts) {
    this.options = opts || {};
  }

  emit(str) {
    return str;
  }

  visit(node) {
    return this[node.type](node);
  }

  mapVisit(nodes, delim) {
    let buf = '';
    delim = delim || '';

    for (let i = 0, length = nodes.length; i < length; i++) {
      buf += this.visit(nodes[i]);
      if (delim && i < length - 1) buf += this.emit(delim);
    }

    return buf;
  }
}

export default Compiler;
