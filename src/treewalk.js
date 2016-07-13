// Generated by CoffeeScript 1.10.0
(function() {
  var helper, model, parser,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  helper = require('./helper.coffee');

  model = require('./model.coffee');

  parser = require('./parser.coffee');

  exports.createTreewalkParser = function(parse, config, root) {
    var TreewalkParser;
    TreewalkParser = (function(superClass) {
      extend(TreewalkParser, superClass);

      function TreewalkParser(text1, opts) {
        this.text = text1;
        this.opts = opts != null ? opts : {};
        TreewalkParser.__super__.constructor.apply(this, arguments);
        this.lines = this.text.split('\n');
      }

      TreewalkParser.prototype.isComment = function(text) {
        if ((config != null ? config.isComment : void 0) != null) {
          return config.isComment(text);
        } else {
          return false;
        }
      };

      TreewalkParser.prototype.parseComment = function(text) {
        return config.parseComment(text);
      };

      TreewalkParser.prototype.markRoot = function(context) {
        var parseTree;
        if (context == null) {
          context = root;
        }
        parseTree = parse(context, this.text);
        return this.mark(parseTree, '', 0);
      };

      TreewalkParser.prototype.guessPrefix = function(bounds) {
        var best, i, j, key, line, max, prefix, ref, ref1, val, votes;
        votes = {};
        for (i = j = ref = bounds.start.line + 1, ref1 = bounds.end.line; ref <= ref1 ? j <= ref1 : j >= ref1; i = ref <= ref1 ? ++j : --j) {
          line = this.lines[i];
          prefix = line.slice(0, line.length - line.trimLeft().length);
          if (votes[prefix] == null) {
            votes[prefix] = 0;
          }
          votes[prefix] += 1;
        }
        max = -Infinity;
        best = '';
        for (key in votes) {
          val = votes[key];
          if (val > max) {
            best = key;
            max = val;
          }
        }
        return best;
      };

      TreewalkParser.prototype.applyRule = function(rule, node) {
        if ('string' === typeof rule) {
          return {
            type: rule
          };
        } else if (rule instanceof Function) {
          return rule(node);
        } else {
          return rule;
        }
      };

      TreewalkParser.prototype.det = function(node) {
        if (node.type in config.RULES) {
          return this.applyRule(config.RULES[node.type], node).type;
        }
        return 'block';
      };

      TreewalkParser.prototype.detNode = function(node) {
        if (node.blockified) {
          return 'block';
        } else {
          return this.det(node);
        }
      };

      TreewalkParser.prototype.getDropType = function(context) {
        return {
          'block': 'mostly-value',
          'indent': 'mostly-block',
          'skip': 'mostly-block'
        }[this.detNode(context)];
      };

      TreewalkParser.prototype.getColor = function(node, rules) {
        var color, colorRule, j, len, ref, rulesSet;
        color = typeof config.COLOR_CALLBACK === "function" ? config.COLOR_CALLBACK(this.opts, node) : void 0;
        if (color != null) {
          return color;
        }
        rulesSet = {};
        rules.forEach(function(el) {
          return rulesSet[el] = true;
        });
        ref = config.COLOR_RULES;
        for (j = 0, len = ref.length; j < len; j++) {
          colorRule = ref[j];
          if (colorRule[0] in rulesSet) {
            return colorRule[1];
          }
        }
        return 'comment';
      };

      TreewalkParser.prototype.getShape = function(node, rules) {
        var j, len, ref, rulesSet, shape, shapeRule;
        shape = typeof config.SHAPE_CALLBACK === "function" ? config.SHAPE_CALLBACK(this.opts, node) : void 0;
        if (shape != null) {
          return shape;
        }
        rulesSet = {};
        rules.forEach(function(el) {
          return rulesSet[el] = true;
        });
        ref = config.SHAPE_RULES;
        for (j = 0, len = ref.length; j < len; j++) {
          shapeRule = ref[j];
          if (shapeRule[0] in rulesSet) {
            return shapeRule[1];
          }
        }
        return 'comment';
      };

      TreewalkParser.prototype.mark = function(node, prefix, depth, pass, rules, context, wrap) {
        var bounds, child, el, end, i, j, k, l, len, len1, len2, n, ok, oldPrefix, origin, ref, ref1, ref2, ref3, ref4, results, start;
        if (!pass) {
          context = node.parent;
          while ((context != null) && ((ref = this.detNode(context)) === 'skip' || ref === 'parens')) {
            context = context.parent;
          }
        }
        if (rules == null) {
          rules = [];
        }
        rules.push(node.type);
        if (node.children.length === 1) {
          return this.mark(node.children[0], prefix, depth, true, rules, context, wrap);
        } else if (node.children.length > 0) {
          switch (this.detNode(node)) {
            case 'block':
              if (wrap != null) {
                bounds = wrap.bounds;
              } else {
                bounds = node.bounds;
              }
              if ((context != null) && this.detNode(context) === 'block') {
                this.addSocket({
                  bounds: bounds,
                  depth: depth,
                  classes: rules,
                  parseContext: (wrap != null ? wrap.type : rules[0])
                });
              }
              this.addBlock({
                bounds: bounds,
                depth: depth + 1,
                color: this.getColor(node, rules),
                classes: rules.concat(context != null ? this.getDropType(context) : this.getShape(node, rules)),
                parseContext: (wrap != null ? wrap.type : rules[0])
              });
              break;
            case 'parens':
              child = null;
              ok = true;
              ref1 = node.children;
              for (i = j = 0, len = ref1.length; j < len; i = ++j) {
                el = ref1[i];
                if (el.children.length > 0) {
                  if (child != null) {
                    ok = false;
                    break;
                  } else {
                    child = el;
                  }
                }
              }
              if (ok) {
                this.mark(child, prefix, depth, true, rules, context, wrap != null ? wrap : node);
                return;
              } else {
                node.blockified = true;
                if (wrap != null) {
                  bounds = wrap.bounds;
                } else {
                  bounds = node.bounds;
                }
                if ((context != null) && this.detNode(context) === 'block') {
                  this.addSocket({
                    bounds: bounds,
                    depth: depth,
                    classes: rules,
                    parseContext: (wrap != null ? wrap.type : rules[0])
                  });
                }
                this.addBlock({
                  bounds: bounds,
                  depth: depth + 1,
                  color: this.getColor(node, rules),
                  classes: rules.concat(context != null ? this.getDropType(context) : this.getShape(node, rules)),
                  parseContext: (wrap != null ? wrap.type : rules[0])
                });
              }
              break;
            case 'indent':
              if (this.det(context) !== 'block') {
                this.addBlock({
                  bounds: node.bounds,
                  depth: depth,
                  color: this.getColor(node, rules),
                  classes: rules.concat(context != null ? this.getDropType(context) : this.getShape(node, rules)),
                  parseContext: (wrap != null ? wrap.type : rules[0])
                });
                depth += 1;
              }
              start = origin = node.children[0].bounds.start;
              ref2 = node.children;
              for (i = k = 0, len1 = ref2.length; k < len1; i = ++k) {
                child = ref2[i];
                if (child.children.length > 0) {
                  break;
                } else if (helper.clipLines(this.lines, origin, child.bounds.end).trim().length !== 0) {
                  start = child.bounds.end;
                }
              }
              end = node.children[node.children.length - 1].bounds.end;
              ref3 = node.children;
              for (i = l = ref3.length - 1; l >= 0; i = l += -1) {
                child = ref3[i];
                console.log(child, i, node.children.length, node.children);
                if (child.children.length > 0) {
                  end = child.bounds.end;
                  break;
                }
              }
              bounds = {
                start: start,
                end: end
              };
              oldPrefix = prefix;
              prefix = this.guessPrefix(bounds);
              this.addIndent({
                bounds: bounds,
                depth: depth,
                prefix: prefix.slice(oldPrefix.length, prefix.length),
                classes: rules,
                parseContext: this.applyRule(config.RULES[node.type], node).indentContext
              });
          }
          ref4 = node.children;
          results = [];
          for (n = 0, len2 = ref4.length; n < len2; n++) {
            child = ref4[n];
            results.push(this.mark(child, prefix, depth + 2, false));
          }
          return results;
        } else if ((context != null) && this.detNode(context) === 'block') {
          if (this.det(node) === 'socket' && config.SHOULD_SOCKET(this.opts, node)) {
            return this.addSocket({
              bounds: node.bounds,
              depth: depth,
              classes: rules,
              parseContext: (wrap != null ? wrap.type : rules[0])
            });
          }
        }
      };

      return TreewalkParser;

    })(parser.Parser);
    TreewalkParser.drop = function(block, context, pred) {
      var c, j, k, len, len1, m, ref, ref1;
      if (context.type === 'socket') {
        if (indexOf.call(context.classes, '__comment__') >= 0) {
          return helper.DISCOURAGE;
        }
        ref = context.classes;
        for (j = 0, len = ref.length; j < len; j++) {
          c = ref[j];
          if (indexOf.call(block.classes, c) >= 0) {
            return helper.ENCOURAGE;
          }
          if ((config.PAREN_RULES != null) && c in config.PAREN_RULES) {
            ref1 = block.classes;
            for (k = 0, len1 = ref1.length; k < len1; k++) {
              m = ref1[k];
              if (m in config.PAREN_RULES[c]) {
                return helper.ENCOURAGE;
              }
            }
          }
        }
        return helper.DISCOURAGE;
      }
    };
    TreewalkParser.parens = function(leading, trailing, node, context) {
      var c, j, k, l, len, len1, len2, m, ref, ref1, ref2;
      if (context == null) {
        if (config.unParenWrap != null) {
          return config.unParenWrap(leading, trailing, node, context);
        } else {
          return;
        }
      }
      ref = context.classes;
      for (j = 0, len = ref.length; j < len; j++) {
        c = ref[j];
        if (indexOf.call(node.classes, c) >= 0) {
          return;
        }
      }
      ref1 = context.classes;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        c = ref1[k];
        if (c in config.PAREN_RULES) {
          ref2 = node.classes;
          for (l = 0, len2 = ref2.length; l < len2; l++) {
            m = ref2[l];
            if (m in config.PAREN_RULES[c]) {
              return config.PAREN_RULES[c][m](leading, trailing, node, context);
            }
          }
        }
      }
    };
    return TreewalkParser;
  };

}).call(this);
