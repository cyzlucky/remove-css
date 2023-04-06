import Base from './compiler';

class Compiler extends Base {
  constructor(options) {
    super(options);
  }

  compile(node) {
    return node.stylesheet
      .rules.map(this.visit, this)
      .join('');
  }

  comment(node) {
    return this.emit('', node.position);
  }

  import(node) {
    return this.emit('@import ' + node.import + ';', node.position);
  }

  media(node) {
    return this.emit('@media ' + node.media, node.position)
      + this.emit('{')
      + this.mapVisit(node.rules)
      + this.emit('}');
  }

  document(node) {
    var doc = '@' + (node.vendor || '') + 'document ' + node.document;

    return this.emit(doc, node.position)
      + this.emit('{')
      + this.mapVisit(node.rules)
      + this.emit('}');
  }

  charset(node) {
    return this.emit('@charset ' + node.charset + ';', node.position);
  }

  namespace(node) {
    return this.emit('@namespace ' + node.namespace + ';', node.position);
  }

  supports(node) {
    return this.emit('@supports ' + node.supports, node.position)
      + this.emit('{')
      + this.mapVisit(node.rules)
      + this.emit('}');
  }

  keyframes(node) {
    return this.emit('@'
      + (node.vendor || '')
      + 'keyframes '
      + node.name, node.position)
      + this.emit('{')
      + this.mapVisit(node.keyframes)
      + this.emit('}');
  }

  keyframe(node) {
    var decls = node.declarations;

    return this.emit(node.values.join(','), node.position)
      + this.emit('{')
      + this.mapVisit(decls)
      + this.emit('}');
  }

  page(node) {
    var sel = node.selectors.length
      ? node.selectors.join(', ')
      : '';

    return this.emit('@page ' + sel, node.position)
      + this.emit('{')
      + this.mapVisit(node.declarations)
      + this.emit('}');
  }

  fontFace(node) {
    return this.emit('@font-face', node.position)
      + this.emit('{')
      + this.mapVisit(node.declarations)
      + this.emit('}');
  }

  host(node) {
    return this.emit('@host', node.position)
      + this.emit('{')
      + this.mapVisit(node.rules)
      + this.emit('}');
  }

  customMedia(node) {
    return this.emit('@custom-media ' + node.name + ' ' + node.media + ';', node.position);
  }

  rule(node) {
    var decls = node.declarations;
    if (!decls.length) return '';

    return this.emit(node.selectors.join(','), node.position)
      + this.emit('{')
      + this.mapVisit(decls)
      + this.emit('}');
  }

  declaration(node) {
    return this.emit(node.property + ':' + node.value, node.position) + this.emit(';');
  }
}

export default Compiler;
