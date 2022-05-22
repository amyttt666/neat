/*!
jQuery neatlet.
Licensed under the MIT License.
 */
(function(jQuery) {
  var $, Collapser, JSONFormatter, neatlet;
  JSONFormatter = (function() {
    function JSONFormatter(options) {
      if (options == null) {
        options = {};
      }
      this.options = options;
    }

    JSONFormatter.prototype.htmlEncode = function(html) {
      if (html !== null) {
        return html.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      } else {
        return '';
      }
    };

    JSONFormatter.prototype.jsString = function(s) {
      s = JSON.stringify(s).slice(1, -1);
      return this.htmlEncode(s);
    };

    JSONFormatter.prototype.decorateWithSpan = function(value, className) {
      return "<span class=\"" + className + "\">" + (this.htmlEncode(value)) + "</span>";
    };

    JSONFormatter.prototype.valueToHTML = function(value, level) {
      var valueType;
      if (level == null) {
        level = 0;
      }
      valueType = Object.prototype.toString.call(value).match(/\s(.+)]/)[1].toLowerCase();
      return this["" + valueType + "ToHTML"].call(this, value, level);
    };

    JSONFormatter.prototype.nullToHTML = function(value) {
      return this.decorateWithSpan('null', 'null');
    };

    JSONFormatter.prototype.numberToHTML = function(value) {
      return this.decorateWithSpan(value, 'num');
    };

    JSONFormatter.prototype.stringToHTML = function(value) {
      var multilineClass, newLinePattern;
      if (/^(http|https|file):\/\/[^\s]+$/i.test(value)) {
        return "\"<a target=\"blank\" href=\"" + (this.htmlEncode(value)) + "\">" + (this.jsString(value)) + "</a>\"";
      } else {
        multilineClass = '';
        value = this.jsString(value);
        if (this.options.nl2br) {
          newLinePattern = /([^>\\r\\n]?)(\\r\\n|\\n\\r|\\r|\\n)/g;
          if (newLinePattern.test(value)) {
            multilineClass = ' multiline';
            value = (value + '').replace(newLinePattern, '$1' + '<br />');
          }
        }
        return "<span class=\"string" + multilineClass + "\">\"" + value + "\"</span>";
      }
    };

    JSONFormatter.prototype.booleanToHTML = function(value) {
      return this.decorateWithSpan(value, 'bool');
    };

    JSONFormatter.prototype.arrayToHTML = function(array, level) {
      var colla, hasContents, index, numProps, output, value, _i, _len;
      if (level == null) {
        level = 0;
      }
      hasContents = false;
      output = '';
      numProps = array.length;
      for (index = _i = 0, _len = array.length; _i < _len; index = ++_i) {
        value = array[index];
        hasContents = true;
        output += '<li>' + this.valueToHTML(value, level + 1);
        if (numProps > 1) {
          output += ',';
        }
        output += '</li>';
        numProps--;
      }
      if (hasContents) {
        colla = level === 0 ? '' : ' colla';
        return "[<ul class=\"array level" + level + colla + "\">" + output + "</ul>]";
      } else {
        return '[ ]';
      }
    };

    JSONFormatter.prototype.objectToHTML = function(object, level) {
      var colla, hasContents, key, numProps, output, prop, value;
      if (level == null) {
        level = 0;
      }
      hasContents = false;
      output = '';
      numProps = 0;
      for (prop in object) {
        numProps++;
      }
      for (prop in object) {
        value = object[prop];
        hasContents = true;
        key = this.options.escape ? this.jsString(prop) : prop;
        output += "<li><span class=\"prop\"><span class=\"q\">\"</span>" + key + "<span class=\"q\">\"</span></span>: " + (this.valueToHTML(value, level + 1));
        if (numProps > 1) {
          output += ',';
        }
        output += '</li>';
        numProps--;
      }
      if (hasContents) {
        colla = level === 0 ? '' : ' colla';
        return "{<ul class=\"obj level" + level + colla + "\">" + output + "</ul>}";
      } else {
        return '{ }';
      }
    };

    JSONFormatter.prototype.jsonToHTML = function(json) {
      return "<div class=\"pv\">" + (this.valueToHTML(json)) + "</div>";
    };

    return JSONFormatter;

  })();
  (typeof module !== "undefined" && module !== null) && (module.exports = JSONFormatter);
  Collapser = (function() {
    function Collapser() {}

    Collapser.bindEvent = function(item, options) {
      var collp;
      collp = document.createElement('div');
      collp.className = 'collp';
      collp.innerHTML = options.collap ? '＋' : '－';
      collp.addEventListener('click', (function(_this) {
        return function(event) {
          return _this.toggle(event.target, options);
        };
      })(this));
      item.insertBefore(collp, item.firstChild);
      if (options.collap) {
        return this.collapse(collp);
      }
    };

    Collapser.expand = function(collp) {
      var ellipsis, target;
      target = this.collapseTarget(collp);
      if (target.style.display === '') {
        return;
      }
      ellipsis = target.parentNode.getElementsByClassName('ellipsis')[0];
      target.parentNode.removeChild(ellipsis);
      target.style.display = '';
      return collp.innerHTML = '－';
    };

    Collapser.collapse = function(collp) {
      var ellipsis, target;
      target = this.collapseTarget(collp);
      if (target.style.display === 'none') {
        return;
      }
      target.style.display = 'none';
      ellipsis = document.createElement('span');
      ellipsis.className = 'ellipsis';
      ellipsis.innerHTML = ' &hellip; ';
      target.parentNode.insertBefore(ellipsis, target);
      return collp.innerHTML = '＋';
    };

    Collapser.toggle = function(collp, options) {
      var action, collps, target, _i, _len, _results;
      if (options == null) {
        options = {};
      }
      target = this.collapseTarget(collp);
      action = target.style.display === 'none' ? 'expand' : 'collapse';
      if (options.recursive_collp) {
        collps = collp.parentNode.getElementsByClassName('collp');
        _results = [];
        for (_i = 0, _len = collps.length; _i < _len; _i++) {
          collp = collps[_i];
          _results.push(this[action](collp));
        }
        return _results;
      } else {
        return this[action](collp);
      }
    };

    Collapser.collapseTarget = function(collp) {
      var target, targets;
      targets = collp.parentNode.getElementsByClassName('colla');
      if (!targets.length) {
        return;
      }
      return target = targets[0];
    };

    return Collapser;

  })();
  $ = jQuery;
  neatlet = {
    collapse: function(el) {
      if (el.innerHTML === '－') {
        return Collapser.collapse(el);
      }
    },
    expand: function(el) {
      if (el.innerHTML === '＋') {
        return Collapser.expand(el);
      }
    },
    toggle: function(el) {
      return Collapser.toggle(el);
    }
  };
  return $.fn.neatlet = function() {
    var args, defaultOptions, formatter, json, method, options, outputDoc;
    args = arguments;
    if (neatlet[args[0]] != null) {
      method = args[0];
      return this.each(function() {
        var $this, level;
        $this = $(this);
        if (args[1] != null) {
          level = args[1];
          return $this.find(".pv .colla.level" + level).siblings('.collp').each(function() {
            return neatlet[method](this);
          });
        } else {
          return $this.find('.pv > ul > li .colla').siblings('.collp').each(function() {
            return neatlet[method](this);
          });
        }
      });
    } else {
      json = args[0];
      options = args[1] || {};
      defaultOptions = {
        collap: false,
        nl2br: false,
        recursive_collp: false,
        escape: true
      };
      options = $.extend(defaultOptions, options);
      formatter = new JSONFormatter({
        nl2br: options.nl2br,
        escape: options.escape
      });
      if (Object.prototype.toString.call(json) === '[object String]') {console.info(json)
        json = JSON.parse(json);
      }
      outputDoc = formatter.jsonToHTML(json);
      return this.each(function() {
        var $this, item, items, _i, _len, _results;
        $this = $(this);
        $this.html(outputDoc);
        items = $this[0].getElementsByClassName('colla');
        _results = [];
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          if (item.parentNode.nodeName === 'LI') {
            _results.push(Collapser.bindEvent(item.parentNode, options));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    }
  };
})(jQuery);
