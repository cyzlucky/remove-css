import Base from './compiler';

class Compiler extends Base {
  constructor(options) {
    options = options || {};
    super(options);
    this.indentation = typeof options.indent === 'string' ? options.indent : '  ';
  }

  compile(node) {
    return this.stylesheet(node);
  }

  stylesheet(node) {
    return this.mapVisit(node.stylesheet.rules, '\n\n');
  }

  comment(node) {
    return this.emit(this.indent() + '/*' + node.comment + '*/', node.position);
  }

  import(node) {
    return this.emit('@import ' + node.import + ';', node.position);
  }

  media(node) {
    return this.emit('@media ' + node.media, node.position)
      + this.emit(
        ' {\n'
        + this.indent(1))
      + this.mapVisit(node.rules, '\n\n')
      + this.emit(
        this.indent(-1)
        + '\n}');
  }

  document(node) {
    var doc = '@' + (node.vendor || '') + 'document ' + node.document;
    return this.emit(doc, node.position)
      + this.emit(
        ' '
        + ' {\n'
        + this.indent(1))
      + this.mapVisit(node.rules, '\n\n')
      + this.emit(
        this.indent(-1)
        + '\n}');
  }

  charset(node) {
    return this.emit('@charset ' + node.charset + ';', node.position);
  }

  namespace(node) {
    return this.emit('@namespace ' + node.namespace + ';', node.position);
  }

  supports(node) {
    return this.emit('@supports ' + node.supports, node.position)
      + this.emit(
        ' {\n'
        + this.indent(1))
      + this.mapVisit(node.rules, '\n\n')
      + this.emit(
        this.indent(-1)
        + '\n}');
  }

  keyframes(node) {
    return this.emit('@' + (node.vendor || '') + 'keyframes ' + node.name, node.position)
      + this.emit(
        ' {\n'
        + this.indent(1))
      + this.mapVisit(node.keyframes, '\n')
      + this.emit(
        this.indent(-1)
        + '}');
  }

  keyframe(node) {
    const decls = node.declarations;
    return this.emit(this.indent())
      + this.emit(node.values.join(', '), node.position)
      + this.emit(
        ' {\n'
        + this.indent(1))
      + this.mapVisit(decls, '\n')
      + this.emit(
        this.indent(-1)
        + '\n'
        + this.indent() + '}\n');
  }

  page(node) {
    const sel = node.selectors.length
      ? node.selectors.join(', ') + ' '
      : '';

    return this.emit('@page ' + sel, node.position)
      + this.emit('{\n')
      + this.emit(this.indent(1))
      + this.mapVisit(node.declarations, '\n')
      + this.emit(this.indent(-1))
      + this.emit('\n}');
  }

  ['font-face'](node) {
    return this.emit('@font-face ', node.position)
      + this.emit('{\n')
      + this.emit(this.indent(1))
      + this.mapVisit(node.declarations, '\n')
      + this.emit(this.indent(-1))
      + this.emit('\n}');
  }

  host(node) {
    return this.emit('@host', node.position)
      + this.emit(
        ' {\n'
        + this.indent(1))
      + this.mapVisit(node.rules, '\n\n')
      + this.emit(
        this.indent(-1)
        + '\n}');
  }

  ['custom-media'](node) {
    return this.emit('@custom-media ' + node.name + ' ' + node.media + ';', node.position);
  }

  rule(node) {
    const indent = this.indent();
    const decls = node.declarations;
    if (!decls.length) return '';

    return this.emit(node.selectors.map(function (s) { return indent + s }).join(',\n'), node.position)
      + this.emit(' {\n')
      + this.emit(this.indent(1))
      + this.mapVisit(decls, '\n')
      + this.emit(this.indent(-1))
      + this.emit('\n' + this.indent() + '}');
  }

  declaration(node) {
    return this.emit(this.indent())
      + this.emit(node.property + ': ' + node.value, node.position)
      + this.emit(';');
  }

  indent(level) {
    this.level = this.level || 1;

    if (null != level) {
      this.level += level;
      return '';
    }
    return Array(this.level).join(this.indentation);
  }
}

export default Compiler;
