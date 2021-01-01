/** @license URI.js v4.4.0 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.URI = {}));
}(this, (function (exports) { 'use strict';

    function merge(...sets) {
      if (sets.length > 1) {
        sets[0] = sets[0].slice(0, -1);
        const xl = sets.length - 1;

        for (let x = 1; x < xl; ++x) {
          sets[x] = sets[x].slice(1, -1);
        }

        sets[xl] = sets[xl].slice(1);
        return sets.join('');
      } else {
        return sets[0];
      }
    }
    function subexp(str) {
      return "(?:" + str + ")";
    }
    function typeOf(o) {
      return o === undefined ? "undefined" : o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase();
    }
    function toUpperCase(str) {
      return str.toUpperCase();
    }
    function toArray(obj) {
      return obj !== undefined && obj !== null ? obj instanceof Array ? obj : typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj) : [];
    }
    function assign(target, source) {
      const obj = target;

      if (source) {
        for (const key in source) {
          obj[key] = source[key];
        }
      }

      return obj;
    }

    function buildExps(isIRI) {
      const ALPHA$$ = "[A-Za-z]",
            DIGIT$$ = "[0-9]",
            HEXDIG$$ = merge(DIGIT$$, "[A-Fa-f]"),
            PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),
            //expanded
      GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
            SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
            RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$),
            UCSCHAR$$ = isIRI ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]",
            //subset, excludes bidi control characters
      IPRIVATE$$ = isIRI ? "[\\uE000-\\uF8FF]" : "[]",
            //subset
      UNRESERVED$$ = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$),
            SCHEME$ = subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"),
            USERINFO$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*"),
            DEC_OCTET_RELAXED$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("0?[1-9]" + DIGIT$$) + "|0?0?" + DIGIT$$),
            //relaxed parsing rules
      IPV4ADDRESS$ = subexp(DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$),
            H16$ = subexp(HEXDIG$$ + "{1,4}"),
            LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$),
            IPV6ADDRESS1$ = subexp(subexp(H16$ + "\\:") + "{6}" + LS32$),
            //                           6( h16 ":" ) ls32
      IPV6ADDRESS2$ = subexp("\\:\\:" + subexp(H16$ + "\\:") + "{5}" + LS32$),
            //                      "::" 5( h16 ":" ) ls32
      IPV6ADDRESS3$ = subexp(subexp(H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{4}" + LS32$),
            //[               h16 ] "::" 4( h16 ":" ) ls32
      IPV6ADDRESS4$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,1}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{3}" + LS32$),
            //[ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
      IPV6ADDRESS5$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,2}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{2}" + LS32$),
            //[ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
      IPV6ADDRESS6$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,3}" + H16$) + "?\\:\\:" + H16$ + "\\:" + LS32$),
            //[ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
      IPV6ADDRESS7$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,4}" + H16$) + "?\\:\\:" + LS32$),
            //[ *4( h16 ":" ) h16 ] "::"              ls32
      IPV6ADDRESS8$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,5}" + H16$) + "?\\:\\:" + H16$),
            //[ *5( h16 ":" ) h16 ] "::"              h16
      IPV6ADDRESS9$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,6}" + H16$) + "?\\:\\:"),
            //[ *6( h16 ":" ) h16 ] "::"
      IPV6ADDRESS$ = subexp([IPV6ADDRESS1$, IPV6ADDRESS2$, IPV6ADDRESS3$, IPV6ADDRESS4$, IPV6ADDRESS5$, IPV6ADDRESS6$, IPV6ADDRESS7$, IPV6ADDRESS8$, IPV6ADDRESS9$].join("|")),
            ZONEID$ = subexp(subexp(UNRESERVED$$ + "|" + PCT_ENCODED$) + "+"),
            //RFC 6874, with relaxed parsing rules
      IPVFUTURE$ = subexp("[vV]" + HEXDIG$$ + "+\\." + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+"),
            //RFC 6874
      REG_NAME$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$)) + "*"),
            PCHAR$ = subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@]")),
            SEGMENT_NZ_NC$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\@]")) + "+"),
            QUERY$ = subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*");
      return {
        NOT_SCHEME: new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
        NOT_USERINFO: new RegExp(merge("[^\\%\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_HOST: new RegExp(merge("[^\\%\\[\\]\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_PATH: new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_PATH_NOSCHEME: new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        NOT_QUERY: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
        NOT_FRAGMENT: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
        ESCAPE: new RegExp(merge("[^]", UNRESERVED$$, SUB_DELIMS$$), "g"),
        UNRESERVED: new RegExp(UNRESERVED$$, "g"),
        OTHER_CHARS: new RegExp(merge("[^\\%]", UNRESERVED$$, RESERVED$$), "g"),
        PCT_ENCODED: new RegExp(PCT_ENCODED$, "g"),
        IPV4ADDRESS: new RegExp("^(" + IPV4ADDRESS$ + ")$"),
        IPV6ADDRESS: new RegExp("^\\[?(" + IPV6ADDRESS$ + ")" + subexp(subexp("\\%25|\\%(?!" + HEXDIG$$ + "{2})") + "(" + ZONEID$ + ")") + "?\\]?$") //RFC 6874, with relaxed parsing rules

      };
    }
    var URI_PROTOCOL = buildExps(false);

    var IRI_PROTOCOL = buildExps(true);

    /** Highest positive signed 32-bit float value */

    const maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

    /** Bootstring parameters */

    const base = 36;
    const tMin = 1;
    const tMax = 26;
    const skew = 38;
    const damp = 700;
    const initialBias = 72;
    const initialN = 128; // 0x80

    const delimiter = '-'; // '\x2D'

    /** Regular expressions */

    const regexPunycode = /^xn--/;
    const regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars

    const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

    /** Error messages */

    const errors = {
      'overflow': 'Overflow: input needs wider integers to process',
      'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
      'invalid-input': 'Invalid input'
    };
    /** Convenience shortcuts */

    const baseMinusTMin = base - tMin;
    const floor = Math.floor;
    const stringFromCharCode = String.fromCharCode;
    /*--------------------------------------------------------------------------*/

    /**
     * A generic error utility function.
     * @private
     * @param {String} type The error type.
     * @returns {Error} Throws a `RangeError` with the applicable error message.
     */

    function error(type) {
      throw new RangeError(errors[type]);
    }
    /**
     * A generic `Array#map` utility function.
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} callback The function that gets called for every array
     * item.
     * @returns {Array} A new array of values returned by the callback function.
     */


    function map(array, fn) {
      const result = [];
      let length = array.length;

      while (length--) {
        result[length] = fn(array[length]);
      }

      return result;
    }
    /**
     * A simple `Array#map`-like wrapper to work with domain name strings or email
     * addresses.
     * @private
     * @param {String} domain The domain name or email address.
     * @param {Function} callback The function that gets called for every
     * character.
     * @returns {Array} A new string of characters returned by the callback
     * function.
     */


    function mapDomain(string, fn) {
      const parts = string.split('@');
      let result = '';

      if (parts.length > 1) {
        // In email addresses, only the domain name should be punycoded. Leave
        // the local part (i.e. everything up to `@`) intact.
        result = parts[0] + '@';
        string = parts[1];
      } // Avoid `split(regex)` for IE8 compatibility. See #17.


      string = string.replace(regexSeparators, '\x2E');
      const labels = string.split('.');
      const encoded = map(labels, fn).join('.');
      return result + encoded;
    }
    /**
     * Creates an array containing the numeric code points of each Unicode
     * character in the string. While JavaScript uses UCS-2 internally,
     * this function will convert a pair of surrogate halves (each of which
     * UCS-2 exposes as separate characters) into a single code point,
     * matching UTF-16.
     * @see `punycode.ucs2.encode`
     * @see <https://mathiasbynens.be/notes/javascript-encoding>
     * @memberOf punycode.ucs2
     * @name decode
     * @param {String} string The Unicode input string (UCS-2).
     * @returns {Array} The new array of code points.
     */


    function ucs2decode(string) {
      const output = [];
      let counter = 0;
      const length = string.length;

      while (counter < length) {
        const value = string.charCodeAt(counter++);

        if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
          // It's a high surrogate, and there is a next character.
          const extra = string.charCodeAt(counter++);

          if ((extra & 0xFC00) == 0xDC00) {
            // Low surrogate.
            output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
          } else {
            // It's an unmatched surrogate; only append this code unit, in case the
            // next code unit is the high surrogate of a surrogate pair.
            output.push(value);
            counter--;
          }
        } else {
          output.push(value);
        }
      }

      return output;
    }
    /**
     * Creates a string based on an array of numeric code points.
     * @see `punycode.ucs2.decode`
     * @memberOf punycode.ucs2
     * @name encode
     * @param {Array} codePoints The array of numeric code points.
     * @returns {String} The new Unicode string (UCS-2).
     */


    const ucs2encode = array => String.fromCodePoint(...array);
    /**
     * Converts a basic code point into a digit/integer.
     * @see `digitToBasic()`
     * @private
     * @param {Number} codePoint The basic numeric code point value.
     * @returns {Number} The numeric value of a basic code point (for use in
     * representing integers) in the range `0` to `base - 1`, or `base` if
     * the code point does not represent a value.
     */


    const basicToDigit = function (codePoint) {
      if (codePoint - 0x30 < 0x0A) {
        return codePoint - 0x16;
      }

      if (codePoint - 0x41 < 0x1A) {
        return codePoint - 0x41;
      }

      if (codePoint - 0x61 < 0x1A) {
        return codePoint - 0x61;
      }

      return base;
    };
    /**
     * Converts a digit/integer into a basic code point.
     * @see `basicToDigit()`
     * @private
     * @param {Number} digit The numeric value of a basic code point.
     * @returns {Number} The basic code point whose value (when used for
     * representing integers) is `digit`, which needs to be in the range
     * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
     * used; else, the lowercase form is used. The behavior is undefined
     * if `flag` is non-zero and `digit` has no uppercase form.
     */


    const digitToBasic = function (digit, flag) {
      //  0..25 map to ASCII a..z or A..Z
      // 26..35 map to ASCII 0..9
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    };
    /**
     * Bias adaptation function as per section 3.4 of RFC 3492.
     * https://tools.ietf.org/html/rfc3492#section-3.4
     * @private
     */


    const adapt = function (delta, numPoints, firstTime) {
      let k = 0;
      delta = firstTime ? floor(delta / damp) : delta >> 1;
      delta += floor(delta / numPoints);

      for (;
      /* no initialization */
      delta > baseMinusTMin * tMax >> 1; k += base) {
        delta = floor(delta / baseMinusTMin);
      }

      return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    };
    /**
     * Converts a Punycode string of ASCII-only symbols to a string of Unicode
     * symbols.
     * @memberOf punycode
     * @param {String} input The Punycode string of ASCII-only symbols.
     * @returns {String} The resulting string of Unicode symbols.
     */


    const decode = function (input) {
      // Don't use UCS-2.
      const output = [];
      const inputLength = input.length;
      let i = 0;
      let n = initialN;
      let bias = initialBias; // Handle the basic code points: let `basic` be the number of input code
      // points before the last delimiter, or `0` if there is none, then copy
      // the first basic code points to the output.

      let basic = input.lastIndexOf(delimiter);

      if (basic < 0) {
        basic = 0;
      }

      for (let j = 0; j < basic; ++j) {
        // if it's not a basic code point
        if (input.charCodeAt(j) >= 0x80) {
          error('not-basic');
        }

        output.push(input.charCodeAt(j));
      } // Main decoding loop: start just after the last delimiter if any basic code
      // points were copied; start at the beginning otherwise.


      for (let index = basic > 0 ? basic + 1 : 0; index < inputLength;)
      /* no final expression */
      {
        // `index` is the index of the next character to be consumed.
        // Decode a generalized variable-length integer into `delta`,
        // which gets added to `i`. The overflow checking is easier
        // if we increase `i` as we go, then subtract off its starting
        // value at the end to obtain `delta`.
        let oldi = i;

        for (let w = 1, k = base;;
        /* no condition */
        k += base) {
          if (index >= inputLength) {
            error('invalid-input');
          }

          const digit = basicToDigit(input.charCodeAt(index++));

          if (digit >= base || digit > floor((maxInt - i) / w)) {
            error('overflow');
          }

          i += digit * w;
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

          if (digit < t) {
            break;
          }

          const baseMinusT = base - t;

          if (w > floor(maxInt / baseMinusT)) {
            error('overflow');
          }

          w *= baseMinusT;
        }

        const out = output.length + 1;
        bias = adapt(i - oldi, out, oldi == 0); // `i` was supposed to wrap around from `out` to `0`,
        // incrementing `n` each time, so we'll fix that now:

        if (floor(i / out) > maxInt - n) {
          error('overflow');
        }

        n += floor(i / out);
        i %= out; // Insert `n` at position `i` of the output.

        output.splice(i++, 0, n);
      }

      return String.fromCodePoint(...output);
    };
    /**
     * Converts a string of Unicode symbols (e.g. a domain name label) to a
     * Punycode string of ASCII-only symbols.
     * @memberOf punycode
     * @param {String} input The string of Unicode symbols.
     * @returns {String} The resulting Punycode string of ASCII-only symbols.
     */


    const encode = function (input) {
      const output = []; // Convert the input in UCS-2 to an array of Unicode code points.

      input = ucs2decode(input); // Cache the length.

      let inputLength = input.length; // Initialize the state.

      let n = initialN;
      let delta = 0;
      let bias = initialBias; // Handle the basic code points.

      for (const currentValue of input) {
        if (currentValue < 0x80) {
          output.push(stringFromCharCode(currentValue));
        }
      }

      let basicLength = output.length;
      let handledCPCount = basicLength; // `handledCPCount` is the number of code points that have been handled;
      // `basicLength` is the number of basic code points.
      // Finish the basic string with a delimiter unless it's empty.

      if (basicLength) {
        output.push(delimiter);
      } // Main encoding loop:


      while (handledCPCount < inputLength) {
        // All non-basic code points < n have been handled already. Find the next
        // larger one:
        let m = maxInt;

        for (const currentValue of input) {
          if (currentValue >= n && currentValue < m) {
            m = currentValue;
          }
        } // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
        // but guard against overflow.


        const handledCPCountPlusOne = handledCPCount + 1;

        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
          error('overflow');
        }

        delta += (m - n) * handledCPCountPlusOne;
        n = m;

        for (const currentValue of input) {
          if (currentValue < n && ++delta > maxInt) {
            error('overflow');
          }

          if (currentValue == n) {
            // Represent delta as a generalized variable-length integer.
            let q = delta;

            for (let k = base;;
            /* no condition */
            k += base) {
              const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

              if (q < t) {
                break;
              }

              const qMinusT = q - t;
              const baseMinusT = base - t;
              output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
              q = floor(qMinusT / baseMinusT);
            }

            output.push(stringFromCharCode(digitToBasic(q, 0)));
            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
            delta = 0;
            ++handledCPCount;
          }
        }

        ++delta;
        ++n;
      }

      return output.join('');
    };
    /**
     * Converts a Punycode string representing a domain name or an email address
     * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
     * it doesn't matter if you call it on a string that has already been
     * converted to Unicode.
     * @memberOf punycode
     * @param {String} input The Punycoded domain name or email address to
     * convert to Unicode.
     * @returns {String} The Unicode representation of the given Punycode
     * string.
     */


    const toUnicode = function (input) {
      return mapDomain(input, function (string) {
        return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
      });
    };
    /**
     * Converts a Unicode string representing a domain name or an email address to
     * Punycode. Only the non-ASCII parts of the domain name will be converted,
     * i.e. it doesn't matter if you call it with a domain that's already in
     * ASCII.
     * @memberOf punycode
     * @param {String} input The domain name or email address to convert, as a
     * Unicode string.
     * @returns {String} The Punycode representation of the given domain name or
     * email address.
     */


    const toASCII = function (input) {
      return mapDomain(input, function (string) {
        return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
      });
    };
    /*--------------------------------------------------------------------------*/

    /** Define the public API */


    const punycode = {
      /**
       * A string representing the current Punycode.js version number.
       * @memberOf punycode
       * @type String
       */
      'version': '2.1.0',

      /**
       * An object of methods to convert from JavaScript's internal character
       * representation (UCS-2) to Unicode code points, and back.
       * @see <https://mathiasbynens.be/notes/javascript-encoding>
       * @memberOf punycode
       * @type Object
       */
      'ucs2': {
        'decode': ucs2decode,
        'encode': ucs2encode
      },
      'decode': decode,
      'encode': encode,
      'toASCII': toASCII,
      'toUnicode': toUnicode
    };
    var punycode_1 = punycode;

    /**
     * URI.js
     *
     * @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
     * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
     * @see http://github.com/garycourt/uri-js
     */
    const SCHEMES = {};
    function pctEncChar(chr) {
      const c = chr.charCodeAt(0);
      let e;
      if (c < 16) e = "%0" + c.toString(16).toUpperCase();else if (c < 128) e = "%" + c.toString(16).toUpperCase();else if (c < 2048) e = "%" + (c >> 6 | 192).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();else e = "%" + (c >> 12 | 224).toString(16).toUpperCase() + "%" + (c >> 6 & 63 | 128).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
      return e;
    }
    function pctDecChars(str) {
      let newStr = "";
      let i = 0;
      const il = str.length;

      while (i < il) {
        const c = parseInt(str.substr(i + 1, 2), 16);

        if (c < 128) {
          newStr += String.fromCharCode(c);
          i += 3;
        } else if (c >= 194 && c < 224) {
          if (il - i >= 6) {
            const c2 = parseInt(str.substr(i + 4, 2), 16);
            newStr += String.fromCharCode((c & 31) << 6 | c2 & 63);
          } else {
            newStr += str.substr(i, 6);
          }

          i += 6;
        } else if (c >= 224) {
          if (il - i >= 9) {
            const c2 = parseInt(str.substr(i + 4, 2), 16);
            const c3 = parseInt(str.substr(i + 7, 2), 16);
            newStr += String.fromCharCode((c & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
          } else {
            newStr += str.substr(i, 9);
          }

          i += 9;
        } else {
          newStr += str.substr(i, 3);
          i += 3;
        }
      }

      return newStr;
    }

    function _normalizeComponentEncoding(components, protocol) {
      function decodeUnreserved(str) {
        const decStr = pctDecChars(str);
        return !decStr.match(protocol.UNRESERVED) ? str : decStr;
      }

      if (components.scheme) components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_SCHEME, "");
      if (components.userinfo !== undefined) components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
      if (components.host !== undefined) components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
      if (components.path !== undefined) components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
      if (components.query !== undefined) components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
      if (components.fragment !== undefined) components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
      return components;
    }

    function _stripLeadingZeros(str) {
      return str.replace(/^0*(.*)/, "$1") || "0";
    }

    function _normalizeIPv4(host, protocol) {
      const matches = host.match(protocol.IPV4ADDRESS) || [];
      const [, address] = matches;

      if (address) {
        return address.split(".").map(_stripLeadingZeros).join(".");
      } else {
        return host;
      }
    }

    function _normalizeIPv6(host, protocol) {
      const matches = host.match(protocol.IPV6ADDRESS) || [];
      const [, address, zone] = matches;

      if (address) {
        const [last, first] = address.toLowerCase().split('::').reverse();
        const firstFields = first ? first.split(":").map(_stripLeadingZeros) : [];
        const lastFields = last.split(":").map(_stripLeadingZeros);
        const isLastFieldIPv4Address = protocol.IPV4ADDRESS.test(lastFields[lastFields.length - 1]);
        const fieldCount = isLastFieldIPv4Address ? 7 : 8;
        const lastFieldsStart = lastFields.length - fieldCount;
        const fields = Array(fieldCount);

        for (let x = 0; x < fieldCount; ++x) {
          fields[x] = firstFields[x] || lastFields[lastFieldsStart + x] || '';
        }

        if (isLastFieldIPv4Address) {
          fields[fieldCount - 1] = _normalizeIPv4(fields[fieldCount - 1], protocol);
        }

        const allZeroFields = fields.reduce((acc, field, index) => {
          if (!field || field === "0") {
            const lastLongest = acc[acc.length - 1];

            if (lastLongest && lastLongest.index + lastLongest.length === index) {
              lastLongest.length++;
            } else {
              acc.push({
                index,
                length: 1
              });
            }
          }

          return acc;
        }, []);
        const longestZeroFields = allZeroFields.sort((a, b) => b.length - a.length)[0];
        let newHost;

        if (longestZeroFields && longestZeroFields.length > 1) {
          const newFirst = fields.slice(0, longestZeroFields.index);
          const newLast = fields.slice(longestZeroFields.index + longestZeroFields.length);
          newHost = newFirst.join(":") + "::" + newLast.join(":");
        } else {
          newHost = fields.join(":");
        }

        if (zone) {
          newHost += "%" + zone;
        }

        return newHost;
      } else {
        return host;
      }
    }

    const URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
    const NO_MATCH_IS_UNDEFINED = "".match(/(){0}/)[1] === undefined;
    function parse(uriString, options = {}) {
      const components = {};
      const protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
      if (options.reference === "suffix") uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
      const matches = uriString.match(URI_PARSE);

      if (matches) {
        if (NO_MATCH_IS_UNDEFINED) {
          //store each component
          components.scheme = matches[1];
          components.userinfo = matches[3];
          components.host = matches[4];
          components.port = parseInt(matches[5], 10);
          components.path = matches[6] || "";
          components.query = matches[7];
          components.fragment = matches[8]; //fix port number

          if (isNaN(components.port)) {
            components.port = matches[5];
          }
        } else {
          //IE FIX for improper RegExp matching
          //store each component
          components.scheme = matches[1] || undefined;
          components.userinfo = uriString.indexOf("@") !== -1 ? matches[3] : undefined;
          components.host = uriString.indexOf("//") !== -1 ? matches[4] : undefined;
          components.port = parseInt(matches[5], 10);
          components.path = matches[6] || "";
          components.query = uriString.indexOf("?") !== -1 ? matches[7] : undefined;
          components.fragment = uriString.indexOf("#") !== -1 ? matches[8] : undefined; //fix port number

          if (isNaN(components.port)) {
            components.port = uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : undefined;
          }
        }

        if (components.host) {
          //normalize IP hosts
          components.host = _normalizeIPv6(_normalizeIPv4(components.host, protocol), protocol);
        } //determine reference type


        if (components.scheme === undefined && components.userinfo === undefined && components.host === undefined && components.port === undefined && !components.path && components.query === undefined) {
          components.reference = "same-document";
        } else if (components.scheme === undefined) {
          components.reference = "relative";
        } else if (components.fragment === undefined) {
          components.reference = "absolute";
        } else {
          components.reference = "uri";
        } //check for reference errors


        if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) {
          components.error = components.error || "URI is not a " + options.reference + " reference.";
        } //find scheme handler


        const schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()]; //check if scheme can't handle IRIs

        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
          //if host component is a domain name
          if (components.host && (options.domainHost || schemeHandler && schemeHandler.domainHost)) {
            //convert Unicode IDN -> ASCII IDN
            try {
              components.host = punycode_1.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
            } catch (e) {
              components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
            }
          } //convert IRI -> URI


          _normalizeComponentEncoding(components, URI_PROTOCOL);
        } else {
          //normalize encodings
          _normalizeComponentEncoding(components, protocol);
        } //perform scheme specific parsing


        if (schemeHandler && schemeHandler.parse) {
          schemeHandler.parse(components, options);
        }
      } else {
        components.error = components.error || "URI can not be parsed.";
      }

      return components;
    }

    function _recomposeAuthority(components, options) {
      const protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
      const uriTokens = [];

      if (components.userinfo !== undefined) {
        uriTokens.push(components.userinfo);
        uriTokens.push("@");
      }

      if (components.host !== undefined) {
        //normalize IP hosts, add brackets and escape zone separator for IPv6
        uriTokens.push(_normalizeIPv6(_normalizeIPv4(String(components.host), protocol), protocol).replace(protocol.IPV6ADDRESS, (_, $1, $2) => "[" + $1 + ($2 ? "%25" + $2 : "") + "]"));
      }

      if (typeof components.port === "number" || typeof components.port === "string") {
        uriTokens.push(":");
        uriTokens.push(String(components.port));
      }

      return uriTokens.length ? uriTokens.join("") : undefined;
    }
    const RDS1 = /^\.\.?\//;
    const RDS2 = /^\/\.(\/|$)/;
    const RDS3 = /^\/\.\.(\/|$)/;
    const RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/;
    function removeDotSegments(input) {
      const output = [];

      while (input.length) {
        if (input.match(RDS1)) {
          input = input.replace(RDS1, "");
        } else if (input.match(RDS2)) {
          input = input.replace(RDS2, "/");
        } else if (input.match(RDS3)) {
          input = input.replace(RDS3, "/");
          output.pop();
        } else if (input === "." || input === "..") {
          input = "";
        } else {
          const im = input.match(RDS5);

          if (im) {
            const s = im[0];
            input = input.slice(s.length);
            output.push(s);
          } else {
            throw new Error("Unexpected dot segment condition");
          }
        }
      }

      return output.join("");
    }
    function serialize(components, options = {}) {
      const protocol = options.iri ? IRI_PROTOCOL : URI_PROTOCOL;
      const uriTokens = []; //find scheme handler

      const schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()]; //perform scheme specific serialization

      if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options);

      if (components.host) {
        //if host component is an IPv6 address
        if (protocol.IPV6ADDRESS.test(components.host)) ; //if host component is a domain name
        else if (options.domainHost || schemeHandler && schemeHandler.domainHost) {
            //convert IDN via punycode
            try {
              components.host = !options.iri ? punycode_1.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode_1.toUnicode(components.host);
            } catch (e) {
              components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
            }
          }
      } //normalize encoding


      _normalizeComponentEncoding(components, protocol);

      if (options.reference !== "suffix" && components.scheme) {
        uriTokens.push(components.scheme);
        uriTokens.push(":");
      }

      const authority = _recomposeAuthority(components, options);

      if (authority !== undefined) {
        if (options.reference !== "suffix") {
          uriTokens.push("//");
        }

        uriTokens.push(authority);

        if (components.path && components.path.charAt(0) !== "/") {
          uriTokens.push("/");
        }
      }

      if (components.path !== undefined) {
        let s = components.path;

        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
          s = removeDotSegments(s);
        }

        if (authority === undefined) {
          s = s.replace(/^\/\//, "/%2F"); //don't allow the path to start with "//"
        }

        uriTokens.push(s);
      }

      if (components.query !== undefined) {
        uriTokens.push("?");
        uriTokens.push(components.query);
      }

      if (components.fragment !== undefined) {
        uriTokens.push("#");
        uriTokens.push(components.fragment);
      }

      return uriTokens.join(""); //merge tokens into a string
    }
    function resolveComponents(base, relative, options = {}, skipNormalization) {
      const target = {};

      if (!skipNormalization) {
        base = parse(serialize(base, options), options); //normalize base components

        relative = parse(serialize(relative, options), options); //normalize relative components
      }

      options = options || {};

      if (!options.tolerant && relative.scheme) {
        target.scheme = relative.scheme; //target.authority = relative.authority;

        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
          //target.authority = relative.authority;
          target.userinfo = relative.userinfo;
          target.host = relative.host;
          target.port = relative.port;
          target.path = removeDotSegments(relative.path || "");
          target.query = relative.query;
        } else {
          if (!relative.path) {
            target.path = base.path;

            if (relative.query !== undefined) {
              target.query = relative.query;
            } else {
              target.query = base.query;
            }
          } else {
            if (relative.path.charAt(0) === "/") {
              target.path = removeDotSegments(relative.path);
            } else {
              if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
                target.path = "/" + relative.path;
              } else if (!base.path) {
                target.path = relative.path;
              } else {
                target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
              }

              target.path = removeDotSegments(target.path);
            }

            target.query = relative.query;
          } //target.authority = base.authority;


          target.userinfo = base.userinfo;
          target.host = base.host;
          target.port = base.port;
        }

        target.scheme = base.scheme;
      }

      target.fragment = relative.fragment;
      return target;
    }
    function resolve(baseURI, relativeURI, options) {
      const schemelessOptions = assign({
        scheme: 'null'
      }, options);
      return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions);
    }
    function normalize(uri, options) {
      if (typeof uri === "string") {
        uri = serialize(parse(uri, options), options);
      } else if (typeOf(uri) === "object") {
        uri = parse(serialize(uri, options), options);
      }

      return uri;
    }
    function equal(uriA, uriB, options) {
      if (typeof uriA === "string") {
        uriA = serialize(parse(uriA, options), options);
      } else if (typeOf(uriA) === "object") {
        uriA = serialize(uriA, options);
      }

      if (typeof uriB === "string") {
        uriB = serialize(parse(uriB, options), options);
      } else if (typeOf(uriB) === "object") {
        uriB = serialize(uriB, options);
      }

      return uriA === uriB;
    }
    function escapeComponent(str, options) {
      return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE, pctEncChar);
    }
    function unescapeComponent(str, options) {
      return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED, pctDecChars);
    }

    const handler = {
      scheme: "http",
      domainHost: true,
      parse: function (components, options) {
        //report missing host
        if (!components.host) {
          components.error = components.error || "HTTP URIs must have a host.";
        }

        return components;
      },
      serialize: function (components, options) {
        const secure = String(components.scheme).toLowerCase() === "https"; //normalize the default port

        if (components.port === (secure ? 443 : 80) || components.port === "") {
          components.port = undefined;
        } //normalize the empty path


        if (!components.path) {
          components.path = "/";
        } //NOTE: We do not parse query strings for HTTP URIs
        //as WWW Form Url Encoded query strings are part of the HTML4+ spec,
        //and not the HTTP spec.


        return components;
      }
    };

    const handler$1 = {
      scheme: "https",
      domainHost: handler.domainHost,
      parse: handler.parse,
      serialize: handler.serialize
    };

    function isSecure(wsComponents) {
      return typeof wsComponents.secure === 'boolean' ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
    } //RFC 6455


    const handler$2 = {
      scheme: "ws",
      domainHost: true,
      parse: function (components, options) {
        const wsComponents = components; //indicate if the secure flag is set

        wsComponents.secure = isSecure(wsComponents); //construct resouce name

        wsComponents.resourceName = (wsComponents.path || '/') + (wsComponents.query ? '?' + wsComponents.query : '');
        wsComponents.path = undefined;
        wsComponents.query = undefined;
        return wsComponents;
      },
      serialize: function (wsComponents, options) {
        //normalize the default port
        if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
          wsComponents.port = undefined;
        } //ensure scheme matches secure flag


        if (typeof wsComponents.secure === 'boolean') {
          wsComponents.scheme = wsComponents.secure ? 'wss' : 'ws';
          wsComponents.secure = undefined;
        } //reconstruct path from resource name


        if (wsComponents.resourceName) {
          const [path, query] = wsComponents.resourceName.split('?');
          wsComponents.path = path && path !== '/' ? path : undefined;
          wsComponents.query = query;
          wsComponents.resourceName = undefined;
        } //forbid fragment component


        wsComponents.fragment = undefined;
        return wsComponents;
      }
    };

    const handler$3 = {
      scheme: "wss",
      domainHost: handler$2.domainHost,
      parse: handler$2.parse,
      serialize: handler$2.serialize
    };

    const O = {};

    const UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + ( "\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" ) + "]";
    const HEXDIG$$ = "[0-9A-Fa-f]"; //case-insensitive

    const PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)); //expanded
    //RFC 5322, except these symbols as per RFC 6068: @ : / ? # [ ] & ; =
    //const ATEXT$$ = "[A-Za-z0-9\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\|\\}\\~]";
    //const WSP$$ = "[\\x20\\x09]";
    //const OBS_QTEXT$$ = "[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]";  //(%d1-8 / %d11-12 / %d14-31 / %d127)
    //const QTEXT$$ = merge("[\\x21\\x23-\\x5B\\x5D-\\x7E]", OBS_QTEXT$$);  //%d33 / %d35-91 / %d93-126 / obs-qtext
    //const VCHAR$$ = "[\\x21-\\x7E]";
    //const WSP$$ = "[\\x20\\x09]";
    //const OBS_QP$ = subexp("\\\\" + merge("[\\x00\\x0D\\x0A]", OBS_QTEXT$$));  //%d0 / CR / LF / obs-qtext
    //const FWS$ = subexp(subexp(WSP$$ + "*" + "\\x0D\\x0A") + "?" + WSP$$ + "+");
    //const QUOTED_PAIR$ = subexp(subexp("\\\\" + subexp(VCHAR$$ + "|" + WSP$$)) + "|" + OBS_QP$);
    //const QUOTED_STRING$ = subexp('\\"' + subexp(FWS$ + "?" + QCONTENT$) + "*" + FWS$ + "?" + '\\"');

    const ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
    const QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
    const VCHAR$$ = merge(QTEXT$$, "[\\\"\\\\]");

    const DTEXT_NO_OBS$$ = "[\\x21-\\x5A\\x5E-\\x7E]"; //%d33-90 / %d94-126

    const SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
    const UNRESERVED = new RegExp(UNRESERVED$$, "g");
    const PCT_ENCODED = new RegExp(PCT_ENCODED$, "g");
    const NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", '[\\"]', VCHAR$$), "g");
    const NOT_DOMAIN = new RegExp(merge("[^]", ATEXT$$, "[\\.]", "[\\[]", DTEXT_NO_OBS$$, "[\\]]"), "g");
    const NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g");
    const NOT_HFVALUE = NOT_HFNAME;

    function decodeUnreserved(str) {
      const decStr = pctDecChars(str);
      return !decStr.match(UNRESERVED) ? str : decStr;
    }

    const handler$4 = {
      scheme: "mailto",
      parse: function (components, options) {
        const mailtoComponents = components;
        const to = mailtoComponents.to = mailtoComponents.path ? mailtoComponents.path.split(",") : [];
        mailtoComponents.path = undefined;

        if (mailtoComponents.query) {
          let unknownHeaders = false;
          const headers = {};
          const hfields = mailtoComponents.query.split("&");

          for (let x = 0, xl = hfields.length; x < xl; ++x) {
            const hfield = hfields[x].split("=");

            switch (hfield[0]) {
              case "to":
                const toAddrs = hfield[1].split(",");

                for (let x = 0, xl = toAddrs.length; x < xl; ++x) {
                  to.push(toAddrs[x]);
                }

                break;

              case "subject":
                mailtoComponents.subject = unescapeComponent(hfield[1], options);
                break;

              case "body":
                mailtoComponents.body = unescapeComponent(hfield[1], options);
                break;

              default:
                unknownHeaders = true;
                headers[unescapeComponent(hfield[0], options)] = unescapeComponent(hfield[1], options);
                break;
            }
          }

          if (unknownHeaders) mailtoComponents.headers = headers;
        }

        mailtoComponents.query = undefined;

        for (let x = 0, xl = to.length; x < xl; ++x) {
          const addr = to[x].split("@");
          addr[0] = unescapeComponent(addr[0]);

          if (!options.unicodeSupport) {
            //convert Unicode IDN -> ASCII IDN
            try {
              addr[1] = punycode_1.toASCII(unescapeComponent(addr[1], options).toLowerCase());
            } catch (e) {
              mailtoComponents.error = mailtoComponents.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
            }
          } else {
            addr[1] = unescapeComponent(addr[1], options).toLowerCase();
          }

          to[x] = addr.join("@");
        }

        return mailtoComponents;
      },
      serialize: function (mailtoComponents, options) {
        const components = mailtoComponents;
        const to = toArray(mailtoComponents.to);

        if (to) {
          for (let x = 0, xl = to.length; x < xl; ++x) {
            const toAddr = String(to[x]);
            const atIdx = toAddr.lastIndexOf("@");
            const localPart = toAddr.slice(0, atIdx).replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, pctEncChar);
            let domain = toAddr.slice(atIdx + 1); //convert IDN via punycode

            try {
              domain = !options.iri ? punycode_1.toASCII(unescapeComponent(domain, options).toLowerCase()) : punycode_1.toUnicode(domain);
            } catch (e) {
              components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
            }

            to[x] = localPart + "@" + domain;
          }

          components.path = to.join(",");
        }

        const headers = mailtoComponents.headers = mailtoComponents.headers || {};
        if (mailtoComponents.subject) headers["subject"] = mailtoComponents.subject;
        if (mailtoComponents.body) headers["body"] = mailtoComponents.body;
        const fields = [];

        for (const name in headers) {
          if (headers[name] !== O[name]) {
            fields.push(name.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, pctEncChar) + "=" + headers[name].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, pctEncChar));
          }
        }

        if (fields.length) {
          components.query = fields.join("&");
        }

        return components;
      }
    };

    const URN_PARSE = /^([^\:]+)\:(.*)/;

    const handler$5 = {
      scheme: "urn",
      parse: function (components, options) {
        const matches = components.path && components.path.match(URN_PARSE);
        let urnComponents = components;

        if (matches) {
          const scheme = options.scheme || urnComponents.scheme || "urn";
          const nid = matches[1].toLowerCase();
          const nss = matches[2];
          const urnScheme = `${scheme}:${options.nid || nid}`;
          const schemeHandler = SCHEMES[urnScheme];
          urnComponents.nid = nid;
          urnComponents.nss = nss;
          urnComponents.path = undefined;

          if (schemeHandler) {
            urnComponents = schemeHandler.parse(urnComponents, options);
          }
        } else {
          urnComponents.error = urnComponents.error || "URN can not be parsed.";
        }

        return urnComponents;
      },
      serialize: function (urnComponents, options) {
        const scheme = options.scheme || urnComponents.scheme || "urn";
        const nid = urnComponents.nid;
        const urnScheme = `${scheme}:${options.nid || nid}`;
        const schemeHandler = SCHEMES[urnScheme];

        if (schemeHandler) {
          urnComponents = schemeHandler.serialize(urnComponents, options);
        }

        const uriComponents = urnComponents;
        const nss = urnComponents.nss;
        uriComponents.path = `${nid || options.nid}:${nss}`;
        return uriComponents;
      }
    };

    const UUID = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;

    const handler$6 = {
      scheme: "urn:uuid",
      parse: function (urnComponents, options) {
        const uuidComponents = urnComponents;
        uuidComponents.uuid = uuidComponents.nss;
        uuidComponents.nss = undefined;

        if (!options.tolerant && (!uuidComponents.uuid || !uuidComponents.uuid.match(UUID))) {
          uuidComponents.error = uuidComponents.error || "UUID is not valid.";
        }

        return uuidComponents;
      },
      serialize: function (uuidComponents, options) {
        const urnComponents = uuidComponents; //normalize UUID

        urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
        return urnComponents;
      }
    };

    SCHEMES[handler.scheme] = handler;
    SCHEMES[handler$1.scheme] = handler$1;
    SCHEMES[handler$2.scheme] = handler$2;
    SCHEMES[handler$3.scheme] = handler$3;
    SCHEMES[handler$4.scheme] = handler$4;
    SCHEMES[handler$5.scheme] = handler$5;
    SCHEMES[handler$6.scheme] = handler$6;

    exports.SCHEMES = SCHEMES;
    exports.equal = equal;
    exports.escapeComponent = escapeComponent;
    exports.normalize = normalize;
    exports.parse = parse;
    exports.pctDecChars = pctDecChars;
    exports.pctEncChar = pctEncChar;
    exports.removeDotSegments = removeDotSegments;
    exports.resolve = resolve;
    exports.resolveComponents = resolveComponents;
    exports.serialize = serialize;
    exports.unescapeComponent = unescapeComponent;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=uri.all.js.map
