/* eslint-disable no-bitwise */

'use strict';

const parseError = function (message) {
  throw Error(`Parse error: ${message}`);
};
const regexDecode = /&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+);|&(Aacute|iacute|Uacute|plusmn|otilde|Otilde|Agrave|agrave|yacute|Yacute|oslash|Oslash|Atilde|atilde|brvbar|Ccedil|ccedil|ograve|curren|divide|Eacute|eacute|Ograve|oacute|Egrave|egrave|ugrave|frac12|frac14|frac34|Ugrave|Oacute|Iacute|ntilde|Ntilde|uacute|middot|Igrave|igrave|iquest|aacute|laquo|THORN|micro|iexcl|icirc|Icirc|Acirc|ucirc|ecirc|Ocirc|ocirc|Ecirc|Ucirc|aring|Aring|aelig|AElig|acute|pound|raquo|acirc|times|thorn|szlig|cedil|COPY|Auml|ordf|ordm|uuml|macr|Uuml|auml|Ouml|ouml|para|nbsp|Euml|quot|QUOT|euml|yuml|cent|sect|copy|sup1|sup2|sup3|Iuml|iuml|shy|eth|reg|not|yen|amp|AMP|REG|uml|ETH|deg|gt|GT|LT|lt)([=a-zA-Z0-9])?/g;

const regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
const stringFromCharCode = String.fromCharCode;

const decodeMapNumeric = {
  0: '\uFFFD',
  128: '\u20AC',
  130: '\u201A',
  131: '\u0192',
  132: '\u201E',
  133: '\u2026',
  134: '\u2020',
  135: '\u2021',
  136: '\u02C6',
  137: '\u2030',
  138: '\u0160',
  139: '\u2039',
  140: '\u0152',
  142: '\u017D',
  145: '\u2018',
  146: '\u2019',
  147: '\u201C',
  148: '\u201D',
  149: '\u2022',
  150: '\u2013',
  151: '\u2014',
  152: '\u02DC',
  153: '\u2122',
  154: '\u0161',
  155: '\u203A',
  156: '\u0153',
  158: '\u017E',
  159: '\u0178',
};
const {hasOwnProperty} = Object;
function has(object, propertyName) {
  return hasOwnProperty.call(object, propertyName);
}

const invalidReferenceCodePoints = [1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127, 128, 129, 130, 131, 132, 133, 134, 135,
  136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152,
  153, 154, 155, 156, 157, 158, 159, 64976, 64977, 64978, 64979, 64980, 64981, 64982,
  64983, 64984, 64985, 64986, 64987, 64988, 64989, 64990, 64991, 64992, 64993, 64994,
  64995, 64996, 64997, 64998, 64999, 65000, 65001, 65002, 65003, 65004, 65005, 65006,
  65007, 65534, 65535, 131070, 131071, 196606, 196607, 262142, 262143, 327678, 327679,
  393214, 393215, 458750, 458751, 524286, 524287, 589822, 589823, 655358, 655359, 720894,
  720895, 786430, 786431, 851966, 851967, 917502, 917503, 983038, 983039, 1048574, 1048575, 1114110, 1114111];

function contains(array, value) {
  let index = -1;
  const {length} = array;
  while (++index < length) {
    if (array[index] === value) {
      return true;
    }
  }
  return false;
}

function codePointToSymbol(codePoint, strict) {
  let output = '';
  if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
    // See issue #4:
    // “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
    // greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
    // REPLACEMENT CHARACTER.”
    if (strict) {
      parseError('character reference outside the permissible Unicode range');
    }
    return '\uFFFD';
  }
  if (has(decodeMapNumeric, codePoint)) {
    if (strict) {
      parseError('disallowed character reference');
    }
    return decodeMapNumeric[codePoint];
  }
  if (strict && contains(invalidReferenceCodePoints, codePoint)) {
    parseError('disallowed character reference');
  }
  if (codePoint > 0xFFFF) {
    codePoint -= 0x10000;
    output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
    codePoint = 0xDC00 | codePoint & 0x3FF;
  }
  output += stringFromCharCode(codePoint);
  return output;
}

const defaultOptions = {
  isAttributeValue: false,
  strict: false,
};

function decode(html, options = defaultOptions) {
  const {strict} = options;
  if (strict && regexInvalidEntity.test(html)) {
    parseError('malformed character reference');
  }
  return html.replace(regexDecode, ($0, $1, $2, $3, $4, $5, $6, $7) => {
    let codePoint;
    let semicolon;
    let hexDigits;
    let next;
    if ($1) {
      // Decode decimal escapes, e.g. `&#119558;`.
      codePoint = $1;
      semicolon = $2;
      if (strict && !semicolon) {
        parseError('character reference was not terminated by a semicolon');
      }
      return codePointToSymbol(codePoint, strict);
    }
    if ($3) {
      // Decode hexadecimal escapes, e.g. `&#x1D306;`.
      hexDigits = $3;
      semicolon = $4;
      if (strict && !semicolon) {
        parseError('character reference was not terminated by a semicolon');
      }
      codePoint = parseInt(hexDigits, 16);
      return codePointToSymbol(codePoint, strict);
    }
    if ($5) {
      // Decode named character references with trailing `;`, e.g. `&copy;`.
      // Ambiguous ampersand. https://mths.be/notes/ambiguous-ampersands
      if (strict) {
        parseError(
          'named character reference was not terminated by a semicolon',
        );
      }
      return $0;

    }
    // If we’re still here, it’s a legacy reference for sure. No need for an
    // extra `if` check.
    // Decode named character references without trailing `;`, e.g. `&amp`
    // This is only a parse error if it gets converted to `&`, or if it is
    // followed by `=` in an attribute context.
    reference = $6;
    next = $7;
    if (next && options.isAttributeValue) {
      if (strict && next === '=') {
        parseError('`&` did not start a character reference');
      }
      return $0;
    }
    if (strict) {
      parseError(
        'named character reference was not terminated by a semicolon',
      );
    }
    // Note: there is no need to check `has(decodeMapLegacy, reference)`.
    return (next || '');

  });
}

module.exports = decode;
