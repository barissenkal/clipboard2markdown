// @ts-check

(function () {
  'use strict';

  // http://pandoc.org/README.html#pandocs-markdown
  var pandoc = [
    
    // https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=headings
    ...["h1", "h2", "h3", "h4", "h5", "h5"].map((headerCode) => {
      return {
        filter: headerCode,
        replacement: function (content, node) {
          return '\n\n' + headerCode + '. ' + content + '\n\n';
        }
      }
    }),
    
    // https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=texteffects
    {
      filter: ['em', 'b'],
      replacement: function (content) {
        return '*' + content + '*';
      }
    },
    {
      filter: 'i',
      replacement: function (content) {
        return '_' + content + '_';
      }
    },
    {
      filter: 'cite',
      replacement: function (content) {
        return '??' + content + '??';
      }
    },
    {
      filter: 'del',
      replacement: function (content) {
        return '-' + content + '-';
      }
    },
    {
      filter: 'u',
      replacement: function (content) {
        return '+' + content + '+';
      }
    },
    {
      filter: 'sup',
      replacement: function (content) {
        return '^' + content + '^';
      }
    },
    {
      filter: 'sub',
      replacement: function (content) {
        return '~' + content + '~';
      }
    },
    // {
    //   filter: 'tt', // Depreciated in html
    //   replacement: function (content) {
    //     return '{{' + content + '}}';
    //   }
    // },
    {
      filter: 'blockquote',
      replacement: function (content) {
        return '{quote}\n' + content + '\n{quote}';
      }
    },
    {
      filter: 'var', // Bonus. Not used by google docs.
      replacement: function (content) {
        return '`' + content + '`';
      }
    },

    // https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=breaks
    {
      filter: 'br',
      replacement: function () {
        return '\n\n'; // TODO(baris): Double check this (was "\\\n")
      }
    },
    {
      filter: 'hr',
      replacement: function () {
        return '\n\n----\n\n';
      }
    },

    // https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=advanced
    {
      filter: function (node) {
        var hasSiblings = node.previousSibling || node.nextSibling;
        var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
        var isCodeElem = node.nodeName === 'CODE' ||
            node.nodeName === 'KBD' ||
            node.nodeName === 'SAMP' ||
            node.nodeName === 'TT';

        return isCodeElem && !isCodeBlock;
      },
      replacement: function (content) {
        return '`' + content + '`';
      }
    },

    // https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=links
    {
      filter: function (node) {
        return node.nodeName === 'A' && node.getAttribute('href');
      },
      replacement: function (content, node) {
        var url = node.getAttribute('href');
        // var titlePart = node.title ? ' "' + node.title + '"' : ''; // TODO(baris): Double check this.
        if (content === url) {
          return '[' + url + ']';
        } else if (url === ('mailto:' + content)) {
          return '[' + url + ']';
        } else {
          return '[' + content + '|' + url + ']';
        }
      }
    },

    // https://jira.atlassian.com/secure/WikiRendererHelpAction.jspa?section=lists
    {
      filter: 'li',
      replacement: function (content, node) {
        content = content.replace(/^\s+/, '').replace(/\n/gm, '\n    ');
        
        var prefix = '';
        
        var parent = node.parentNode;
        var isParentOL = /ol/i.test(parent.nodeName);
        var isParentUL = /ul/i.test(parent.nodeName);
        
        while (isParentOL || isParentUL) {
          if (isParentOL) {
            prefix = "#" + prefix;
          } else {
            prefix = "*" + prefix;
          }
          
          if (/li/i.test(parent.parentNode)) {
            parent = parent.parentNode;
            isParentOL = /ol/i.test(parent.nodeName);
            isParentUL = /ul/i.test(parent.nodeName);
          } else {
            break;
          }
        }

        return prefix + ' ' + content;
      }
    }
  ];

  // http://pandoc.org/README.html#smart-punctuation
  var escape = function (str) {
    return str.replace(/[\u2018\u2019\u00b4]/g, "'")
              .replace(/[\u201c\u201d\u2033]/g, '"')
              .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
              .replace(/[\u2013\u2015]/g, '--')
              .replace(/\u2014/g, '---')
              .replace(/\u2026/g, '...')
              .replace(/[ ]+\n/g, '\n')
              .replace(/\s*\\\n/g, '\\\n')
              .replace(/\s*\\\n\s*\\\n/g, '\n\n')
              .replace(/\s*\\\n\n/g, '\n\n')
              .replace(/\n-\n/g, '\n')
              .replace(/\n\n\s*\\\n/g, '\n\n')
              .replace(/\n\n\n*/g, '\n\n')
              .replace(/[ ]+$/gm, '')
              .replace(/^\s+|[\s\\]+$/g, '')
              .replace(/\n/g, '\\n')
              .replace(/"/g, '\\"');
  };

  var convert = function (str) {
    console.log("convert str", str);
    return escape(toMarkdown(str, { converters: pandoc, gfm: true }));
  }

  var insert = function (myField, myValue) {
      if (document.selection) {
          myField.focus();
          sel = document.selection.createRange();
          sel.text = myValue;
          sel.select()
      } else {
          if (myField.selectionStart || myField.selectionStart == "0") {
              var startPos = myField.selectionStart;
              var endPos = myField.selectionEnd;
              var beforeValue = myField.value.substring(0, startPos);
              var afterValue = myField.value.substring(endPos, myField.value.length);
              myField.value = beforeValue + myValue + afterValue;
              myField.selectionStart = startPos + myValue.length;
              myField.selectionEnd = startPos + myValue.length;
              myField.focus()
          } else {
              myField.value += myValue;
              myField.focus()
          }
      }
  };

  // http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
  document.addEventListener('DOMContentLoaded', function () {
    var info = document.querySelector('#info');
    var pastebin = document.querySelector('#pastebin');
    var output = document.querySelector('#output');
    var wrapper = document.querySelector('#wrapper');

    document.addEventListener('keydown', function (event) {
      if (event.ctrlKey || event.metaKey) {
        if (String.fromCharCode(event.which).toLowerCase() === 'v') {
          pastebin.innerHTML = '';
          pastebin.focus();
          info.classList.add('hidden');
          wrapper.classList.add('hidden');
        }
      }
    });

    pastebin.addEventListener('paste', function () {
      setTimeout(function () {
        var html = pastebin.innerHTML;
        var markdown = convert(html);
        // output.value = markdown;
        insert(output, markdown);
        wrapper.classList.remove('hidden');
        output.focus();
        output.select();
      }, 200);
    });
  });
})();
