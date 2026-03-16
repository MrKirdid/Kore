"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode10 = __toESM(require("vscode"));
var path8 = __toESM(require("path"));

// src/providers/CompletionProvider.ts
var vscode3 = __toESM(require("vscode"));
var path2 = __toESM(require("path"));

// src/registry/ServiceRegistry.ts
var ServiceRegistry = class {
  constructor() {
    this.services = /* @__PURE__ */ new Map();
  }
  register(info) {
    this.services.set(info.name, info);
  }
  unregister(name) {
    this.services.delete(name);
  }
  get(name) {
    return this.services.get(name);
  }
  getAll() {
    return Array.from(this.services.values());
  }
  getAllNames() {
    return Array.from(this.services.keys());
  }
  has(name) {
    return this.services.has(name);
  }
  getByFilePath(filePath) {
    for (const svc of this.services.values()) {
      if (svc.filePath === filePath) {
        return svc;
      }
    }
    return void 0;
  }
  clear() {
    this.services.clear();
  }
  get size() {
    return this.services.size;
  }
};
var serviceRegistry = new ServiceRegistry();

// src/registry/ControllerRegistry.ts
var ControllerRegistry = class {
  constructor() {
    this.controllers = /* @__PURE__ */ new Map();
  }
  register(info) {
    this.controllers.set(info.name, info);
  }
  unregister(name) {
    this.controllers.delete(name);
  }
  get(name) {
    return this.controllers.get(name);
  }
  getAll() {
    return Array.from(this.controllers.values());
  }
  getAllNames() {
    return Array.from(this.controllers.keys());
  }
  has(name) {
    return this.controllers.has(name);
  }
  getByFilePath(filePath) {
    for (const ctrl of this.controllers.values()) {
      if (ctrl.filePath === filePath) {
        return ctrl;
      }
    }
    return void 0;
  }
  clear() {
    this.controllers.clear();
  }
  get size() {
    return this.controllers.size;
  }
};
var controllerRegistry = new ControllerRegistry();

// node_modules/fuse.js/dist/fuse.mjs
function isArray(value) {
  return !Array.isArray ? getTag(value) === "[object Array]" : Array.isArray(value);
}
var INFINITY = 1 / 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  let result = value + "";
  return result == "0" && 1 / value == -INFINITY ? "-0" : result;
}
function toString(value) {
  return value == null ? "" : baseToString(value);
}
function isString(value) {
  return typeof value === "string";
}
function isNumber(value) {
  return typeof value === "number";
}
function isBoolean(value) {
  return value === true || value === false || isObjectLike(value) && getTag(value) == "[object Boolean]";
}
function isObject(value) {
  return typeof value === "object";
}
function isObjectLike(value) {
  return isObject(value) && value !== null;
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isBlank(value) {
  return !value.trim().length;
}
function getTag(value) {
  return value == null ? value === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(value);
}
var INCORRECT_INDEX_TYPE = "Incorrect 'index' type";
var LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY = (key) => `Invalid value for key ${key}`;
var PATTERN_LENGTH_TOO_LARGE = (max) => `Pattern length exceeds max of ${max}.`;
var MISSING_KEY_PROPERTY = (name) => `Missing ${name} property in key`;
var INVALID_KEY_WEIGHT_VALUE = (key) => `Property 'weight' in key '${key}' must be a positive integer`;
var hasOwn = Object.prototype.hasOwnProperty;
var KeyStore = class {
  constructor(keys) {
    this._keys = [];
    this._keyMap = {};
    let totalWeight = 0;
    keys.forEach((key) => {
      let obj = createKey(key);
      this._keys.push(obj);
      this._keyMap[obj.id] = obj;
      totalWeight += obj.weight;
    });
    this._keys.forEach((key) => {
      key.weight /= totalWeight;
    });
  }
  get(keyId) {
    return this._keyMap[keyId];
  }
  keys() {
    return this._keys;
  }
  toJSON() {
    return JSON.stringify(this._keys);
  }
};
function createKey(key) {
  let path9 = null;
  let id = null;
  let src = null;
  let weight = 1;
  let getFn = null;
  if (isString(key) || isArray(key)) {
    src = key;
    path9 = createKeyPath(key);
    id = createKeyId(key);
  } else {
    if (!hasOwn.call(key, "name")) {
      throw new Error(MISSING_KEY_PROPERTY("name"));
    }
    const name = key.name;
    src = name;
    if (hasOwn.call(key, "weight")) {
      weight = key.weight;
      if (weight <= 0) {
        throw new Error(INVALID_KEY_WEIGHT_VALUE(name));
      }
    }
    path9 = createKeyPath(name);
    id = createKeyId(name);
    getFn = key.getFn;
  }
  return { path: path9, id, weight, src, getFn };
}
function createKeyPath(key) {
  return isArray(key) ? key : key.split(".");
}
function createKeyId(key) {
  return isArray(key) ? key.join(".") : key;
}
function get(obj, path9) {
  let list = [];
  let arr = false;
  const deepGet = (obj2, path10, index) => {
    if (!isDefined(obj2)) {
      return;
    }
    if (!path10[index]) {
      list.push(obj2);
    } else {
      let key = path10[index];
      const value = obj2[key];
      if (!isDefined(value)) {
        return;
      }
      if (index === path10.length - 1 && (isString(value) || isNumber(value) || isBoolean(value))) {
        list.push(toString(value));
      } else if (isArray(value)) {
        arr = true;
        for (let i = 0, len = value.length; i < len; i += 1) {
          deepGet(value[i], path10, index + 1);
        }
      } else if (path10.length) {
        deepGet(value, path10, index + 1);
      }
    }
  };
  deepGet(obj, isString(path9) ? path9.split(".") : path9, 0);
  return arr ? list : list[0];
}
var MatchOptions = {
  // Whether the matches should be included in the result set. When `true`, each record in the result
  // set will include the indices of the matched characters.
  // These can consequently be used for highlighting purposes.
  includeMatches: false,
  // When `true`, the matching function will continue to the end of a search pattern even if
  // a perfect match has already been located in the string.
  findAllMatches: false,
  // Minimum number of characters that must be matched before a result is considered a match
  minMatchCharLength: 1
};
var BasicOptions = {
  // When `true`, the algorithm continues searching to the end of the input even if a perfect
  // match is found before the end of the same input.
  isCaseSensitive: false,
  // When `true`, the algorithm will ignore diacritics (accents) in comparisons
  ignoreDiacritics: false,
  // When true, the matching function will continue to the end of a search pattern even if
  includeScore: false,
  // List of properties that will be searched. This also supports nested properties.
  keys: [],
  // Whether to sort the result list, by score
  shouldSort: true,
  // Default sort function: sort by ascending score, ascending index
  sortFn: (a, b) => a.score === b.score ? a.idx < b.idx ? -1 : 1 : a.score < b.score ? -1 : 1
};
var FuzzyOptions = {
  // Approximately where in the text is the pattern expected to be found?
  location: 0,
  // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match
  // (of both letters and location), a threshold of '1.0' would match anything.
  threshold: 0.6,
  // Determines how close the match must be to the fuzzy location (specified above).
  // An exact letter match which is 'distance' characters away from the fuzzy location
  // would score as a complete mismatch. A distance of '0' requires the match be at
  // the exact location specified, a threshold of '1000' would require a perfect match
  // to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
  distance: 100
};
var AdvancedOptions = {
  // When `true`, it enables the use of unix-like search commands
  useExtendedSearch: false,
  // The get function to use when fetching an object's properties.
  // The default will search nested paths *ie foo.bar.baz*
  getFn: get,
  // When `true`, search will ignore `location` and `distance`, so it won't matter
  // where in the string the pattern appears.
  // More info: https://fusejs.io/concepts/scoring-theory.html#fuzziness-score
  ignoreLocation: false,
  // When `true`, the calculation for the relevance score (used for sorting) will
  // ignore the field-length norm.
  // More info: https://fusejs.io/concepts/scoring-theory.html#field-length-norm
  ignoreFieldNorm: false,
  // The weight to determine how much field length norm effects scoring.
  fieldNormWeight: 1
};
var Config = {
  ...BasicOptions,
  ...MatchOptions,
  ...FuzzyOptions,
  ...AdvancedOptions
};
var SPACE = /[^ ]+/g;
function norm(weight = 1, mantissa = 3) {
  const cache = /* @__PURE__ */ new Map();
  const m = Math.pow(10, mantissa);
  return {
    get(value) {
      const numTokens = value.match(SPACE).length;
      if (cache.has(numTokens)) {
        return cache.get(numTokens);
      }
      const norm2 = 1 / Math.pow(numTokens, 0.5 * weight);
      const n = parseFloat(Math.round(norm2 * m) / m);
      cache.set(numTokens, n);
      return n;
    },
    clear() {
      cache.clear();
    }
  };
}
var FuseIndex = class {
  constructor({
    getFn = Config.getFn,
    fieldNormWeight = Config.fieldNormWeight
  } = {}) {
    this.norm = norm(fieldNormWeight, 3);
    this.getFn = getFn;
    this.isCreated = false;
    this.setIndexRecords();
  }
  setSources(docs = []) {
    this.docs = docs;
  }
  setIndexRecords(records = []) {
    this.records = records;
  }
  setKeys(keys = []) {
    this.keys = keys;
    this._keysMap = {};
    keys.forEach((key, idx) => {
      this._keysMap[key.id] = idx;
    });
  }
  create() {
    if (this.isCreated || !this.docs.length) {
      return;
    }
    this.isCreated = true;
    if (isString(this.docs[0])) {
      this.docs.forEach((doc, docIndex) => {
        this._addString(doc, docIndex);
      });
    } else {
      this.docs.forEach((doc, docIndex) => {
        this._addObject(doc, docIndex);
      });
    }
    this.norm.clear();
  }
  // Adds a doc to the end of the index
  add(doc) {
    const idx = this.size();
    if (isString(doc)) {
      this._addString(doc, idx);
    } else {
      this._addObject(doc, idx);
    }
  }
  // Removes the doc at the specified index of the index
  removeAt(idx) {
    this.records.splice(idx, 1);
    for (let i = idx, len = this.size(); i < len; i += 1) {
      this.records[i].i -= 1;
    }
  }
  getValueForItemAtKeyId(item, keyId) {
    return item[this._keysMap[keyId]];
  }
  size() {
    return this.records.length;
  }
  _addString(doc, docIndex) {
    if (!isDefined(doc) || isBlank(doc)) {
      return;
    }
    let record = {
      v: doc,
      i: docIndex,
      n: this.norm.get(doc)
    };
    this.records.push(record);
  }
  _addObject(doc, docIndex) {
    let record = { i: docIndex, $: {} };
    this.keys.forEach((key, keyIndex) => {
      let value = key.getFn ? key.getFn(doc) : this.getFn(doc, key.path);
      if (!isDefined(value)) {
        return;
      }
      if (isArray(value)) {
        let subRecords = [];
        const stack = [{ nestedArrIndex: -1, value }];
        while (stack.length) {
          const { nestedArrIndex, value: value2 } = stack.pop();
          if (!isDefined(value2)) {
            continue;
          }
          if (isString(value2) && !isBlank(value2)) {
            let subRecord = {
              v: value2,
              i: nestedArrIndex,
              n: this.norm.get(value2)
            };
            subRecords.push(subRecord);
          } else if (isArray(value2)) {
            value2.forEach((item, k) => {
              stack.push({
                nestedArrIndex: k,
                value: item
              });
            });
          } else
            ;
        }
        record.$[keyIndex] = subRecords;
      } else if (isString(value) && !isBlank(value)) {
        let subRecord = {
          v: value,
          n: this.norm.get(value)
        };
        record.$[keyIndex] = subRecord;
      }
    });
    this.records.push(record);
  }
  toJSON() {
    return {
      keys: this.keys,
      records: this.records
    };
  }
};
function createIndex(keys, docs, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  const myIndex = new FuseIndex({ getFn, fieldNormWeight });
  myIndex.setKeys(keys.map(createKey));
  myIndex.setSources(docs);
  myIndex.create();
  return myIndex;
}
function parseIndex(data, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  const { keys, records } = data;
  const myIndex = new FuseIndex({ getFn, fieldNormWeight });
  myIndex.setKeys(keys);
  myIndex.setIndexRecords(records);
  return myIndex;
}
function computeScore$1(pattern, {
  errors = 0,
  currentLocation = 0,
  expectedLocation = 0,
  distance = Config.distance,
  ignoreLocation = Config.ignoreLocation
} = {}) {
  const accuracy = errors / pattern.length;
  if (ignoreLocation) {
    return accuracy;
  }
  const proximity = Math.abs(expectedLocation - currentLocation);
  if (!distance) {
    return proximity ? 1 : accuracy;
  }
  return accuracy + proximity / distance;
}
function convertMaskToIndices(matchmask = [], minMatchCharLength = Config.minMatchCharLength) {
  let indices = [];
  let start = -1;
  let end = -1;
  let i = 0;
  for (let len = matchmask.length; i < len; i += 1) {
    let match = matchmask[i];
    if (match && start === -1) {
      start = i;
    } else if (!match && start !== -1) {
      end = i - 1;
      if (end - start + 1 >= minMatchCharLength) {
        indices.push([start, end]);
      }
      start = -1;
    }
  }
  if (matchmask[i - 1] && i - start >= minMatchCharLength) {
    indices.push([start, i - 1]);
  }
  return indices;
}
var MAX_BITS = 32;
function search(text, pattern, patternAlphabet, {
  location = Config.location,
  distance = Config.distance,
  threshold = Config.threshold,
  findAllMatches = Config.findAllMatches,
  minMatchCharLength = Config.minMatchCharLength,
  includeMatches = Config.includeMatches,
  ignoreLocation = Config.ignoreLocation
} = {}) {
  if (pattern.length > MAX_BITS) {
    throw new Error(PATTERN_LENGTH_TOO_LARGE(MAX_BITS));
  }
  const patternLen = pattern.length;
  const textLen = text.length;
  const expectedLocation = Math.max(0, Math.min(location, textLen));
  let currentThreshold = threshold;
  let bestLocation = expectedLocation;
  const computeMatches = minMatchCharLength > 1 || includeMatches;
  const matchMask = computeMatches ? Array(textLen) : [];
  let index;
  while ((index = text.indexOf(pattern, bestLocation)) > -1) {
    let score = computeScore$1(pattern, {
      currentLocation: index,
      expectedLocation,
      distance,
      ignoreLocation
    });
    currentThreshold = Math.min(score, currentThreshold);
    bestLocation = index + patternLen;
    if (computeMatches) {
      let i = 0;
      while (i < patternLen) {
        matchMask[index + i] = 1;
        i += 1;
      }
    }
  }
  bestLocation = -1;
  let lastBitArr = [];
  let finalScore = 1;
  let binMax = patternLen + textLen;
  const mask = 1 << patternLen - 1;
  for (let i = 0; i < patternLen; i += 1) {
    let binMin = 0;
    let binMid = binMax;
    while (binMin < binMid) {
      const score2 = computeScore$1(pattern, {
        errors: i,
        currentLocation: expectedLocation + binMid,
        expectedLocation,
        distance,
        ignoreLocation
      });
      if (score2 <= currentThreshold) {
        binMin = binMid;
      } else {
        binMax = binMid;
      }
      binMid = Math.floor((binMax - binMin) / 2 + binMin);
    }
    binMax = binMid;
    let start = Math.max(1, expectedLocation - binMid + 1);
    let finish = findAllMatches ? textLen : Math.min(expectedLocation + binMid, textLen) + patternLen;
    let bitArr = Array(finish + 2);
    bitArr[finish + 1] = (1 << i) - 1;
    for (let j = finish; j >= start; j -= 1) {
      let currentLocation = j - 1;
      let charMatch = patternAlphabet[text.charAt(currentLocation)];
      if (computeMatches) {
        matchMask[currentLocation] = +!!charMatch;
      }
      bitArr[j] = (bitArr[j + 1] << 1 | 1) & charMatch;
      if (i) {
        bitArr[j] |= (lastBitArr[j + 1] | lastBitArr[j]) << 1 | 1 | lastBitArr[j + 1];
      }
      if (bitArr[j] & mask) {
        finalScore = computeScore$1(pattern, {
          errors: i,
          currentLocation,
          expectedLocation,
          distance,
          ignoreLocation
        });
        if (finalScore <= currentThreshold) {
          currentThreshold = finalScore;
          bestLocation = currentLocation;
          if (bestLocation <= expectedLocation) {
            break;
          }
          start = Math.max(1, 2 * expectedLocation - bestLocation);
        }
      }
    }
    const score = computeScore$1(pattern, {
      errors: i + 1,
      currentLocation: expectedLocation,
      expectedLocation,
      distance,
      ignoreLocation
    });
    if (score > currentThreshold) {
      break;
    }
    lastBitArr = bitArr;
  }
  const result = {
    isMatch: bestLocation >= 0,
    // Count exact matches (those with a score of 0) to be "almost" exact
    score: Math.max(1e-3, finalScore)
  };
  if (computeMatches) {
    const indices = convertMaskToIndices(matchMask, minMatchCharLength);
    if (!indices.length) {
      result.isMatch = false;
    } else if (includeMatches) {
      result.indices = indices;
    }
  }
  return result;
}
function createPatternAlphabet(pattern) {
  let mask = {};
  for (let i = 0, len = pattern.length; i < len; i += 1) {
    const char = pattern.charAt(i);
    mask[char] = (mask[char] || 0) | 1 << len - i - 1;
  }
  return mask;
}
var stripDiacritics = String.prototype.normalize ? (str) => str.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "") : (str) => str;
var BitapSearch = class {
  constructor(pattern, {
    location = Config.location,
    threshold = Config.threshold,
    distance = Config.distance,
    includeMatches = Config.includeMatches,
    findAllMatches = Config.findAllMatches,
    minMatchCharLength = Config.minMatchCharLength,
    isCaseSensitive = Config.isCaseSensitive,
    ignoreDiacritics = Config.ignoreDiacritics,
    ignoreLocation = Config.ignoreLocation
  } = {}) {
    this.options = {
      location,
      threshold,
      distance,
      includeMatches,
      findAllMatches,
      minMatchCharLength,
      isCaseSensitive,
      ignoreDiacritics,
      ignoreLocation
    };
    pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
    pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
    this.pattern = pattern;
    this.chunks = [];
    if (!this.pattern.length) {
      return;
    }
    const addChunk = (pattern2, startIndex) => {
      this.chunks.push({
        pattern: pattern2,
        alphabet: createPatternAlphabet(pattern2),
        startIndex
      });
    };
    const len = this.pattern.length;
    if (len > MAX_BITS) {
      let i = 0;
      const remainder = len % MAX_BITS;
      const end = len - remainder;
      while (i < end) {
        addChunk(this.pattern.substr(i, MAX_BITS), i);
        i += MAX_BITS;
      }
      if (remainder) {
        const startIndex = len - MAX_BITS;
        addChunk(this.pattern.substr(startIndex), startIndex);
      }
    } else {
      addChunk(this.pattern, 0);
    }
  }
  searchIn(text) {
    const { isCaseSensitive, ignoreDiacritics, includeMatches } = this.options;
    text = isCaseSensitive ? text : text.toLowerCase();
    text = ignoreDiacritics ? stripDiacritics(text) : text;
    if (this.pattern === text) {
      let result2 = {
        isMatch: true,
        score: 0
      };
      if (includeMatches) {
        result2.indices = [[0, text.length - 1]];
      }
      return result2;
    }
    const {
      location,
      distance,
      threshold,
      findAllMatches,
      minMatchCharLength,
      ignoreLocation
    } = this.options;
    let allIndices = [];
    let totalScore = 0;
    let hasMatches = false;
    this.chunks.forEach(({ pattern, alphabet, startIndex }) => {
      const { isMatch, score, indices } = search(text, pattern, alphabet, {
        location: location + startIndex,
        distance,
        threshold,
        findAllMatches,
        minMatchCharLength,
        includeMatches,
        ignoreLocation
      });
      if (isMatch) {
        hasMatches = true;
      }
      totalScore += score;
      if (isMatch && indices) {
        allIndices = [...allIndices, ...indices];
      }
    });
    let result = {
      isMatch: hasMatches,
      score: hasMatches ? totalScore / this.chunks.length : 1
    };
    if (hasMatches && includeMatches) {
      result.indices = allIndices;
    }
    return result;
  }
};
var BaseMatch = class {
  constructor(pattern) {
    this.pattern = pattern;
  }
  static isMultiMatch(pattern) {
    return getMatch(pattern, this.multiRegex);
  }
  static isSingleMatch(pattern) {
    return getMatch(pattern, this.singleRegex);
  }
  search() {
  }
};
function getMatch(pattern, exp) {
  const matches = pattern.match(exp);
  return matches ? matches[1] : null;
}
var ExactMatch = class extends BaseMatch {
  constructor(pattern) {
    super(pattern);
  }
  static get type() {
    return "exact";
  }
  static get multiRegex() {
    return /^="(.*)"$/;
  }
  static get singleRegex() {
    return /^=(.*)$/;
  }
  search(text) {
    const isMatch = text === this.pattern;
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
};
var InverseExactMatch = class extends BaseMatch {
  constructor(pattern) {
    super(pattern);
  }
  static get type() {
    return "inverse-exact";
  }
  static get multiRegex() {
    return /^!"(.*)"$/;
  }
  static get singleRegex() {
    return /^!(.*)$/;
  }
  search(text) {
    const index = text.indexOf(this.pattern);
    const isMatch = index === -1;
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, text.length - 1]
    };
  }
};
var PrefixExactMatch = class extends BaseMatch {
  constructor(pattern) {
    super(pattern);
  }
  static get type() {
    return "prefix-exact";
  }
  static get multiRegex() {
    return /^\^"(.*)"$/;
  }
  static get singleRegex() {
    return /^\^(.*)$/;
  }
  search(text) {
    const isMatch = text.startsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
};
var InversePrefixExactMatch = class extends BaseMatch {
  constructor(pattern) {
    super(pattern);
  }
  static get type() {
    return "inverse-prefix-exact";
  }
  static get multiRegex() {
    return /^!\^"(.*)"$/;
  }
  static get singleRegex() {
    return /^!\^(.*)$/;
  }
  search(text) {
    const isMatch = !text.startsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, text.length - 1]
    };
  }
};
var SuffixExactMatch = class extends BaseMatch {
  constructor(pattern) {
    super(pattern);
  }
  static get type() {
    return "suffix-exact";
  }
  static get multiRegex() {
    return /^"(.*)"\$$/;
  }
  static get singleRegex() {
    return /^(.*)\$$/;
  }
  search(text) {
    const isMatch = text.endsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [text.length - this.pattern.length, text.length - 1]
    };
  }
};
var InverseSuffixExactMatch = class extends BaseMatch {
  constructor(pattern) {
    super(pattern);
  }
  static get type() {
    return "inverse-suffix-exact";
  }
  static get multiRegex() {
    return /^!"(.*)"\$$/;
  }
  static get singleRegex() {
    return /^!(.*)\$$/;
  }
  search(text) {
    const isMatch = !text.endsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, text.length - 1]
    };
  }
};
var FuzzyMatch = class extends BaseMatch {
  constructor(pattern, {
    location = Config.location,
    threshold = Config.threshold,
    distance = Config.distance,
    includeMatches = Config.includeMatches,
    findAllMatches = Config.findAllMatches,
    minMatchCharLength = Config.minMatchCharLength,
    isCaseSensitive = Config.isCaseSensitive,
    ignoreDiacritics = Config.ignoreDiacritics,
    ignoreLocation = Config.ignoreLocation
  } = {}) {
    super(pattern);
    this._bitapSearch = new BitapSearch(pattern, {
      location,
      threshold,
      distance,
      includeMatches,
      findAllMatches,
      minMatchCharLength,
      isCaseSensitive,
      ignoreDiacritics,
      ignoreLocation
    });
  }
  static get type() {
    return "fuzzy";
  }
  static get multiRegex() {
    return /^"(.*)"$/;
  }
  static get singleRegex() {
    return /^(.*)$/;
  }
  search(text) {
    return this._bitapSearch.searchIn(text);
  }
};
var IncludeMatch = class extends BaseMatch {
  constructor(pattern) {
    super(pattern);
  }
  static get type() {
    return "include";
  }
  static get multiRegex() {
    return /^'"(.*)"$/;
  }
  static get singleRegex() {
    return /^'(.*)$/;
  }
  search(text) {
    let location = 0;
    let index;
    const indices = [];
    const patternLen = this.pattern.length;
    while ((index = text.indexOf(this.pattern, location)) > -1) {
      location = index + patternLen;
      indices.push([index, location - 1]);
    }
    const isMatch = !!indices.length;
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices
    };
  }
};
var searchers = [
  ExactMatch,
  IncludeMatch,
  PrefixExactMatch,
  InversePrefixExactMatch,
  InverseSuffixExactMatch,
  SuffixExactMatch,
  InverseExactMatch,
  FuzzyMatch
];
var searchersLen = searchers.length;
var SPACE_RE = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
var OR_TOKEN = "|";
function parseQuery(pattern, options = {}) {
  return pattern.split(OR_TOKEN).map((item) => {
    let query = item.trim().split(SPACE_RE).filter((item2) => item2 && !!item2.trim());
    let results = [];
    for (let i = 0, len = query.length; i < len; i += 1) {
      const queryItem = query[i];
      let found = false;
      let idx = -1;
      while (!found && ++idx < searchersLen) {
        const searcher = searchers[idx];
        let token = searcher.isMultiMatch(queryItem);
        if (token) {
          results.push(new searcher(token, options));
          found = true;
        }
      }
      if (found) {
        continue;
      }
      idx = -1;
      while (++idx < searchersLen) {
        const searcher = searchers[idx];
        let token = searcher.isSingleMatch(queryItem);
        if (token) {
          results.push(new searcher(token, options));
          break;
        }
      }
    }
    return results;
  });
}
var MultiMatchSet = /* @__PURE__ */ new Set([FuzzyMatch.type, IncludeMatch.type]);
var ExtendedSearch = class {
  constructor(pattern, {
    isCaseSensitive = Config.isCaseSensitive,
    ignoreDiacritics = Config.ignoreDiacritics,
    includeMatches = Config.includeMatches,
    minMatchCharLength = Config.minMatchCharLength,
    ignoreLocation = Config.ignoreLocation,
    findAllMatches = Config.findAllMatches,
    location = Config.location,
    threshold = Config.threshold,
    distance = Config.distance
  } = {}) {
    this.query = null;
    this.options = {
      isCaseSensitive,
      ignoreDiacritics,
      includeMatches,
      minMatchCharLength,
      findAllMatches,
      ignoreLocation,
      location,
      threshold,
      distance
    };
    pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
    pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
    this.pattern = pattern;
    this.query = parseQuery(this.pattern, this.options);
  }
  static condition(_, options) {
    return options.useExtendedSearch;
  }
  searchIn(text) {
    const query = this.query;
    if (!query) {
      return {
        isMatch: false,
        score: 1
      };
    }
    const { includeMatches, isCaseSensitive, ignoreDiacritics } = this.options;
    text = isCaseSensitive ? text : text.toLowerCase();
    text = ignoreDiacritics ? stripDiacritics(text) : text;
    let numMatches = 0;
    let allIndices = [];
    let totalScore = 0;
    for (let i = 0, qLen = query.length; i < qLen; i += 1) {
      const searchers2 = query[i];
      allIndices.length = 0;
      numMatches = 0;
      for (let j = 0, pLen = searchers2.length; j < pLen; j += 1) {
        const searcher = searchers2[j];
        const { isMatch, indices, score } = searcher.search(text);
        if (isMatch) {
          numMatches += 1;
          totalScore += score;
          if (includeMatches) {
            const type = searcher.constructor.type;
            if (MultiMatchSet.has(type)) {
              allIndices = [...allIndices, ...indices];
            } else {
              allIndices.push(indices);
            }
          }
        } else {
          totalScore = 0;
          numMatches = 0;
          allIndices.length = 0;
          break;
        }
      }
      if (numMatches) {
        let result = {
          isMatch: true,
          score: totalScore / numMatches
        };
        if (includeMatches) {
          result.indices = allIndices;
        }
        return result;
      }
    }
    return {
      isMatch: false,
      score: 1
    };
  }
};
var registeredSearchers = [];
function register(...args) {
  registeredSearchers.push(...args);
}
function createSearcher(pattern, options) {
  for (let i = 0, len = registeredSearchers.length; i < len; i += 1) {
    let searcherClass = registeredSearchers[i];
    if (searcherClass.condition(pattern, options)) {
      return new searcherClass(pattern, options);
    }
  }
  return new BitapSearch(pattern, options);
}
var LogicalOperator = {
  AND: "$and",
  OR: "$or"
};
var KeyType = {
  PATH: "$path",
  PATTERN: "$val"
};
var isExpression = (query) => !!(query[LogicalOperator.AND] || query[LogicalOperator.OR]);
var isPath = (query) => !!query[KeyType.PATH];
var isLeaf = (query) => !isArray(query) && isObject(query) && !isExpression(query);
var convertToExplicit = (query) => ({
  [LogicalOperator.AND]: Object.keys(query).map((key) => ({
    [key]: query[key]
  }))
});
function parse(query, options, { auto = true } = {}) {
  const next = (query2) => {
    let keys = Object.keys(query2);
    const isQueryPath = isPath(query2);
    if (!isQueryPath && keys.length > 1 && !isExpression(query2)) {
      return next(convertToExplicit(query2));
    }
    if (isLeaf(query2)) {
      const key = isQueryPath ? query2[KeyType.PATH] : keys[0];
      const pattern = isQueryPath ? query2[KeyType.PATTERN] : query2[key];
      if (!isString(pattern)) {
        throw new Error(LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY(key));
      }
      const obj = {
        keyId: createKeyId(key),
        pattern
      };
      if (auto) {
        obj.searcher = createSearcher(pattern, options);
      }
      return obj;
    }
    let node = {
      children: [],
      operator: keys[0]
    };
    keys.forEach((key) => {
      const value = query2[key];
      if (isArray(value)) {
        value.forEach((item) => {
          node.children.push(next(item));
        });
      }
    });
    return node;
  };
  if (!isExpression(query)) {
    query = convertToExplicit(query);
  }
  return next(query);
}
function computeScore(results, { ignoreFieldNorm = Config.ignoreFieldNorm }) {
  results.forEach((result) => {
    let totalScore = 1;
    result.matches.forEach(({ key, norm: norm2, score }) => {
      const weight = key ? key.weight : null;
      totalScore *= Math.pow(
        score === 0 && weight ? Number.EPSILON : score,
        (weight || 1) * (ignoreFieldNorm ? 1 : norm2)
      );
    });
    result.score = totalScore;
  });
}
function transformMatches(result, data) {
  const matches = result.matches;
  data.matches = [];
  if (!isDefined(matches)) {
    return;
  }
  matches.forEach((match) => {
    if (!isDefined(match.indices) || !match.indices.length) {
      return;
    }
    const { indices, value } = match;
    let obj = {
      indices,
      value
    };
    if (match.key) {
      obj.key = match.key.src;
    }
    if (match.idx > -1) {
      obj.refIndex = match.idx;
    }
    data.matches.push(obj);
  });
}
function transformScore(result, data) {
  data.score = result.score;
}
function format(results, docs, {
  includeMatches = Config.includeMatches,
  includeScore = Config.includeScore
} = {}) {
  const transformers = [];
  if (includeMatches)
    transformers.push(transformMatches);
  if (includeScore)
    transformers.push(transformScore);
  return results.map((result) => {
    const { idx } = result;
    const data = {
      item: docs[idx],
      refIndex: idx
    };
    if (transformers.length) {
      transformers.forEach((transformer) => {
        transformer(result, data);
      });
    }
    return data;
  });
}
var Fuse = class {
  constructor(docs, options = {}, index) {
    this.options = { ...Config, ...options };
    if (this.options.useExtendedSearch && false) {
      throw new Error(EXTENDED_SEARCH_UNAVAILABLE);
    }
    this._keyStore = new KeyStore(this.options.keys);
    this.setCollection(docs, index);
  }
  setCollection(docs, index) {
    this._docs = docs;
    if (index && !(index instanceof FuseIndex)) {
      throw new Error(INCORRECT_INDEX_TYPE);
    }
    this._myIndex = index || createIndex(this.options.keys, this._docs, {
      getFn: this.options.getFn,
      fieldNormWeight: this.options.fieldNormWeight
    });
  }
  add(doc) {
    if (!isDefined(doc)) {
      return;
    }
    this._docs.push(doc);
    this._myIndex.add(doc);
  }
  remove(predicate = () => false) {
    const results = [];
    for (let i = 0, len = this._docs.length; i < len; i += 1) {
      const doc = this._docs[i];
      if (predicate(doc, i)) {
        this.removeAt(i);
        i -= 1;
        len -= 1;
        results.push(doc);
      }
    }
    return results;
  }
  removeAt(idx) {
    this._docs.splice(idx, 1);
    this._myIndex.removeAt(idx);
  }
  getIndex() {
    return this._myIndex;
  }
  search(query, { limit = -1 } = {}) {
    const {
      includeMatches,
      includeScore,
      shouldSort,
      sortFn,
      ignoreFieldNorm
    } = this.options;
    let results = isString(query) ? isString(this._docs[0]) ? this._searchStringList(query) : this._searchObjectList(query) : this._searchLogical(query);
    computeScore(results, { ignoreFieldNorm });
    if (shouldSort) {
      results.sort(sortFn);
    }
    if (isNumber(limit) && limit > -1) {
      results = results.slice(0, limit);
    }
    return format(results, this._docs, {
      includeMatches,
      includeScore
    });
  }
  _searchStringList(query) {
    const searcher = createSearcher(query, this.options);
    const { records } = this._myIndex;
    const results = [];
    records.forEach(({ v: text, i: idx, n: norm2 }) => {
      if (!isDefined(text)) {
        return;
      }
      const { isMatch, score, indices } = searcher.searchIn(text);
      if (isMatch) {
        results.push({
          item: text,
          idx,
          matches: [{ score, value: text, norm: norm2, indices }]
        });
      }
    });
    return results;
  }
  _searchLogical(query) {
    const expression = parse(query, this.options);
    const evaluate = (node, item, idx) => {
      if (!node.children) {
        const { keyId, searcher } = node;
        const matches = this._findMatches({
          key: this._keyStore.get(keyId),
          value: this._myIndex.getValueForItemAtKeyId(item, keyId),
          searcher
        });
        if (matches && matches.length) {
          return [
            {
              idx,
              item,
              matches
            }
          ];
        }
        return [];
      }
      const res = [];
      for (let i = 0, len = node.children.length; i < len; i += 1) {
        const child = node.children[i];
        const result = evaluate(child, item, idx);
        if (result.length) {
          res.push(...result);
        } else if (node.operator === LogicalOperator.AND) {
          return [];
        }
      }
      return res;
    };
    const records = this._myIndex.records;
    const resultMap = {};
    const results = [];
    records.forEach(({ $: item, i: idx }) => {
      if (isDefined(item)) {
        let expResults = evaluate(expression, item, idx);
        if (expResults.length) {
          if (!resultMap[idx]) {
            resultMap[idx] = { idx, item, matches: [] };
            results.push(resultMap[idx]);
          }
          expResults.forEach(({ matches }) => {
            resultMap[idx].matches.push(...matches);
          });
        }
      }
    });
    return results;
  }
  _searchObjectList(query) {
    const searcher = createSearcher(query, this.options);
    const { keys, records } = this._myIndex;
    const results = [];
    records.forEach(({ $: item, i: idx }) => {
      if (!isDefined(item)) {
        return;
      }
      let matches = [];
      keys.forEach((key, keyIndex) => {
        matches.push(
          ...this._findMatches({
            key,
            value: item[keyIndex],
            searcher
          })
        );
      });
      if (matches.length) {
        results.push({
          idx,
          item,
          matches
        });
      }
    });
    return results;
  }
  _findMatches({ key, value, searcher }) {
    if (!isDefined(value)) {
      return [];
    }
    let matches = [];
    if (isArray(value)) {
      value.forEach(({ v: text, i: idx, n: norm2 }) => {
        if (!isDefined(text)) {
          return;
        }
        const { isMatch, score, indices } = searcher.searchIn(text);
        if (isMatch) {
          matches.push({
            score,
            key,
            value: text,
            idx,
            norm: norm2,
            indices
          });
        }
      });
    } else {
      const { v: text, n: norm2 } = value;
      const { isMatch, score, indices } = searcher.searchIn(text);
      if (isMatch) {
        matches.push({ score, key, value: text, norm: norm2, indices });
      }
    }
    return matches;
  }
};
Fuse.version = "7.1.0";
Fuse.createIndex = createIndex;
Fuse.parseIndex = parseIndex;
Fuse.config = Config;
{
  Fuse.parseQuery = parse;
}
{
  register(ExtendedSearch);
}

// src/fuzzy/FuzzyMatcher.ts
var FuzzyMatcher = class {
  constructor(names, threshold = 0.4) {
    this.threshold = threshold;
    this.fuse = new Fuse(
      names.map((n) => ({ name: n })),
      {
        keys: ["name"],
        threshold,
        includeScore: true
      }
    );
  }
  search(query) {
    const results = this.fuse.search(query);
    return results.map((r) => ({
      name: r.item.name,
      score: r.score ?? 1
    }));
  }
  update(names) {
    this.fuse = new Fuse(
      names.map((n) => ({ name: n })),
      {
        keys: ["name"],
        threshold: this.threshold,
        includeScore: true
      }
    );
  }
};

// src/config/KoreConfig.ts
var vscode2 = __toESM(require("vscode"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));

// src/Logger.ts
var vscode = __toESM(require("vscode"));
var outputChannel;
var debugEnabled = false;
function timestamp() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(11, 23);
}
function initLogger(channel) {
  outputChannel = channel;
  refreshDebugSetting();
}
function refreshDebugSetting() {
  debugEnabled = vscode.workspace.getConfiguration("kore").get("debug", false);
}
function setDebugEnabled(enabled) {
  debugEnabled = enabled;
}
function logInfo(message) {
  outputChannel?.appendLine(`[${timestamp()}] [INFO]  ${message}`);
}
function logError(message, error) {
  const suffix = error instanceof Error ? `: ${error.message}` : error ? `: ${String(error)}` : "";
  outputChannel?.appendLine(`[${timestamp()}] [ERROR] ${message}${suffix}`);
  if (error instanceof Error && error.stack) {
    outputChannel?.appendLine(error.stack);
  }
  outputChannel?.show(true);
}
function logWarn(message) {
  outputChannel?.appendLine(`[${timestamp()}] [WARN]  ${message}`);
}
function logDebug(message) {
  if (!debugEnabled)
    return;
  outputChannel?.appendLine(`[${timestamp()}] [DEBUG] ${message}`);
}

// src/config/KoreConfig.ts
function parseToml(content) {
  const result = {};
  let currentSection = "_root";
  result[currentSection] = {};
  const lines = content.split("\n");
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();
    if (!line || line.startsWith("#"))
      continue;
    const sectionMatch = line.match(/^\[([a-zA-Z_][\w.-]*)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!result[currentSection])
        result[currentSection] = {};
      continue;
    }
    const kvMatch = line.match(/^([a-zA-Z_][\w]*)\s*=\s*(.+)$/);
    if (!kvMatch)
      continue;
    const key = kvMatch[1];
    let raw = kvMatch[2].trim();
    if (!raw.startsWith('"') && !raw.startsWith("'")) {
      const commentIdx = raw.indexOf("#");
      if (commentIdx > 0)
        raw = raw.substring(0, commentIdx).trim();
    } else {
      const quote = raw[0];
      const closeIdx = raw.indexOf(quote, 1);
      if (closeIdx > 0) {
        const afterQuote = raw.substring(closeIdx + 1).trim();
        if (afterQuote.startsWith("#") || afterQuote === "") {
          raw = raw.substring(0, closeIdx + 1);
        }
      }
    }
    let value;
    if (raw.startsWith('"') && raw.endsWith('"') || raw.startsWith("'") && raw.endsWith("'")) {
      value = raw.slice(1, -1);
    } else if (raw === "true") {
      value = true;
    } else if (raw === "false") {
      value = false;
    } else if (!isNaN(Number(raw)) && raw !== "") {
      value = Number(raw);
    } else {
      value = raw;
    }
    result[currentSection][key] = value;
  }
  return result;
}
var DEFAULTS = {
  paths: {
    services: "src/server/services",
    controllers: "src/client/controllers",
    types: "src/shared/Kore/Types.luau",
    shared: "src/shared"
  },
  require: {
    kore: "game.ReplicatedStorage.Shared.Packages.kore",
    types: ""
  },
  options: {
    autoTemplate: true,
    diagnostics: true,
    snippets: true,
    generateTypes: true,
    prefix: "!",
    debug: false
  }
};
var cachedConfig = null;
var tomlWatcher = null;
var configListeners = [];
var pathResolverRef = null;
function setPathResolver(resolver) {
  pathResolverRef = resolver;
}
function tomlPath() {
  const folders = vscode2.workspace.workspaceFolders;
  if (!folders || folders.length === 0)
    return null;
  return path.join(folders[0].uri.fsPath, "Kore.toml");
}
function koreTomlExists() {
  const p = tomlPath();
  return p !== null && fs.existsSync(p);
}
function readTomlConfig() {
  const p = tomlPath();
  if (!p || !fs.existsSync(p))
    return null;
  try {
    let resolveOption2 = function(key) {
      if (optionsSection[key] !== void 0)
        return optionsSection[key];
      for (const [sectionName, section] of Object.entries(doc)) {
        if (sectionName === "options")
          continue;
        if (section[key] !== void 0 && OPTION_KEYS.has(key)) {
          const label = sectionName === "_root" ? "root level" : `[${sectionName}]`;
          logWarn(`Kore.toml: '${key}' found at ${label} \u2014 move it to [options]`);
          return section[key];
        }
      }
      return void 0;
    };
    var resolveOption = resolveOption2;
    const raw = fs.readFileSync(p, "utf-8");
    const doc = parseToml(raw);
    const pathsSection = doc["paths"] ?? {};
    const requireSection = doc["require"] ?? {};
    const optionsSection = doc["options"] ?? {};
    const OPTION_KEYS = /* @__PURE__ */ new Set(["autoTemplate", "diagnostics", "snippets", "generateTypes", "prefix", "debug"]);
    const resolved = {
      autoTemplate: resolveOption2("autoTemplate"),
      diagnostics: resolveOption2("diagnostics"),
      snippets: resolveOption2("snippets"),
      generateTypes: resolveOption2("generateTypes"),
      prefix: resolveOption2("prefix"),
      debug: resolveOption2("debug")
    };
    return {
      paths: {
        services: String(pathsSection["services"] ?? DEFAULTS.paths.services),
        controllers: String(pathsSection["controllers"] ?? DEFAULTS.paths.controllers),
        types: String(pathsSection["types"] ?? DEFAULTS.paths.types),
        shared: String(pathsSection["shared"] ?? DEFAULTS.paths.shared)
      },
      require: {
        kore: String(requireSection["kore"] ?? DEFAULTS.require.kore),
        types: String(requireSection["types"] ?? DEFAULTS.require.types)
      },
      options: {
        autoTemplate: resolved.autoTemplate !== void 0 ? Boolean(resolved.autoTemplate) : DEFAULTS.options.autoTemplate,
        diagnostics: resolved.diagnostics !== void 0 ? Boolean(resolved.diagnostics) : DEFAULTS.options.diagnostics,
        snippets: resolved.snippets !== void 0 ? Boolean(resolved.snippets) : DEFAULTS.options.snippets,
        generateTypes: resolved.generateTypes !== void 0 ? Boolean(resolved.generateTypes) : DEFAULTS.options.generateTypes,
        prefix: resolved.prefix !== void 0 ? String(resolved.prefix) : DEFAULTS.options.prefix,
        debug: resolved.debug !== void 0 ? Boolean(resolved.debug) : DEFAULTS.options.debug
      }
    };
  } catch (err) {
    logError("Failed to parse Kore.toml", err);
    return null;
  }
}
function getConfig() {
  if (cachedConfig)
    return cachedConfig;
  const tomlConfig = readTomlConfig();
  if (tomlConfig) {
    cachedConfig = tomlConfig;
    return tomlConfig;
  }
  const vs = vscode2.workspace.getConfiguration("kore");
  cachedConfig = {
    paths: {
      services: vs.get("servicesPath", DEFAULTS.paths.services),
      controllers: vs.get("controllersPath", DEFAULTS.paths.controllers),
      types: vs.get("typesOutputPath", DEFAULTS.paths.types),
      shared: vs.get("sharedPath", DEFAULTS.paths.shared)
    },
    require: {
      kore: vs.get("koreRequirePath", DEFAULTS.require.kore),
      types: vs.get("typesRequirePath", DEFAULTS.require.types)
    },
    options: {
      autoTemplate: vs.get("autoTemplate", DEFAULTS.options.autoTemplate),
      diagnostics: vs.get("enableDiagnostics", DEFAULTS.options.diagnostics),
      snippets: vs.get("enableSnippets", DEFAULTS.options.snippets),
      generateTypes: vs.get("generateTypes", DEFAULTS.options.generateTypes),
      prefix: vs.get("triggerPrefix", DEFAULTS.options.prefix),
      debug: vs.get("debug", DEFAULTS.options.debug)
    }
  };
  return cachedConfig;
}
function getTypesRequirePath() {
  const cfg = getConfig();
  if (cfg.require.types) {
    return cfg.require.types;
  }
  if (pathResolverRef) {
    const folders = vscode2.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      const absTypesPath = path.join(folders[0].uri.fsPath, cfg.paths.types);
      const segments = pathResolverRef.resolveSegments(absTypesPath);
      if (segments.length > 0) {
        return `game.${segments.join(".")}`;
      }
    }
  }
  const korePath = cfg.require.kore;
  if (korePath.startsWith('"') || korePath.startsWith("'")) {
    const quote = korePath[0];
    const inner = korePath.slice(1, -1);
    return `${quote}${inner}/Types${quote}`;
  }
  if (korePath.startsWith("@") || korePath.includes("/")) {
    return `"${korePath}/Types"`;
  }
  return `${korePath}.Types`;
}
function invalidateCache() {
  cachedConfig = null;
}
function onConfigChanged(listener) {
  configListeners.push(listener);
}
function startWatching(context) {
  if (tomlWatcher)
    return;
  tomlWatcher = vscode2.workspace.createFileSystemWatcher("**/Kore.toml");
  const handleChange = () => {
    invalidateCache();
    const config = getConfig();
    logInfo("Kore.toml changed \u2014 config reloaded");
    for (const listener of configListeners) {
      listener(config);
    }
  };
  context.subscriptions.push(tomlWatcher);
  context.subscriptions.push(tomlWatcher.onDidChange(handleChange));
  context.subscriptions.push(tomlWatcher.onDidCreate(handleChange));
  context.subscriptions.push(tomlWatcher.onDidDelete(() => {
    invalidateCache();
    logWarn("Kore.toml deleted \u2014 Kore features disabled");
  }));
}
var KORE_TOML_TEMPLATE = `# Kore.toml \u2014 Project configuration for the Kore framework extension
# https://github.com/mrkirdid/kore

[paths]
# Directory containing service modules (relative to workspace root)
services = "src/server/services"
# Directory containing controller modules
controllers = "src/client/controllers"
# Output path for the auto-generated Types.luau
types = "src/shared/Kore/Types.luau"
# Shared code directory (for module indexing)
shared = "src/shared"

[require]
# Luau require expression for the Kore module (inserted into generated code)
# Supports instance paths: game.ReplicatedStorage.Packages.kore
# Supports string aliases: "@Packages/kore"
kore = "game.ReplicatedStorage.Shared.Packages.kore"
# Types require expression (auto-derived from kore path if omitted)
# types = "game.ReplicatedStorage.Shared.Packages.kore.Types"

[options]
# Auto-populate new .luau files with service/controller boilerplate
autoTemplate = true
# Enable Kore diagnostics (name mismatches, unknown deps, etc.)
diagnostics = true
# Enable Kore snippets and prefix commands
snippets = true
# Auto-generate and update Types.luau on service/controller changes
generateTypes = true
# Prefix character for quick-insert commands
prefix = "!"
# Enable debug logging in the Kore output channel
# debug = false
`;
async function createKoreToml() {
  const folders = vscode2.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode2.window.showErrorMessage("Kore: No workspace folder open.");
    return false;
  }
  const root = folders[0].uri.fsPath;
  const dest = path.join(root, "Kore.toml");
  if (fs.existsSync(dest)) {
    vscode2.window.showWarningMessage("Kore: Kore.toml already exists.");
    return false;
  }
  let template = KORE_TOML_TEMPLATE;
  const detected = detectProjectLayout(root);
  if (detected) {
    if (detected.servicesPath) {
      template = template.replace(
        'services = "src/server/services"',
        `services = "${detected.servicesPath}"`
      );
    }
    if (detected.controllersPath) {
      template = template.replace(
        'controllers = "src/client/controllers"',
        `controllers = "${detected.controllersPath}"`
      );
    }
    if (detected.korePath) {
      template = template.replace(
        'kore = "game.ReplicatedStorage.Shared.Packages.kore"',
        `kore = "${detected.korePath}"`
      );
    }
  }
  fs.writeFileSync(dest, template, "utf-8");
  logInfo(`Created Kore.toml at ${dest}`);
  const doc = await vscode2.workspace.openTextDocument(dest);
  await vscode2.window.showTextDocument(doc);
  return true;
}
function detectProjectLayout(root) {
  for (const filename of ["dev.project.json", "default.project.json"]) {
    const projPath = path.join(root, filename);
    if (!fs.existsSync(projPath))
      continue;
    try {
      const proj = JSON.parse(fs.readFileSync(projPath, "utf-8"));
      return detectFromRojoTree(root, proj.tree ?? {});
    } catch {
      continue;
    }
  }
  const common = {};
  if (fs.existsSync(path.join(root, "src/server/services"))) {
    common.servicesPath = "src/server/services";
  } else if (fs.existsSync(path.join(root, "src/ServerScriptService"))) {
    common.servicesPath = "src/ServerScriptService";
  }
  if (fs.existsSync(path.join(root, "src/client/controllers"))) {
    common.controllersPath = "src/client/controllers";
  } else if (fs.existsSync(path.join(root, "src/StarterPlayerScripts"))) {
    common.controllersPath = "src/StarterPlayerScripts";
  }
  return Object.keys(common).length > 0 ? common : null;
}
function detectFromRojoTree(root, tree) {
  const result = {};
  function walk(node, instancePath) {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("$"))
        continue;
      if (typeof value !== "object" || value === null)
        continue;
      const child = value;
      const childPath = [...instancePath, key];
      const fsPath = child["$path"];
      if (fsPath) {
        const fullFsPath = path.join(root, fsPath);
        if (fs.existsSync(fullFsPath) && fs.statSync(fullFsPath).isDirectory()) {
          const normPath = fsPath.replace(/\\/g, "/");
          if (/servi/i.test(key) || /servi/i.test(fsPath)) {
            result.servicesPath = normPath;
          }
          if (/control/i.test(key) || /control/i.test(fsPath)) {
            result.controllersPath = normPath;
          }
        }
        if (/^kore$/i.test(key)) {
          const gamePath = "game." + childPath.join(".");
          result.korePath = gamePath;
        }
      }
      walk(child, childPath);
    }
  }
  walk(tree, []);
  return Object.keys(result).length > 0 ? result : null;
}

// src/providers/CompletionProvider.ts
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var KORE_APIS = [
  { label: "CreateService", detail: "<T>(table: T & {Name}) \u2192 T & ServiceFields", documentation: "Create and register a service with injected Janitor/Log. Preferred method for full IntelliSense.", insertText: 'CreateService({\n	Name = "$1",\n})', kind: vscode3.CompletionItemKind.Method },
  { label: "CreateController", detail: "<T>(table: T & {Name}) \u2192 T & ControllerFields", documentation: "Create and register a controller with injected Janitor/Log (client only). Preferred method for full IntelliSense.", insertText: 'CreateController({\n	Name = "$1",\n})', kind: vscode3.CompletionItemKind.Method },
  { label: "GetService", detail: "(name: string) \u2192 Service", documentation: "Retrieve a registered service by name. Server returns real instance, client returns network proxy.", insertText: 'GetService("$1")', kind: vscode3.CompletionItemKind.Method },
  { label: "GetController", detail: "(name: string) \u2192 Controller", documentation: "Retrieve a registered controller by name (client only).", insertText: 'GetController("$1")', kind: vscode3.CompletionItemKind.Method },
  { label: "Configure", detail: "(config: KoreConfig) \u2192 ()", documentation: 'Configure Kore settings before Start(). Options: Debug, Destroy ("shutdown"|"dynamic"), Log.', insertText: "Configure({\n	$1\n})", kind: vscode3.CompletionItemKind.Method },
  { label: "Start", detail: "() \u2192 Promise", documentation: "Boot Kore framework. Returns Promise that resolves when all Init/Start phases complete.", insertText: "Start()", kind: vscode3.CompletionItemKind.Method },
  { label: "AddService", detail: "(serviceTable) \u2192 ()", documentation: "Manually register a pre-made service. Legacy \u2014 prefer CreateService.", insertText: "AddService($1)", kind: vscode3.CompletionItemKind.Method },
  { label: "AddController", detail: "(controllerTable) \u2192 ()", documentation: "Manually register a pre-made controller. Legacy \u2014 prefer CreateController.", insertText: "AddController($1)", kind: vscode3.CompletionItemKind.Method },
  { label: "DestroyService", detail: "(name: string) \u2192 ()", documentation: 'Dynamically destroy a service. Requires Destroy = "dynamic" config.', insertText: 'DestroyService("$1")', kind: vscode3.CompletionItemKind.Method },
  { label: "DestroyController", detail: "(name: string) \u2192 ()", documentation: 'Dynamically destroy a controller. Requires Destroy = "dynamic" config.', insertText: 'DestroyController("$1")', kind: vscode3.CompletionItemKind.Method },
  { label: "NetEvent", detail: "Symbol", documentation: "Sentinel value for declaring server\u2192client event remotes in Client tables.", insertText: "NetEvent", kind: vscode3.CompletionItemKind.Constant },
  { label: "Signal", detail: "SignalModule", documentation: "Lightweight signal library. Call .new(config?) to create.", insertText: "Signal", kind: vscode3.CompletionItemKind.Module },
  { label: "Promise", detail: "PromiseLib", documentation: "Re-export of evaera/promise.", insertText: "Promise", kind: vscode3.CompletionItemKind.Module },
  { label: "Log", detail: "LogModule", documentation: "Structured tagged logger with levels: Debug, Info, Warn, Error.", insertText: "Log", kind: vscode3.CompletionItemKind.Module },
  { label: "Timer", detail: "TimerModule", documentation: "Debounce, Throttle, Delay, Every, Heartbeat/Stepped/RenderStepped wrappers.", insertText: "Timer", kind: vscode3.CompletionItemKind.Module },
  { label: "Tween", detail: "TweenModule", documentation: "Builder-pattern tween. Chain :Property(), :Duration(), :Easing(), :Play() \u2192 Promise.", insertText: "Tween", kind: vscode3.CompletionItemKind.Module },
  { label: "Curve", detail: "CurveModule", documentation: "Keyframe curve sampler with linear and Catmull-Rom interpolation.", insertText: "Curve", kind: vscode3.CompletionItemKind.Module },
  { label: "Data", detail: "DataModule", documentation: "ProfileStore bridge (server only). Configure, Load, Get, Save, Release.", insertText: "Data", kind: vscode3.CompletionItemKind.Module },
  { label: "Thread", detail: "ThreadModule", documentation: "Weave wrapper for parallel Luau. Pool(count, script), Kernel(actor).", insertText: "Thread", kind: vscode3.CompletionItemKind.Module },
  { label: "Mock", detail: "MockModule", documentation: "Test isolation. Mock.Service(def), Mock.Controller(def) \u2014 no Kore.Start() needed.", insertText: "Mock", kind: vscode3.CompletionItemKind.Module },
  { label: "Janitor", detail: "JanitorModule", documentation: "Cleanup management. Auto-injected into every service/controller.", insertText: "Janitor", kind: vscode3.CompletionItemKind.Module },
  { label: "Fusion", detail: "FusionLib", documentation: "Re-export of elttob/fusion.", insertText: "Fusion", kind: vscode3.CompletionItemKind.Module },
  { label: "Util", detail: "{ Table, String, Math }", documentation: "Utility sub-modules for table, string, and math operations.", insertText: "Util", kind: vscode3.CompletionItemKind.Module },
  { label: "Net", detail: "NetModule", documentation: "Remote networking layer. Middleware, RateLimit, Compression, Batcher.", insertText: "Net", kind: vscode3.CompletionItemKind.Module },
  { label: "Symbol", detail: "(name) \u2192 Symbol", documentation: "Create/retrieve a unique interned sentinel value.", insertText: 'Symbol("$1")', kind: vscode3.CompletionItemKind.Function },
  { label: "Types", detail: "TypesModule", documentation: "Auto-generated type definitions.", insertText: "Types", kind: vscode3.CompletionItemKind.Module }
];
var KORE_SUBMODULE_APIS = {
  Signal: [
    { label: "new", detail: "(config?) \u2192 Signal", documentation: 'Create a new signal.\n\nOptional config:\n```lua\n{ Network = true, Owner = "Server"|"Client"|"Both", RateLimit = { MaxCalls, PerSeconds } }\n```', insertText: "new(${1})", kind: vscode3.CompletionItemKind.Method }
  ],
  Timer: [
    { label: "Debounce", detail: "(fn, seconds) \u2192 (...) \u2192 ()", documentation: "Create a debounced wrapper. Waits `seconds` after the last call before firing.", insertText: "Debounce(${1:fn}, ${2:1})", kind: vscode3.CompletionItemKind.Function },
    { label: "Throttle", detail: "(fn, seconds) \u2192 (...) \u2192 ()", documentation: "Create a throttled wrapper. Fires at most once per `seconds`.", insertText: "Throttle(${1:fn}, ${2:1})", kind: vscode3.CompletionItemKind.Function },
    { label: "Delay", detail: "(seconds, fn) \u2192 CancelFn", documentation: "Fire `fn` once after `seconds` delay. Returns a cancel function.", insertText: "Delay(${1:1}, ${2:fn})", kind: vscode3.CompletionItemKind.Function },
    { label: "Every", detail: "(seconds, fn) \u2192 CancelFn", documentation: "Fire `fn` repeatedly every `seconds`. Returns a cancel function.", insertText: "Every(${1:1}, ${2:fn})", kind: vscode3.CompletionItemKind.Function },
    { label: "Heartbeat", detail: "(fn: (dt) \u2192 ()) \u2192 RBXScriptConnection", documentation: "Connect to RunService.Heartbeat.", insertText: "Heartbeat(${1:fn})", kind: vscode3.CompletionItemKind.Function },
    { label: "Stepped", detail: "(fn: (time, dt) \u2192 ()) \u2192 RBXScriptConnection", documentation: "Connect to RunService.Stepped.", insertText: "Stepped(${1:fn})", kind: vscode3.CompletionItemKind.Function },
    { label: "RenderStepped", detail: "(fn: (dt) \u2192 ()) \u2192 RBXScriptConnection?", documentation: "Connect to RunService.RenderStepped (client only).", insertText: "RenderStepped(${1:fn})", kind: vscode3.CompletionItemKind.Function }
  ],
  Tween: [
    { label: "new", detail: "(instance: Instance) \u2192 TweenBuilder", documentation: "Create a builder-pattern tween.\n\nChain `:Property()`, `:Duration()`, `:Easing()`, `:Play()` \u2192 Promise.", insertText: "new(${1:instance})", kind: vscode3.CompletionItemKind.Method }
  ],
  Curve: [
    { label: "new", detail: "(keyframes: {{t, v}}) \u2192 CurveInstance", documentation: "Create a keyframe curve.\n\nCall `:Sample(t)` for linear or `:SampleSmooth(t)` for Catmull-Rom.", insertText: "new({\n	{ t = ${1:0}, v = ${2:0} },\n	{ t = ${3:1}, v = ${4:1} },\n})", kind: vscode3.CompletionItemKind.Method }
  ],
  Log: [
    { label: "Tagged", detail: "(tag: string) \u2192 TaggedLogger", documentation: "Create a tagged logger. Returns `{ Debug, Info, Warn, Error }` auto-tagged.", insertText: 'Tagged("${1}")', kind: vscode3.CompletionItemKind.Function },
    { label: "Debug", detail: "(tag, message, ...) \u2192 ()", documentation: "Log debug message (only if min level \u2264 Debug).", insertText: 'Debug("${1:tag}", "${2:message}")', kind: vscode3.CompletionItemKind.Function },
    { label: "Info", detail: "(tag, message, ...) \u2192 ()", documentation: "Log info message.", insertText: 'Info("${1:tag}", "${2:message}")', kind: vscode3.CompletionItemKind.Function },
    { label: "Warn", detail: "(tag, message, ...) \u2192 ()", documentation: "Log warning message.", insertText: 'Warn("${1:tag}", "${2:message}")', kind: vscode3.CompletionItemKind.Function },
    { label: "Error", detail: "(tag, message, ...) \u2192 ()", documentation: "Log error message and throw.", insertText: 'Error("${1:tag}", "${2:message}")', kind: vscode3.CompletionItemKind.Function },
    { label: "ErrorNoThrow", detail: "(tag, message, ...) \u2192 ()", documentation: "Log error without throwing.", insertText: 'ErrorNoThrow("${1:tag}", "${2:message}")', kind: vscode3.CompletionItemKind.Function },
    { label: "SetMinLevel", detail: "(level: LogLevel) \u2192 ()", documentation: 'Set minimum log level. Levels: "Debug", "Info", "Warn", "Error".', insertText: 'SetMinLevel("${1|Debug,Info,Warn,Error|}")', kind: vscode3.CompletionItemKind.Function },
    { label: "EnableDebug", detail: "() \u2192 ()", documentation: "Enable debug logging.", insertText: "EnableDebug()", kind: vscode3.CompletionItemKind.Function }
  ],
  Data: [
    { label: "Configure", detail: "(config: DataConfig) \u2192 ()", documentation: "Configure DataStore name and default template.", insertText: 'Configure({\n	StoreName = "${1:PlayerData}",\n	Template = {\n		${2}\n	},\n})', kind: vscode3.CompletionItemKind.Function },
    { label: "Load", detail: "(player: Player) \u2192 Promise<Profile>", documentation: "Load or create a player profile. Returns Promise.", insertText: "Load(${1:player})", kind: vscode3.CompletionItemKind.Function },
    { label: "Get", detail: "(player: Player) \u2192 Profile?", documentation: "Get loaded profile, or nil if not yet loaded.", insertText: "Get(${1:player})", kind: vscode3.CompletionItemKind.Function },
    { label: "OnLoaded", detail: "(player, fn) \u2192 ()", documentation: "Callback when player profile finishes loading.", insertText: "OnLoaded(${1:player}, function(profile)\n	${2}\nend)", kind: vscode3.CompletionItemKind.Function },
    { label: "Save", detail: "(player: Player) \u2192 Promise", documentation: "Force-save player profile.", insertText: "Save(${1:player})", kind: vscode3.CompletionItemKind.Function },
    { label: "Release", detail: "(player: Player) \u2192 ()", documentation: "Release profile session and clean up.", insertText: "Release(${1:player})", kind: vscode3.CompletionItemKind.Function }
  ],
  Thread: [
    { label: "Pool", detail: "(count, workerScript) \u2192 ThreadPool", documentation: "Create a parallel worker pool with `count` actors.\n\nCall `:Dispatch(task, count)` \u2192 Promise or `:DispatchDetached(task, count)`.", insertText: "Pool(${1:16}, ${2:workerScript})", kind: vscode3.CompletionItemKind.Function },
    { label: "Kernel", detail: "(actor: Actor) \u2192 ThreadKernel", documentation: 'Register task handlers on a worker Actor.\n\nChain `:On("task", handler)` then `:Ready()`.', insertText: "Kernel(${1:actor})", kind: vscode3.CompletionItemKind.Function }
  ],
  Mock: [
    { label: "Service", detail: "(definition) \u2192 MockHandle", documentation: "Create a mock service for testing without Kore.Start().", insertText: "Service(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "Controller", detail: "(definition) \u2192 MockHandle", documentation: "Create a mock controller for testing.", insertText: "Controller(${1})", kind: vscode3.CompletionItemKind.Function }
  ],
  Janitor: [
    { label: "new", detail: "() \u2192 Janitor", documentation: "Create a new Janitor for tracking cleanup tasks.\n\nUse `:Add(task, method?)`, `:Cleanup()`, `:Destroy()`.", insertText: "new()", kind: vscode3.CompletionItemKind.Method }
  ],
  Util: [
    { label: "Table", detail: "TableUtils", documentation: "Table utilities: deepCopy, merge, filter, map, find, flatten, etc.", insertText: "Table", kind: vscode3.CompletionItemKind.Module },
    { label: "String", detail: "StringUtils", documentation: "String utilities: trim, split, capitalize, camelize, slugify, etc.", insertText: "String", kind: vscode3.CompletionItemKind.Module },
    { label: "Math", detail: "MathUtils", documentation: "Math utilities: lerp, clamp, round, snap, bezier, damp, etc.", insertText: "Math", kind: vscode3.CompletionItemKind.Module }
  ],
  Net: [
    { label: "SetCompression", detail: "(config) \u2192 ()", documentation: 'Set compression strategy: "None", "Auto", "Aggressive", or custom config.', insertText: 'SetCompression("${1|None,Auto,Aggressive|}")', kind: vscode3.CompletionItemKind.Function }
  ],
  "Util.Table": [
    { label: "deepCopy", detail: "(t: T) \u2192 T", documentation: "Deep copy a table recursively.", insertText: "deepCopy(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "shallowCopy", detail: "(t: T) \u2192 T", documentation: "Shallow copy a table (one level).", insertText: "shallowCopy(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "merge", detail: "(...tables) \u2192 table", documentation: "Merge multiple tables. Later keys overwrite.", insertText: "merge(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "keys", detail: "(t) \u2192 {K}", documentation: "Get all keys of a table.", insertText: "keys(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "values", detail: "(t) \u2192 {V}", documentation: "Get all values of a table.", insertText: "values(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "filter", detail: "(t, predicate) \u2192 {[K]: V}", documentation: "Filter table entries by predicate.", insertText: "filter(${1}, function(${2:value, key})\n	return ${3}\nend)", kind: vscode3.CompletionItemKind.Function },
    { label: "map", detail: "(t, transform) \u2192 {[K]: R}", documentation: "Transform table values.", insertText: "map(${1}, function(${2:value, key})\n	return ${3}\nend)", kind: vscode3.CompletionItemKind.Function },
    { label: "find", detail: "(t, predicate) \u2192 (V?, K?)", documentation: "Find first matching entry.", insertText: "find(${1}, function(${2:value, key})\n	return ${3}\nend)", kind: vscode3.CompletionItemKind.Function },
    { label: "flatten", detail: "(t, depth?) \u2192 {T}", documentation: "Flatten nested arrays.", insertText: "flatten(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "shuffle", detail: "(t) \u2192 {T}", documentation: "Randomly shuffle array (Fisher-Yates).", insertText: "shuffle(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "count", detail: "(t) \u2192 number", documentation: "Count entries (including non-integer keys).", insertText: "count(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "freeze", detail: "(t) \u2192 T", documentation: "Deep freeze a table (immutable).", insertText: "freeze(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "diff", detail: "(a, b) \u2192 {added, removed, changed}", documentation: "Compute differences between two tables.", insertText: "diff(${1}, ${2})", kind: vscode3.CompletionItemKind.Function }
  ],
  "Util.String": [
    { label: "trim", detail: "(s) \u2192 string", documentation: "Trim whitespace from both ends.", insertText: "trim(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "split", detail: "(s, sep) \u2192 {string}", documentation: "Split string by separator.", insertText: 'split(${1}, "${2}")', kind: vscode3.CompletionItemKind.Function },
    { label: "startsWith", detail: "(s, prefix) \u2192 boolean", documentation: "Check if string starts with prefix.", insertText: 'startsWith(${1}, "${2}")', kind: vscode3.CompletionItemKind.Function },
    { label: "endsWith", detail: "(s, suffix) \u2192 boolean", documentation: "Check if string ends with suffix.", insertText: 'endsWith(${1}, "${2}")', kind: vscode3.CompletionItemKind.Function },
    { label: "capitalize", detail: "(s) \u2192 string", documentation: "Capitalize first letter.", insertText: "capitalize(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "truncate", detail: "(s, maxLen, suffix?) \u2192 string", documentation: "Truncate with optional suffix.", insertText: "truncate(${1}, ${2:50})", kind: vscode3.CompletionItemKind.Function },
    { label: "padStart", detail: "(s, len, char?) \u2192 string", documentation: "Pad start to target length.", insertText: "padStart(${1}, ${2:10})", kind: vscode3.CompletionItemKind.Function },
    { label: "padEnd", detail: "(s, len, char?) \u2192 string", documentation: "Pad end to target length.", insertText: "padEnd(${1}, ${2:10})", kind: vscode3.CompletionItemKind.Function },
    { label: "camelize", detail: "(s) \u2192 string", documentation: '"my-var" \u2192 "myVar"', insertText: "camelize(${1})", kind: vscode3.CompletionItemKind.Function },
    { label: "slugify", detail: "(s) \u2192 string", documentation: '"My String" \u2192 "my-string"', insertText: "slugify(${1})", kind: vscode3.CompletionItemKind.Function }
  ],
  "Util.Math": [
    { label: "lerp", detail: "(a, b, t) \u2192 number", documentation: "Linear interpolation.", insertText: "lerp(${1:a}, ${2:b}, ${3:t})", kind: vscode3.CompletionItemKind.Function },
    { label: "clamp", detail: "(value, min, max) \u2192 number", documentation: "Clamp value between min and max.", insertText: "clamp(${1:value}, ${2:min}, ${3:max})", kind: vscode3.CompletionItemKind.Function },
    { label: "round", detail: "(value, decimals?) \u2192 number", documentation: "Round to decimal places.", insertText: "round(${1:value}, ${2:0})", kind: vscode3.CompletionItemKind.Function },
    { label: "map", detail: "(value, inMin, inMax, outMin, outMax) \u2192 number", documentation: "Map value from one range to another.", insertText: "map(${1:value}, ${2:0}, ${3:1}, ${4:0}, ${5:100})", kind: vscode3.CompletionItemKind.Function },
    { label: "snap", detail: "(value, step) \u2192 number", documentation: "Snap to nearest step.", insertText: "snap(${1:value}, ${2:step})", kind: vscode3.CompletionItemKind.Function },
    { label: "sign", detail: "(value) \u2192 number", documentation: "Sign: 1, -1, or 0.", insertText: "sign(${1:value})", kind: vscode3.CompletionItemKind.Function },
    { label: "randomRange", detail: "(min, max) \u2192 number", documentation: "Random float in range.", insertText: "randomRange(${1:min}, ${2:max})", kind: vscode3.CompletionItemKind.Function },
    { label: "approach", detail: "(current, target, step) \u2192 number", documentation: "Move current toward target by step.", insertText: "approach(${1:current}, ${2:target}, ${3:step})", kind: vscode3.CompletionItemKind.Function },
    { label: "damp", detail: "(a, b, smoothing, dt) \u2192 number", documentation: "Frame-rate independent exponential smoothing.", insertText: "damp(${1:a}, ${2:b}, ${3:smoothing}, ${4:dt})", kind: vscode3.CompletionItemKind.Function },
    { label: "bezier", detail: "(t, p0, p1, p2, p3) \u2192 number", documentation: "Cubic B\xE9zier evaluation.", insertText: "bezier(${1:t}, ${2:p0}, ${3:p1}, ${4:p2}, ${5:p3})", kind: vscode3.CompletionItemKind.Function }
  ]
};
var KORE_SUBMODULE_NAMES = new Set(Object.keys(KORE_SUBMODULE_APIS).filter((k) => !k.includes(".")));
function isLuauLspActive() {
  const ext = vscode3.extensions.getExtension("JohnnyMorganz.luau-lsp");
  return ext !== void 0 && ext.isActive;
}
var CompletionProvider = class {
  constructor(moduleIndexer2) {
    this.moduleIndexer = moduleIndexer2;
  }
  provideCompletionItems(document, position, _token, context) {
    const lineText = document.lineAt(position).text;
    const textBefore = lineText.substring(0, position.character);
    const prefixResult = this.tryPrefixCommands(document, position, textBefore);
    if (prefixResult)
      return prefixResult;
    const stringResult = this.tryServiceControllerString(position, textBefore);
    if (stringResult)
      return stringResult;
    if (!isLuauLspActive()) {
      const submoduleResult = this.trySubmoduleDotAccess(position, textBefore);
      if (submoduleResult)
        return submoduleResult;
      const koreDotResult = this.tryKoreDotAccess(position, textBefore);
      if (koreDotResult)
        return koreDotResult;
      const memberResult = this.tryMemberAccess(document, position, textBefore);
      if (memberResult)
        return memberResult;
    }
    return void 0;
  }
  // ===========================================================================
  // Path 1 — Prefix commands (!getservice, !service, !controller, etc.)
  // ===========================================================================
  tryPrefixCommands(document, position, textBefore) {
    const cfg = getConfig();
    const prefix = cfg.options.prefix;
    const prefixRegex = new RegExp(`^(\\s*)${escapeRegex(prefix)}(\\S*)$`);
    const match = prefixRegex.exec(textBefore);
    if (!match)
      return void 0;
    const ws = match[1];
    const typed = match[2].toLowerCase();
    const fullRange = new vscode3.Range(
      new vscode3.Position(position.line, ws.length),
      position
    );
    const items = [];
    if (this.cmdMatch("getservice", typed)) {
      this.addGetServiceItems(items, document, fullRange, prefix, typed);
    }
    if (this.cmdMatch("getcontroller", typed)) {
      this.addGetControllerItems(items, document, fullRange, prefix, typed);
    }
    if (cfg.options.snippets && this.cmdMatch("service", typed) && !typed.startsWith("gets")) {
      this.addServicePreset(items, document, fullRange, prefix);
    }
    if (cfg.options.snippets && this.cmdMatch("controller", typed) && !typed.startsWith("getc")) {
      this.addControllerPreset(items, document, fullRange, prefix);
    }
    if (cfg.options.snippets && this.cmdMatch("preset", typed)) {
      this.addAutoPreset(items, document, fullRange, prefix);
    }
    if (this.cmdMatch("kore", typed) && !typed.startsWith("gets") && !typed.startsWith("getc")) {
      this.addKoreRequireItem(items, document, fullRange, prefix);
    }
    if (this.cmdMatch("require", typed) && !typed.startsWith("gets") && !typed.startsWith("getc")) {
      this.addRequireItems(items, document, position, fullRange, prefix, typed);
    }
    if (items.length === 0)
      return void 0;
    return new vscode3.CompletionList(items, false);
  }
  cmdMatch(command, typed) {
    if (!typed)
      return true;
    return command.startsWith(typed) || typed.startsWith(command);
  }
  addGetServiceItems(items, document, fullRange, prefix, typed) {
    const names = serviceRegistry.getAllNames();
    const isServer = this.classifyFile(document.uri.fsPath) === "service";
    if (names.length > 0) {
      const filtered = typed.length > "getservice".length ? this.fuzzyMatch(names, typed.slice("getservice".length).trim()) : names;
      for (let i = 0; i < filtered.length; i++) {
        const name = filtered[i];
        const typeName = isServer ? name : `${name}Client`;
        const item = new vscode3.CompletionItem(
          `${prefix}getservice \u2192 ${name}`,
          vscode3.CompletionItemKind.Interface
        );
        item.insertText = `local ${name} = Kore.GetService("${name}") :: Types.${typeName}`;
        item.range = fullRange;
        item.detail = "Kore Service";
        item.sortText = `\0a_${String(i).padStart(5, "0")}`;
        item.filterText = `${prefix}getservice ${name}`;
        if (i === 0)
          item.preselect = true;
        const info = serviceRegistry.get(name);
        if (info)
          item.documentation = this.buildServiceDoc(info);
        const edits = this.ensureRequires(document);
        if (edits.length > 0)
          item.additionalTextEdits = edits;
        items.push(item);
      }
    } else {
      const item = new vscode3.CompletionItem(`${prefix}getservice`, vscode3.CompletionItemKind.Interface);
      item.insertText = new vscode3.SnippetString(`local \${1:Service} = Kore.GetService("\${1:Service}")`);
      item.range = fullRange;
      item.detail = "Kore GetService (no services discovered)";
      item.filterText = `${prefix}getservice`;
      item.sortText = "\0a";
      const edits = this.ensureRequires(document);
      if (edits.length > 0)
        item.additionalTextEdits = edits;
      items.push(item);
    }
  }
  addGetControllerItems(items, document, fullRange, prefix, typed) {
    const names = controllerRegistry.getAllNames();
    if (names.length > 0) {
      const filtered = typed.length > "getcontroller".length ? this.fuzzyMatch(names, typed.slice("getcontroller".length).trim()) : names;
      for (let i = 0; i < filtered.length; i++) {
        const name = filtered[i];
        const item = new vscode3.CompletionItem(
          `${prefix}getcontroller \u2192 ${name}`,
          vscode3.CompletionItemKind.Class
        );
        item.insertText = `local ${name} = Kore.GetController("${name}") :: Types.${name}`;
        item.range = fullRange;
        item.detail = "Kore Controller";
        item.sortText = `\0b_${String(i).padStart(5, "0")}`;
        item.filterText = `${prefix}getcontroller ${name}`;
        if (i === 0)
          item.preselect = true;
        const info = controllerRegistry.get(name);
        if (info)
          item.documentation = this.buildControllerDoc(info);
        const edits = this.ensureRequires(document);
        if (edits.length > 0)
          item.additionalTextEdits = edits;
        items.push(item);
      }
    } else {
      const item = new vscode3.CompletionItem(`${prefix}getcontroller`, vscode3.CompletionItemKind.Class);
      item.insertText = new vscode3.SnippetString(`local \${1:Controller} = Kore.GetController("\${1:Controller}")`);
      item.range = fullRange;
      item.detail = "Kore GetController (no controllers discovered)";
      item.filterText = `${prefix}getcontroller`;
      item.sortText = "\0b";
      const edits = this.ensureRequires(document);
      if (edits.length > 0)
        item.additionalTextEdits = edits;
      items.push(item);
    }
  }
  addServicePreset(items, document, fullRange, prefix) {
    const fileName = path2.basename(document.uri.fsPath, ".luau");
    const item = new vscode3.CompletionItem(`${prefix}service \u2014 Service preset`, vscode3.CompletionItemKind.Snippet);
    item.insertText = new vscode3.SnippetString(
      `local \${1:${fileName}} = Kore.CreateService({
	Name = "\${1:${fileName}}",
})

\${1:${fileName}}.Client = {
	\${2:-- Remote methods and Kore.NetEvent declarations}
}

function \${1:${fileName}}:Init(ctx)
	\${3:-- Sync init (no yielding)}
end

function \${1:${fileName}}:Start(ctx)
	\${0:-- Async start (yielding OK)}
end

return \${1:${fileName}}`
    );
    item.range = fullRange;
    item.detail = "Full Kore service with Client table, Init, Start";
    item.filterText = `${prefix}service`;
    item.sortText = "\0c_svc";
    item.documentation = new vscode3.MarkdownString(
      "Creates a full service:\n- `Kore.CreateService` with auto-injected Janitor/Log\n- External Client table for remote methods & events\n- Init(ctx) / Start(ctx) lifecycle with context\n\nKore + Types requires auto-inserted at top."
    );
    const edits = this.ensureRequires(document);
    if (edits.length > 0)
      item.additionalTextEdits = edits;
    items.push(item);
  }
  addControllerPreset(items, document, fullRange, prefix) {
    const fileName = path2.basename(document.uri.fsPath, ".luau");
    const item = new vscode3.CompletionItem(`${prefix}controller \u2014 Controller preset`, vscode3.CompletionItemKind.Snippet);
    item.insertText = new vscode3.SnippetString(
      `local \${1:${fileName}} = Kore.CreateController({
	Name = "\${1:${fileName}}",
})

function \${1:${fileName}}:Init(ctx)
	\${2:-- Sync init (no yielding)}
end

function \${1:${fileName}}:Start(ctx)
	\${0:-- Async start (yielding OK)}
end

return \${1:${fileName}}`
    );
    item.range = fullRange;
    item.detail = "Kore controller with Init, Start";
    item.filterText = `${prefix}controller`;
    item.sortText = "\0c_ctrl";
    item.documentation = new vscode3.MarkdownString(
      "Creates a controller:\n- `Kore.CreateController` with auto-injected Janitor/Log\n- Init(ctx) / Start(ctx) lifecycle with context\n\nKore + Types requires auto-inserted at top."
    );
    const edits = this.ensureRequires(document);
    if (edits.length > 0)
      item.additionalTextEdits = edits;
    items.push(item);
  }
  addAutoPreset(items, document, fullRange, prefix) {
    const fileType = this.classifyFile(document.uri.fsPath);
    if (fileType === "service") {
      this.addServicePreset(items, document, fullRange, prefix);
    } else if (fileType === "controller") {
      this.addControllerPreset(items, document, fullRange, prefix);
    } else {
      const fileName = path2.basename(document.uri.fsPath, ".luau");
      const svcItem = new vscode3.CompletionItem(`${prefix}preset \u2014 Service`, vscode3.CompletionItemKind.Snippet);
      svcItem.insertText = new vscode3.SnippetString(
        `local \${1:${fileName}} = Kore.CreateService({
	Name = "\${1:${fileName}}",
})

\${1:${fileName}}.Client = {
	\${2:-- Remote methods and Kore.NetEvent declarations}
}

function \${1:${fileName}}:Init(ctx)
	\${3:-- Sync init (no yielding)}
end

function \${1:${fileName}}:Start(ctx)
	\${0:-- Async start (yielding OK)}
end

return \${1:${fileName}}`
      );
      svcItem.range = fullRange;
      svcItem.detail = "Full Kore service boilerplate";
      svcItem.filterText = `${prefix}preset service`;
      svcItem.sortText = "\0d_svc";
      const svcEdits = this.ensureRequires(document);
      if (svcEdits.length > 0)
        svcItem.additionalTextEdits = svcEdits;
      items.push(svcItem);
      const ctrlItem = new vscode3.CompletionItem(`${prefix}preset \u2014 Controller`, vscode3.CompletionItemKind.Snippet);
      ctrlItem.insertText = new vscode3.SnippetString(
        `local \${1:${fileName}} = Kore.CreateController({
	Name = "\${1:${fileName}}",
})

function \${1:${fileName}}:Init(ctx)
	\${2:-- Sync init (no yielding)}
end

function \${1:${fileName}}:Start(ctx)
	\${0:-- Async start (yielding OK)}
end

return \${1:${fileName}}`
      );
      ctrlItem.range = fullRange;
      ctrlItem.detail = "Kore controller boilerplate";
      ctrlItem.filterText = `${prefix}preset controller`;
      ctrlItem.sortText = "\0d_ctrl";
      const ctrlEdits = this.ensureRequires(document);
      if (ctrlEdits.length > 0)
        ctrlItem.additionalTextEdits = ctrlEdits;
      items.push(ctrlItem);
    }
  }
  addKoreRequireItem(items, document, fullRange, prefix) {
    const hasKore = this.documentHasKoreRequire(document);
    const item = new vscode3.CompletionItem(
      hasKore ? `${prefix}kore (already required)` : `${prefix}kore \u2014 require`,
      vscode3.CompletionItemKind.Module
    );
    item.insertText = "";
    item.range = fullRange;
    item.filterText = `${prefix}kore`;
    item.sortText = "\0z";
    if (hasKore) {
      item.detail = "Kore is already required in this file";
    } else {
      item.detail = "Insert Kore + Types requires at top";
      item.additionalTextEdits = this.ensureRequires(document);
    }
    items.push(item);
  }
  addRequireItems(items, document, position, fullRange, prefix, typed) {
    const modules = this.moduleIndexer.getModules();
    if (modules.length === 0)
      return;
    const query = typed.length > "require".length ? typed.slice("require".length).trim() : "";
    const cfg = getConfig();
    const maxSuggestions = vscode3.workspace.getConfiguration("kore").get("requireCompletion.maxSuggestions", 25);
    const useDeepest = vscode3.workspace.getConfiguration("kore").get("requireCompletion.useDeepestVariable", true);
    const autoInsertGetService = vscode3.workspace.getConfiguration("kore").get("requireCompletion.autoInsertGetService", true);
    let matchedModules = modules;
    if (query) {
      const lowerQuery = query.toLowerCase();
      matchedModules = modules.filter((m) => m.name.toLowerCase().includes(lowerQuery));
      if (matchedModules.length === 0) {
        const allNames = modules.map((m) => m.name);
        const fuzzyNames = this.fuzzyMatch(allNames, query);
        const nameSet = new Set(fuzzyNames);
        matchedModules = modules.filter((m) => nameSet.has(m.name));
      }
    }
    matchedModules = matchedModules.slice(0, maxSuggestions);
    for (let i = 0; i < matchedModules.length; i++) {
      const mod = matchedModules[i];
      let requireExpr;
      if (useDeepest) {
        const segments = mod.instanceSegments;
        let bestVar = null;
        const limit = Math.min(document.lineCount, 80);
        for (let line = 0; line < limit; line++) {
          const text = document.lineAt(line).text;
          const gsMatch = text.match(/local\s+(\w+)\s*=\s*game:GetService\(\s*["'](\w+)["']\s*\)/);
          if (gsMatch) {
            const varName = gsMatch[1];
            const serviceName = gsMatch[2];
            const idx = segments.indexOf(serviceName);
            if (idx >= 0 && (bestVar === null || idx + 1 > bestVar.depth)) {
              bestVar = { varName, depth: idx + 1 };
            }
          }
        }
        if (bestVar && bestVar.depth < segments.length) {
          requireExpr = bestVar.varName + "." + segments.slice(bestVar.depth).join(".");
        } else {
          requireExpr = mod.instancePath;
        }
      } else {
        requireExpr = mod.instancePath;
      }
      const item = new vscode3.CompletionItem(
        `${prefix}require \u2192 ${mod.name}`,
        mod.isWallyPackage ? vscode3.CompletionItemKind.Module : vscode3.CompletionItemKind.File
      );
      item.insertText = `local ${mod.name} = require(${requireExpr})`;
      item.range = fullRange;
      item.detail = mod.isWallyPackage ? `Wally: ${mod.name}` : mod.relativePath.replace(/\\/g, "/");
      item.sortText = `\0r_${String(i).padStart(5, "0")}`;
      item.filterText = `${prefix}require ${mod.name}`;
      if (i === 0)
        item.preselect = true;
      const md = new vscode3.MarkdownString();
      md.appendMarkdown(`**${mod.name}**

`);
      md.appendCodeblock(`local ${mod.name} = require(${requireExpr})`, "lua");
      md.appendMarkdown(`

Path: \`${mod.instancePath}\``);
      if (mod.isWallyPackage)
        md.appendMarkdown("\n\n*Wally package*");
      item.documentation = md;
      if (autoInsertGetService && requireExpr === mod.instancePath && mod.instanceSegments.length >= 2) {
        const serviceName = mod.instanceSegments[0];
        const hasGetService = this.documentHasGetService(document, serviceName);
        if (!hasGetService) {
          const insertPos = this.findRequireInsertPosition(document);
          item.additionalTextEdits = [
            vscode3.TextEdit.insert(
              new vscode3.Position(insertPos, 0),
              `local ${serviceName} = game:GetService("${serviceName}")
`
            )
          ];
          item.insertText = `local ${mod.name} = require(${serviceName}.${mod.instanceSegments.slice(1).join(".")})`;
        }
      }
      items.push(item);
    }
  }
  documentHasGetService(document, serviceName) {
    const limit = Math.min(document.lineCount, 80);
    const pattern = new RegExp(`local\\s+\\w+\\s*=\\s*game:GetService\\(\\s*["']${escapeRegex(serviceName)}["']\\s*\\)`);
    for (let i = 0; i < limit; i++) {
      if (pattern.test(document.lineAt(i).text))
        return true;
    }
    return false;
  }
  classifyFile(filePath) {
    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;
    const norm2 = filePath.replace(/\\/g, "/");
    if (norm2.includes(`/${servicesPath}/`) || norm2.endsWith(`/${servicesPath}`))
      return "service";
    if (norm2.includes(`/${controllersPath}/`) || norm2.endsWith(`/${controllersPath}`))
      return "controller";
    return null;
  }
  // ===========================================================================
  // Path 2 — Service/controller name inside string literal
  // ===========================================================================
  tryServiceControllerString(position, textBefore) {
    const svcMatch = textBefore.match(/GetService\s*\(\s*["']([^"']*)$/);
    if (svcMatch) {
      return this.buildNameList(svcMatch[1], serviceRegistry.getAllNames(), serviceRegistry, "Service", position);
    }
    const ctrlMatch = textBefore.match(/GetController\s*\(\s*["']([^"']*)$/);
    if (ctrlMatch) {
      return this.buildNameList(ctrlMatch[1], controllerRegistry.getAllNames(), controllerRegistry, "Controller", position);
    }
    return void 0;
  }
  buildNameList(partial, allNames, registry, tag, position) {
    const matched = this.fuzzyMatch(allNames, partial);
    const items = [];
    const replaceStart = new vscode3.Position(position.line, position.character - partial.length);
    const replaceRange = new vscode3.Range(replaceStart, position);
    for (let i = 0; i < matched.length; i++) {
      const name = matched[i];
      const info = registry.get(name);
      const item = new vscode3.CompletionItem(
        name,
        tag === "Service" ? vscode3.CompletionItemKind.Interface : vscode3.CompletionItemKind.Class
      );
      item.insertText = name;
      item.range = replaceRange;
      item.detail = `Kore ${tag}`;
      item.sortText = `\0${String(i).padStart(5, "0")}`;
      if (i === 0)
        item.preselect = true;
      if (info) {
        const md = new vscode3.MarkdownString();
        md.appendMarkdown(`**${name}** (${tag})

`);
        if ("clientMethods" in info) {
          const svc = info;
          if (svc.clientMethods.length > 0) {
            md.appendMarkdown("**Client methods:**\n");
            for (const m of svc.clientMethods)
              md.appendMarkdown(`- \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})\`
`);
          }
          if (svc.netEvents.length > 0) {
            md.appendMarkdown("\n**Events:**\n");
            for (const e of svc.netEvents)
              md.appendMarkdown(`- \`${e.name}\`
`);
          }
        } else {
          const ctrl = info;
          if (ctrl.methods.length > 0) {
            md.appendMarkdown("**Methods:**\n");
            for (const m of ctrl.methods)
              md.appendMarkdown(`- \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})\`
`);
          }
        }
        item.documentation = md;
      }
      items.push(item);
    }
    return new vscode3.CompletionList(items, false);
  }
  // ===========================================================================
  // Path 3 — Kore.SubModule. and Kore.Util.Table. (sub-module completions)
  // ===========================================================================
  trySubmoduleDotAccess(position, textBefore) {
    const deepMatch = textBefore.match(/\bKore\.(\w+)\.(\w+)\.(\w*)$/);
    if (deepMatch) {
      const key = `${deepMatch[1]}.${deepMatch[2]}`;
      const apis = KORE_SUBMODULE_APIS[key];
      if (apis) {
        return this.buildApiList(apis, deepMatch[3], position);
      }
    }
    const subMatch = textBefore.match(/\bKore\.(\w+)\.(\w*)$/);
    if (subMatch && KORE_SUBMODULE_NAMES.has(subMatch[1])) {
      const apis = KORE_SUBMODULE_APIS[subMatch[1]];
      if (apis) {
        return this.buildApiList(apis, subMatch[2], position);
      }
    }
    return void 0;
  }
  buildApiList(apis, partialRaw, position) {
    const partial = partialRaw.toLowerCase();
    const replaceStart = new vscode3.Position(position.line, position.character - partialRaw.length);
    const replaceRange = new vscode3.Range(replaceStart, position);
    const filtered = partial ? apis.filter((a) => a.label.toLowerCase().startsWith(partial) || a.label.toLowerCase().includes(partial)) : apis;
    const items = [];
    for (let i = 0; i < filtered.length; i++) {
      const api = filtered[i];
      const item = new vscode3.CompletionItem(api.label, api.kind);
      item.insertText = api.insertText.includes("$") ? new vscode3.SnippetString(api.insertText) : api.insertText;
      item.detail = api.detail;
      item.documentation = new vscode3.MarkdownString(api.documentation);
      item.range = replaceRange;
      item.sortText = `\0${String(i).padStart(5, "0")}`;
      if (i === 0)
        item.preselect = true;
      items.push(item);
    }
    return new vscode3.CompletionList(items, false);
  }
  // ===========================================================================
  // Path 4 — Kore. dot-access (top-level API)
  // ===========================================================================
  tryKoreDotAccess(position, textBefore) {
    const dotMatch = textBefore.match(/\bKore\.(\w*)$/);
    if (!dotMatch)
      return void 0;
    return this.buildApiList(KORE_APIS, dotMatch[1], position);
  }
  // ===========================================================================
  // Path 5 — Member access on service/controller variables
  // ===========================================================================
  tryMemberAccess(document, position, textBefore) {
    const dotMatch = textBefore.match(/\b(\w+)\.(\w*)$/);
    if (!dotMatch)
      return void 0;
    const varName = dotMatch[1];
    if (varName === "Kore")
      return void 0;
    const partial = dotMatch[2].toLowerCase();
    const binding = this.findKoreBinding(document, position.line, varName);
    if (!binding)
      return void 0;
    const replaceStart = new vscode3.Position(position.line, position.character - dotMatch[2].length);
    const replaceRange = new vscode3.Range(replaceStart, position);
    const items = [];
    if (binding.kind === "service") {
      const info = serviceRegistry.get(binding.targetName);
      if (!info)
        return void 0;
      this.addServiceMemberItems(items, info, partial, replaceRange, document);
    } else {
      const info = controllerRegistry.get(binding.targetName);
      if (!info)
        return void 0;
      this.addControllerMemberItems(items, info, partial, replaceRange);
    }
    if (items.length === 0)
      return void 0;
    return new vscode3.CompletionList(items, false);
  }
  addServiceMemberItems(items, info, partial, range, document) {
    let idx = 0;
    const isServer = this.classifyFile(document.uri.fsPath) === "service";
    if (isServer) {
      for (const m of info.methods) {
        if (partial && !m.name.toLowerCase().includes(partial))
          continue;
        const item = new vscode3.CompletionItem(m.name, vscode3.CompletionItemKind.Method);
        item.detail = `(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})${m.returnType ? ` \u2192 ${m.returnType}` : ""}`;
        item.documentation = new vscode3.MarkdownString(`Server method on **${info.name}**`);
        item.range = range;
        item.sortText = `\0${String(idx++).padStart(5, "0")}`;
        items.push(item);
      }
      for (const m of info.clientMethods) {
        if (partial && !m.name.toLowerCase().includes(partial))
          continue;
        const item = new vscode3.CompletionItem(m.name, vscode3.CompletionItemKind.Method);
        item.detail = `Client: (${["player", ...m.params.map((p) => `${p.name}: ${p.type}`)].join(", ")})`;
        item.documentation = new vscode3.MarkdownString(`Client method on **${info.name}**`);
        item.range = range;
        item.sortText = `\0${String(idx++).padStart(5, "0")}`;
        items.push(item);
      }
      for (const evt of info.netEvents) {
        if (partial && !evt.name.toLowerCase().includes(partial))
          continue;
        const item = new vscode3.CompletionItem(evt.name, vscode3.CompletionItemKind.Event);
        item.detail = "NetEvent";
        item.documentation = new vscode3.MarkdownString(`Server\u2192client event on **${info.name}**.

Fire with \`self:FireClient("${evt.name}", player, ...)\` or \`self:FireAllClients("${evt.name}", ...)\``);
        item.range = range;
        item.sortText = `\0${String(idx++).padStart(5, "0")}`;
        items.push(item);
      }
    } else {
      for (const m of info.clientMethods) {
        if (partial && !m.name.toLowerCase().includes(partial))
          continue;
        const item = new vscode3.CompletionItem(m.name, vscode3.CompletionItemKind.Method);
        item.detail = `(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")}) \u2192 Promise`;
        item.documentation = new vscode3.MarkdownString(`Remote method on **${info.name}** \u2014 returns Promise.`);
        item.range = range;
        item.sortText = `\0${String(idx++).padStart(5, "0")}`;
        items.push(item);
      }
      for (const evt of info.netEvents) {
        if (partial && !evt.name.toLowerCase().includes(partial))
          continue;
        const item = new vscode3.CompletionItem(evt.name, vscode3.CompletionItemKind.Event);
        item.detail = "RemoteEvent signal";
        item.documentation = new vscode3.MarkdownString(`NetEvent on **${info.name}**.

\`:Connect(fn)\`, \`:Once(fn)\`, \`:Wait()\``);
        item.range = range;
        item.sortText = `\0${String(idx++).padStart(5, "0")}`;
        items.push(item);
      }
    }
  }
  addControllerMemberItems(items, info, partial, range) {
    let idx = 0;
    for (const m of info.methods) {
      if (partial && !m.name.toLowerCase().includes(partial))
        continue;
      const item = new vscode3.CompletionItem(m.name, vscode3.CompletionItemKind.Method);
      item.detail = `(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})${m.returnType ? ` \u2192 ${m.returnType}` : ""}`;
      item.documentation = new vscode3.MarkdownString(`Method on **${info.name}**`);
      item.range = range;
      item.sortText = `\0${String(idx++).padStart(5, "0")}`;
      items.push(item);
    }
  }
  findKoreBinding(document, beforeLine, varName) {
    const svcPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]GetService\\s*\\(\\s*["']([^"']+)["']\\s*\\)`
    );
    const ctrlPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]GetController\\s*\\(\\s*["']([^"']+)["']\\s*\\)`
    );
    const createSvcPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]CreateService\\s*\\(`
    );
    const createCtrlPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]CreateController\\s*\\(`
    );
    const limit = Math.min(document.lineCount, beforeLine);
    for (let i = limit - 1; i >= 0; i--) {
      const line = document.lineAt(i).text;
      const sm = svcPattern.exec(line);
      if (sm)
        return { varName, kind: "service", targetName: sm[1] };
      const cm = ctrlPattern.exec(line);
      if (cm)
        return { varName, kind: "controller", targetName: cm[1] };
      if (createSvcPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name)
          return { varName, kind: "service", targetName: name };
      }
      if (createCtrlPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name)
          return { varName, kind: "controller", targetName: name };
      }
    }
    return null;
  }
  findNameInCreateCall(document, startLine) {
    const scanLimit = Math.min(document.lineCount, startLine + 10);
    for (let j = startLine; j < scanLimit; j++) {
      const nameMatch = document.lineAt(j).text.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch)
        return nameMatch[1];
      if (/\}\s*\)/.test(document.lineAt(j).text))
        break;
    }
    return null;
  }
  // ===========================================================================
  // Fuzzy matching
  // ===========================================================================
  fuzzyMatch(names, query) {
    if (!query)
      return names;
    const lower = query.toLowerCase();
    const prefix = names.filter((n) => n.toLowerCase().startsWith(lower));
    const sub = names.filter((n) => n.toLowerCase().includes(lower) && !n.toLowerCase().startsWith(lower));
    if (prefix.length > 0 || sub.length > 0) {
      return [...prefix.sort((a, b) => a.length - b.length), ...sub.sort((a, b) => a.length - b.length)];
    }
    const config = vscode3.workspace.getConfiguration("kore");
    const threshold = config.get("fuzzyThreshold", 0.4);
    const matcher = new FuzzyMatcher(names, threshold);
    return matcher.search(query).map((r) => r.name);
  }
  // ===========================================================================
  // Kore require helpers
  // ===========================================================================
  documentHasKoreRequire(document) {
    const limit = Math.min(document.lineCount, 80);
    for (let i = 0; i < limit; i++) {
      if (/local\s+Kore\s*=\s*require\b/.test(document.lineAt(i).text))
        return true;
    }
    return false;
  }
  documentHasTypesRequire(document) {
    const limit = Math.min(document.lineCount, 80);
    for (let i = 0; i < limit; i++) {
      if (/local\s+Types\s*=\s*require\b/.test(document.lineAt(i).text))
        return true;
    }
    return false;
  }
  /**
   * Build text edits that insert both Kore and Types requires (in correct order) at the
   * right position. Uses the Kore.toml `require.kore` path. Types path is derived from it.
   */
  ensureRequires(document) {
    const cfg = getConfig();
    const korePath = cfg.require.kore;
    const typesPath = getTypesRequirePath();
    const edits = [];
    const needsKore = !this.documentHasKoreRequire(document);
    const needsTypes = !this.documentHasTypesRequire(document);
    if (!needsKore && !needsTypes)
      return edits;
    const insertLine = this.findRequireInsertPosition(document);
    let insertText = "";
    if (needsKore) {
      insertText += `local Kore = require(${korePath})
`;
    }
    if (needsTypes) {
      insertText += `local Types = require(${typesPath})
`;
    }
    edits.push(vscode3.TextEdit.insert(new vscode3.Position(insertLine, 0), insertText));
    return edits;
  }
  findRequireInsertPosition(document) {
    let lastRequireLine = -1;
    let afterComments = 0;
    let passedComments = false;
    const limit = Math.min(document.lineCount, 60);
    for (let i = 0; i < limit; i++) {
      const line = document.lineAt(i).text.trim();
      if (line === "" || line.startsWith("--")) {
        if (!passedComments)
          afterComments = i + 1;
        continue;
      }
      passedComments = true;
      if (/^local\s+\w+\s*=\s*(game:GetService|require)\b/.test(line)) {
        lastRequireLine = i;
        continue;
      }
      break;
    }
    return lastRequireLine >= 0 ? lastRequireLine + 1 : afterComments;
  }
  // ===========================================================================
  // Documentation builders
  // ===========================================================================
  buildServiceDoc(info) {
    const md = new vscode3.MarkdownString();
    md.appendMarkdown(`**${info.name}** (Service)

`);
    if (info.clientMethods.length > 0) {
      md.appendMarkdown("**Client methods:**\n");
      for (const m of info.clientMethods)
        md.appendMarkdown(`- \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})\`
`);
    }
    if (info.netEvents.length > 0) {
      md.appendMarkdown("\n**Events:**\n");
      for (const e of info.netEvents)
        md.appendMarkdown(`- \`${e.name}\`
`);
    }
    return md;
  }
  buildControllerDoc(info) {
    const md = new vscode3.MarkdownString();
    md.appendMarkdown(`**${info.name}** (Controller)

`);
    if (info.methods.length > 0) {
      md.appendMarkdown("**Methods:**\n");
      for (const m of info.methods)
        md.appendMarkdown(`- \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})\`
`);
    }
    return md;
  }
};

// src/providers/DiagnosticProvider.ts
var vscode4 = __toESM(require("vscode"));
var path3 = __toESM(require("path"));

// src/parser/LuauAST.ts
function extractName(source) {
  const match = source.match(/Name\s*=\s*["']([^"']+)["']/);
  return match ? match[1] : null;
}
function extractDependencies(source) {
  const match = source.match(/Dependencies\s*=\s*\{([^}]*)\}/);
  if (!match)
    return [];
  const deps = [];
  const entries = match[1].matchAll(/["']([^"']+)["']/g);
  for (const entry of entries) {
    deps.push(entry[1]);
  }
  return deps;
}
function parseParams(paramsStr) {
  if (!paramsStr.trim())
    return [];
  return paramsStr.split(",").map((p) => {
    const trimmed = p.trim();
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx >= 0) {
      return { name: trimmed.substring(0, colonIdx).trim(), type: trimmed.substring(colonIdx + 1).trim() };
    }
    return { name: trimmed, type: "any" };
  }).filter((p) => p.name.length > 0);
}
function extractReturnType(source, afterIndex) {
  const rest = source.substring(afterIndex);
  const rtMatch = rest.match(/^\s*:\s*(\S[^\n]*?)\s*(?:\n|$)/);
  return rtMatch ? rtMatch[1].trim() : null;
}
function extractFunctions(source, excludeRange) {
  const functions = [];
  const pattern1 = /(\w+)\s*=\s*function\s*\(([^)]*)\)/g;
  let match;
  while ((match = pattern1.exec(source)) !== null) {
    if (excludeRange && match.index >= excludeRange.start && match.index < excludeRange.end)
      continue;
    const name = match[1];
    const params = parseParams(match[2]);
    const afterParen = match.index + match[0].length;
    const declaredReturn = extractReturnType(source, afterParen);
    const bodyStart = declaredReturn ? source.indexOf("\n", afterParen) + 1 : afterParen;
    const bodyEnd = findMatchingEnd(source, afterParen);
    const body = source.substring(bodyStart, bodyEnd);
    const hasReturn = /\breturn\b/.test(body);
    const returnType = declaredReturn || (hasReturn ? "any" : null);
    const line = source.substring(0, match.index).split("\n").length;
    functions.push({ name, params, body, line, hasReturn, returnType });
  }
  const pattern2 = /function\s+\w+:(\w+)\s*\(([^)]*)\)/g;
  while ((match = pattern2.exec(source)) !== null) {
    if (excludeRange && match.index >= excludeRange.start && match.index < excludeRange.end)
      continue;
    const name = match[1];
    const params = parseParams(match[2]);
    const afterParen = match.index + match[0].length;
    const declaredReturn = extractReturnType(source, afterParen);
    const bodyStart = declaredReturn ? source.indexOf("\n", afterParen) + 1 : afterParen;
    const bodyEnd = findMatchingEnd(source, afterParen);
    const body = source.substring(bodyStart, bodyEnd);
    const hasReturn = /\breturn\b/.test(body);
    const returnType = declaredReturn || (hasReturn ? "any" : null);
    const line = source.substring(0, match.index).split("\n").length;
    functions.push({ name, params, body, line, hasReturn, returnType });
  }
  const pattern3 = /function\s+\w+\.(\w+)\s*\(([^)]*)\)/g;
  while ((match = pattern3.exec(source)) !== null) {
    if (excludeRange && match.index >= excludeRange.start && match.index < excludeRange.end)
      continue;
    const name = match[1];
    const fullMatch = source.substring(Math.max(0, match.index - 20), match.index + match[0].length);
    if (/\.Client\./.test(fullMatch))
      continue;
    const params = parseParams(match[2]);
    const afterParen = match.index + match[0].length;
    const declaredReturn = extractReturnType(source, afterParen);
    const bodyStart = declaredReturn ? source.indexOf("\n", afterParen) + 1 : afterParen;
    const bodyEnd = findMatchingEnd(source, afterParen);
    const body = source.substring(bodyStart, bodyEnd);
    const hasReturn = /\breturn\b/.test(body);
    const returnType = declaredReturn || (hasReturn ? "any" : null);
    const line = source.substring(0, match.index).split("\n").length;
    functions.push({ name, params, body, line, hasReturn, returnType });
  }
  return functions;
}
function extractClientTable(source) {
  const candidates = [];
  const externalPattern = /\w+\.Client\s*=\s*\{/g;
  let m;
  while ((m = externalPattern.exec(source)) !== null) {
    const braceIndex = source.indexOf("{", m.index);
    if (braceIndex === -1)
      continue;
    const end = findMatchingBrace(source, braceIndex);
    if (end === -1)
      continue;
    candidates.push({
      content: source.substring(braceIndex + 1, end),
      start: braceIndex,
      end: end + 1,
      external: true
    });
  }
  const inlinePattern = /(?:^|[\s,])Client\s*=\s*\{/gm;
  while ((m = inlinePattern.exec(source)) !== null) {
    const braceIndex = source.indexOf("{", m.index);
    if (braceIndex === -1)
      continue;
    const end = findMatchingBrace(source, braceIndex);
    if (end === -1)
      continue;
    const overlaps = candidates.some((c) => c.external && braceIndex >= c.start && braceIndex < c.end);
    if (overlaps)
      continue;
    candidates.push({
      content: source.substring(braceIndex + 1, end),
      start: braceIndex,
      end: end + 1,
      external: false
    });
  }
  if (candidates.length === 0)
    return null;
  const externals = candidates.filter((c) => c.external);
  if (externals.length > 0) {
    externals.sort((a, b) => b.content.length - a.content.length);
    return externals[0];
  }
  candidates.sort((a, b) => b.content.length - a.content.length);
  return candidates[0];
}
function extractNetEvents(clientSource) {
  const events = [];
  const pattern = /(\w+)\s*=\s*Kore\.NetEvent/g;
  let match;
  while ((match = pattern.exec(clientSource)) !== null) {
    events.push(match[1]);
  }
  return events;
}
function extractMiddleware(clientSource) {
  const result = [];
  const mwMatch = clientSource.match(/Middleware\s*=\s*\{/);
  if (!mwMatch || mwMatch.index === void 0)
    return result;
  const start = mwMatch.index + mwMatch[0].length;
  const end = findMatchingBrace(clientSource, start - 1);
  if (end === -1)
    return result;
  const mwContent = clientSource.substring(start, end);
  const entryPattern = /(\w+)\s*=\s*\{([^}]*)\}/g;
  let match;
  while ((match = entryPattern.exec(mwContent)) !== null) {
    result.push({
      name: match[1],
      hasInbound: /Inbound/.test(match[2]),
      hasOutbound: /Outbound/.test(match[2])
    });
  }
  return result;
}
function extractRateLimits(clientSource) {
  const result = [];
  const rlMatch = clientSource.match(/RateLimit\s*=\s*\{/);
  if (!rlMatch || rlMatch.index === void 0)
    return result;
  const start = rlMatch.index + rlMatch[0].length;
  const end = findMatchingBrace(clientSource, start - 1);
  if (end === -1)
    return result;
  const rlContent = clientSource.substring(start, end);
  const entryPattern = /(\w+)\s*=\s*\{\s*MaxCalls\s*=\s*(\d+)\s*,\s*PerSeconds\s*=\s*(\d+)\s*\}/g;
  let match;
  while ((match = entryPattern.exec(rlContent)) !== null) {
    result.push({
      name: match[1],
      maxCalls: parseInt(match[2], 10),
      perSeconds: parseInt(match[3], 10)
    });
  }
  return result;
}
function extractBatching(clientSource) {
  return /Batching\s*=\s*true/.test(clientSource);
}
function findMatchingBrace(source, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    if (source[i] === "{")
      depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0)
        return i;
    }
  }
  return -1;
}
function findMatchingEnd(source, startIndex) {
  let depth = 1;
  const keywords = /\b(function|if|for|while|repeat|do)\b|\bend\b/g;
  keywords.lastIndex = startIndex;
  let match;
  while ((match = keywords.exec(source)) !== null) {
    if (match[0] === "end") {
      depth--;
      if (depth === 0)
        return match.index;
    } else {
      depth++;
    }
  }
  return source.length;
}

// src/providers/DiagnosticProvider.ts
var DIAGNOSTIC_SOURCE = "Kore";
var DiagnosticProvider = class {
  constructor() {
    this.diagnosticCollection = vscode4.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
  }
  update(document) {
    const cfg = getConfig();
    if (!cfg.options.diagnostics) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }
    const diagnostics = [];
    const source = document.getText();
    const filePath = document.uri.fsPath;
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;
    const normFilePath = filePath.replace(/\\/g, "/");
    const isService = normFilePath.includes(`/${servicesPath}/`) || normFilePath.endsWith(`/${servicesPath}`);
    const isController = normFilePath.includes(`/${controllersPath}/`) || normFilePath.endsWith(`/${controllersPath}`);
    if (isService) {
      this.checkService(document, source, filePath, diagnostics);
    } else if (isController) {
      this.checkController(document, source, filePath, diagnostics);
    }
    this.checkGetServiceCalls(document, source, diagnostics);
    this.checkGetControllerCalls(document, source, diagnostics);
    this.diagnosticCollection.set(document.uri, diagnostics);
    logDebug(`Diagnostics: ${diagnostics.length} issue(s) in ${path3.basename(filePath)} (service=${isService}, controller=${isController})`);
  }
  checkService(document, source, filePath, diagnostics) {
    const name = extractName(source);
    if (!name)
      return;
    const fileName = path3.basename(filePath, ".luau");
    if (name !== fileName) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== void 0) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode4.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode4.Diagnostic(
          range,
          `Service.Name "${name}" does not match filename "${fileName}"`,
          vscode4.DiagnosticSeverity.Warning
        ));
      }
    }
    const existing = serviceRegistry.get(name);
    if (existing && existing.filePath !== filePath) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== void 0) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode4.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode4.Diagnostic(
          range,
          `Duplicate service Name "${name}" \u2014 also defined in ${path3.basename(existing.filePath)}`,
          vscode4.DiagnosticSeverity.Error
        ));
      }
    }
    const deps = extractDependencies(source);
    const allServiceNames = serviceRegistry.getAllNames();
    const matcher = new FuzzyMatcher(allServiceNames);
    for (const dep of deps) {
      if (!serviceRegistry.has(dep)) {
        const depMatch = new RegExp(`["']${this.escapeRegex(dep)}["']`).exec(source);
        if (depMatch && depMatch.index !== void 0) {
          const pos = document.positionAt(depMatch.index);
          const range = new vscode4.Range(pos, pos.translate(0, depMatch[0].length));
          let message = `Dependencies entry "${dep}" is not a known service name`;
          const suggestions = matcher.search(dep);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }
          diagnostics.push(new vscode4.Diagnostic(range, message, vscode4.DiagnosticSeverity.Warning));
        }
      }
    }
    const clientResult = extractClientTable(source);
    if (clientResult) {
      const clientSource = clientResult.content;
      const clientFunctions = extractFunctions(clientSource);
      const clientMethodNames = new Set(clientFunctions.map((f) => f.name));
      const middleware = extractMiddleware(clientSource);
      for (const mw of middleware) {
        if (!clientMethodNames.has(mw.name)) {
          diagnostics.push(this.createSimpleDiagnostic(
            document,
            source,
            mw.name,
            `Middleware key "${mw.name}" has no matching Client method`,
            vscode4.DiagnosticSeverity.Warning
          ));
        }
      }
      const rateLimits = extractRateLimits(clientSource);
      for (const rl of rateLimits) {
        if (!clientMethodNames.has(rl.name)) {
          diagnostics.push(this.createSimpleDiagnostic(
            document,
            source,
            rl.name,
            `RateLimit key "${rl.name}" has no matching Client method`,
            vscode4.DiagnosticSeverity.Warning
          ));
        }
      }
    }
    const netEventOutside = source.match(/Kore\.NetEvent/g);
    if (netEventOutside && !clientResult) {
      diagnostics.push(this.createSimpleDiagnostic(
        document,
        source,
        "Kore.NetEvent",
        "Kore.NetEvent used outside the Client table",
        vscode4.DiagnosticSeverity.Warning
      ));
    }
  }
  checkController(document, source, filePath, diagnostics) {
    const name = extractName(source);
    if (!name)
      return;
    const fileName = path3.basename(filePath, ".luau");
    if (name !== fileName) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== void 0) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode4.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode4.Diagnostic(
          range,
          `Controller.Name "${name}" does not match filename "${fileName}"`,
          vscode4.DiagnosticSeverity.Warning
        ));
      }
    }
    const existing = controllerRegistry.get(name);
    if (existing && existing.filePath !== filePath) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== void 0) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode4.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode4.Diagnostic(
          range,
          `Duplicate controller Name "${name}" \u2014 also defined in ${path3.basename(existing.filePath)}`,
          vscode4.DiagnosticSeverity.Error
        ));
      }
    }
    const deps = extractDependencies(source);
    const allNames = [...controllerRegistry.getAllNames(), ...serviceRegistry.getAllNames()];
    const matcher = new FuzzyMatcher(allNames);
    for (const dep of deps) {
      if (!controllerRegistry.has(dep) && !serviceRegistry.has(dep)) {
        const depMatch = new RegExp(`["']${this.escapeRegex(dep)}["']`).exec(source);
        if (depMatch && depMatch.index !== void 0) {
          const pos = document.positionAt(depMatch.index);
          const range = new vscode4.Range(pos, pos.translate(0, depMatch[0].length));
          let message = `Dependencies entry "${dep}" is not a known name`;
          const suggestions = matcher.search(dep);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }
          diagnostics.push(new vscode4.Diagnostic(range, message, vscode4.DiagnosticSeverity.Warning));
        }
      }
    }
  }
  checkGetServiceCalls(document, source, diagnostics) {
    const pattern = /Kore[.:]+GetService\s*\(\s*["']([^"']+)["']\s*\)/g;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const name = match[1];
      if (!serviceRegistry.has(name)) {
        const pos = document.positionAt(match.index);
        const range = new vscode4.Range(pos, pos.translate(0, match[0].length));
        let message = `Kore.GetService called with unknown name "${name}"`;
        const allNames = serviceRegistry.getAllNames();
        if (allNames.length > 0) {
          const matcher = new FuzzyMatcher(allNames);
          const suggestions = matcher.search(name);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }
        }
        diagnostics.push(new vscode4.Diagnostic(range, message, vscode4.DiagnosticSeverity.Warning));
      }
    }
  }
  checkGetControllerCalls(document, source, diagnostics) {
    const pattern = /Kore[.:]+GetController\s*\(\s*["']([^"']+)["']\s*\)/g;
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const name = match[1];
      if (!controllerRegistry.has(name)) {
        const pos = document.positionAt(match.index);
        const range = new vscode4.Range(pos, pos.translate(0, match[0].length));
        let message = `Kore.GetController called with unknown name "${name}"`;
        const allNames = controllerRegistry.getAllNames();
        if (allNames.length > 0) {
          const matcher = new FuzzyMatcher(allNames);
          const suggestions = matcher.search(name);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }
        }
        diagnostics.push(new vscode4.Diagnostic(range, message, vscode4.DiagnosticSeverity.Warning));
      }
    }
  }
  createSimpleDiagnostic(document, source, searchText, message, severity) {
    const index = source.indexOf(searchText);
    if (index >= 0) {
      const pos = document.positionAt(index);
      const range = new vscode4.Range(pos, pos.translate(0, searchText.length));
      return new vscode4.Diagnostic(range, message, severity);
    }
    return new vscode4.Diagnostic(new vscode4.Range(0, 0, 0, 0), message, severity);
  }
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  dispose() {
    this.diagnosticCollection.dispose();
  }
};

// src/providers/HoverProvider.ts
var vscode5 = __toESM(require("vscode"));
function escapeRegex2(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var KORE_API_DOCS = {
  "CreateService": "```lua\nKore.CreateService(table: T & { Name: string }) \u2192 T & ServiceFields\n```\nCreate and register a service. Injects `Janitor`, `Log`, `FireClient`, `FireAllClients`. Preferred over AddService for full IntelliSense.",
  "CreateController": "```lua\nKore.CreateController(table: T & { Name: string }) \u2192 T & ControllerFields\n```\nCreate and register a controller (client only). Injects `Janitor`, `Log`. Preferred over AddController for full IntelliSense.",
  "Configure": '```lua\nKore.Configure(config: KoreConfig) \u2192 ()\n```\nConfigure Kore settings before Start(). Options: `Debug`, `Destroy` ("shutdown"|"dynamic"), `Log`.',
  "Start": "```lua\nKore.Start() \u2192 Promise\n```\nBoot Kore. Resolves dependencies, runs Init (sync, in order) then Start (async, parallel). Returns Promise.",
  "AddService": "```lua\nKore.AddService(serviceTable) \u2192 ()\n```\nManually register a pre-made service. Legacy \u2014 prefer `CreateService`.",
  "AddController": "```lua\nKore.AddController(controllerTable) \u2192 ()\n```\nManually register a pre-made controller. Legacy \u2014 prefer `CreateController`.",
  "GetService": "```lua\nKore.GetService(name: string) \u2192 Service | ServiceClient\n```\nRetrieve a service by name. Server returns real instance, client returns typed network proxy.",
  "GetController": "```lua\nKore.GetController(name: string) \u2192 Controller\n```\nRetrieve a controller by name (client only). Returns deferred proxy during Init phase.",
  "DestroyService": '```lua\nKore.DestroyService(name: string) \u2192 ()\n```\nDynamic destroy (requires `Destroy = "dynamic"`). Calls Destroy(), cleans Janitor, removes remotes.',
  "DestroyController": '```lua\nKore.DestroyController(name: string) \u2192 ()\n```\nDynamic destroy (requires `Destroy = "dynamic"`). Calls Destroy(), cleans Janitor.',
  "NetEvent": "```lua\nKore.NetEvent :: Symbol\n```\nSentinel value for declaring server\u2192client event remotes in Client tables.\n\n```lua\nClient = { MyEvent = Kore.NetEvent }\n```",
  "Signal": "```lua\nKore.Signal\n```\nSignal library. Use `Kore.Signal.new(config?)` to create.\n\nConfig: `{ Network, Owner, RateLimit }`",
  "Promise": "```lua\nKore.Promise\n```\nRe-export of evaera/promise. Full Promise/A+ implementation.",
  "Log": "```lua\nKore.Log\n```\nStructured logger. `.Tagged(name)`, `.Debug()`, `.Info()`, `.Warn()`, `.Error()`, `.SetMinLevel()`",
  "Timer": "```lua\nKore.Timer\n```\n`.Debounce(fn, t)`, `.Throttle(fn, t)`, `.Delay(t, fn)`, `.Every(t, fn)`, `.Heartbeat(fn)`, `.Stepped(fn)`, `.RenderStepped(fn)`",
  "Tween": "```lua\nKore.Tween.new(instance) \u2192 TweenBuilder\n```\nBuilder-pattern tween. Chain `:Property()`, `:Duration()`, `:Easing()`, `:Play()` \u2192 Promise.",
  "Curve": "```lua\nKore.Curve.new(keyframes) \u2192 CurveInstance\n```\nKeyframe curve sampler. `:Sample(t)` for linear, `:SampleSmooth(t)` for Catmull-Rom.",
  "Data": "```lua\nKore.Data\n```\nProfileStore bridge (server only). `.Configure()`, `.Load()`, `.Get()`, `.OnLoaded()`, `.Save()`, `.Release()`",
  "Thread": "```lua\nKore.Thread\n```\nWeave wrapper for parallel Luau. `.Pool(count, script)` \u2192 ThreadPool, `.Kernel(actor)` \u2192 ThreadKernel.",
  "Mock": "```lua\nKore.Mock\n```\nTest isolation. `.Service(def)`, `.Controller(def)` \u2014 test without Kore.Start().\n\nMockHandle: `:Init()`, `:Start()`, `:Inject()`, `:Get()`, `:Destroy()`",
  "Janitor": "```lua\nKore.Janitor.new() \u2192 Janitor\n```\nCleanup management. `:Add(task, method?)`, `:Cleanup()`, `:Destroy()`.\n\nAuto-injected into every service/controller.",
  "Fusion": "```lua\nKore.Fusion\n```\nRe-export of elttob/fusion.",
  "Util": "```lua\nKore.Util\n```\nUtility modules:\n- `Util.Table` \u2014 deepCopy, merge, filter, map, find, flatten, etc.\n- `Util.String` \u2014 trim, split, capitalize, camelize, slugify, etc.\n- `Util.Math` \u2014 lerp, clamp, round, snap, bezier, damp, etc.",
  "Symbol": "```lua\nKore.Symbol(name: string) \u2192 Symbol\n```\nCreate/retrieve a unique interned sentinel value.",
  "Net": "```lua\nKore.Net\n```\nRemote networking layer. `.SetCompression()`, `.SetupServerRemotes()`, `.CreateClientProxy()`.\n\nMiddleware, RateLimit, Compression, Batching.",
  "Types": "```lua\nKore.Types\n```\nAuto-generated type definitions module (managed by the VS Code extension)."
};
var KORE_SUBMODULE_DOCS = {
  Signal: {
    "new": '```lua\nKore.Signal.new(config?) \u2192 Signal\n```\nCreate a new signal.\n\nOptional config: `{ Network = true, Owner = "Server"|"Client"|"Both", RateLimit = { MaxCalls, PerSeconds } }`\n\nMethods: `:Connect(fn)`, `:Once(fn)`, `:Wait()`, `:Fire(...)`, `:FireClient(player, ...)`, `:FireAllClients(...)`, `:DisconnectAll()`, `:Destroy()`'
  },
  Timer: {
    "Debounce": "```lua\nKore.Timer.Debounce(fn, seconds) \u2192 (...) \u2192 ()\n```\nCreate a debounced wrapper. Waits `seconds` after the last call before firing.",
    "Throttle": "```lua\nKore.Timer.Throttle(fn, seconds) \u2192 (...) \u2192 ()\n```\nCreate a throttled wrapper. Fires at most once per `seconds`.",
    "Delay": "```lua\nKore.Timer.Delay(seconds, fn) \u2192 CancelFn\n```\nFire `fn` once after `seconds` delay. Returns a cancel function.",
    "Every": "```lua\nKore.Timer.Every(seconds, fn) \u2192 CancelFn\n```\nFire `fn` repeatedly every `seconds`. Returns a cancel function.",
    "Heartbeat": "```lua\nKore.Timer.Heartbeat(fn: (dt) \u2192 ()) \u2192 RBXScriptConnection\n```\nConnect to RunService.Heartbeat.",
    "Stepped": "```lua\nKore.Timer.Stepped(fn: (time, dt) \u2192 ()) \u2192 RBXScriptConnection\n```\nConnect to RunService.Stepped.",
    "RenderStepped": "```lua\nKore.Timer.RenderStepped(fn: (dt) \u2192 ()) \u2192 RBXScriptConnection?\n```\nConnect to RunService.RenderStepped (client only)."
  },
  Tween: {
    "new": "```lua\nKore.Tween.new(instance: Instance) \u2192 TweenBuilder\n```\nCreate a builder-pattern tween.\n\nChain: `:Property(name, value)`, `:Duration(secs)`, `:Easing(style, dir)`, `:RepeatCount(n)`, `:Reverses(bool)`, `:DelayTime(secs)`, `:Play()` \u2192 Promise"
  },
  Curve: {
    "new": "```lua\nKore.Curve.new(keyframes: {{ t: number, v: number }}) \u2192 CurveInstance\n```\nCreate a keyframe curve.\n\n`:Sample(t)` \u2014 linear interpolation\n`:SampleSmooth(t)` \u2014 Catmull-Rom cubic (needs \u22654 keyframes)"
  },
  Log: {
    "Tagged": "```lua\nKore.Log.Tagged(tag: string) \u2192 TaggedLogger\n```\nCreate a tagged logger. Returns `{ Debug, Info, Warn, Error }` functions auto-tagged with the given name.",
    "Debug": "```lua\nKore.Log.Debug(tag, message, ...) \u2192 ()\n```\nLog debug message (only if min level \u2264 Debug).",
    "Info": "```lua\nKore.Log.Info(tag, message, ...) \u2192 ()\n```\nLog info message.",
    "Warn": "```lua\nKore.Log.Warn(tag, message, ...) \u2192 ()\n```\nLog warning message.",
    "Error": "```lua\nKore.Log.Error(tag, message, ...) \u2192 ()\n```\nLog error message and throw.",
    "ErrorNoThrow": "```lua\nKore.Log.ErrorNoThrow(tag, message, ...) \u2192 ()\n```\nLog error without throwing.",
    "SetMinLevel": '```lua\nKore.Log.SetMinLevel(level: "Debug"|"Info"|"Warn"|"Error") \u2192 ()\n```\nSet minimum log level.',
    "EnableDebug": "```lua\nKore.Log.EnableDebug() \u2192 ()\n```\nEnable debug logging (sets min level to Debug)."
  },
  Data: {
    "Configure": "```lua\nKore.Data.Configure(config: { StoreName: string?, Template: { [string]: any }? }) \u2192 ()\n```\nConfigure DataStore name and default player data template.",
    "Load": "```lua\nKore.Data.Load(player: Player) \u2192 Promise<Profile>\n```\nLoad (or create) a player profile.",
    "Get": "```lua\nKore.Data.Get(player: Player) \u2192 Profile?\n```\nGet loaded profile, or nil if not yet loaded.",
    "OnLoaded": "```lua\nKore.Data.OnLoaded(player: Player, fn: (Profile) \u2192 ()) \u2192 ()\n```\nCallback when the player's profile finishes loading.",
    "Save": "```lua\nKore.Data.Save(player: Player) \u2192 Promise\n```\nForce-save player profile.",
    "Release": "```lua\nKore.Data.Release(player: Player) \u2192 ()\n```\nRelease profile session and clean up."
  },
  Thread: {
    "Pool": "```lua\nKore.Thread.Pool(count: number, workerScript: ModuleScript) \u2192 ThreadPool\n```\nCreate a parallel worker pool.\n\n`:Dispatch(task, count)` \u2192 Promise\n`:DispatchDetached(task, count)`\n`:Destroy()`",
    "Kernel": "```lua\nKore.Thread.Kernel(actor: Actor) \u2192 ThreadKernel\n```\nRegister task handlers on a worker Actor.\n\n`:On(task, handler)` (chainable)\n`:OnDetached(task, handler)`\n`:Ready()`"
  },
  Mock: {
    "Service": "```lua\nKore.Mock.Service(definition) \u2192 MockHandle\n```\nCreate test mock. Methods: `:Init()`, `:Start()`, `:Inject(name, impl)`, `:Get()`, `:Destroy()`",
    "Controller": "```lua\nKore.Mock.Controller(definition) \u2192 MockHandle\n```\nCreate test mock controller."
  },
  Janitor: {
    "new": "```lua\nKore.Janitor.new() \u2192 Janitor\n```\nCreate a new Janitor.\n\n`:Add(task, method?)` \u2014 track\n`:Remove(index)`\n`:Cleanup()` \u2014 clean all (LIFO)\n`:Destroy()` \u2014 alias for Cleanup"
  },
  Net: {
    "SetCompression": '```lua\nKore.Net.SetCompression(config: "None"|"Auto"|"Aggressive"|CompressionConfig) \u2192 ()\n```\nSet compression strategy for network payloads.'
  },
  Util: {
    "Table": "```lua\nKore.Util.Table\n```\n`deepCopy`, `shallowCopy`, `merge`, `keys`, `values`, `filter`, `map`, `find`, `flatten`, `shuffle`, `count`, `freeze`, `diff`",
    "String": "```lua\nKore.Util.String\n```\n`trim`, `split`, `startsWith`, `endsWith`, `capitalize`, `truncate`, `padStart`, `padEnd`, `camelize`, `slugify`",
    "Math": "```lua\nKore.Util.Math\n```\n`lerp`, `clamp`, `round`, `map`, `snap`, `sign`, `randomRange`, `approach`, `damp`, `bezier`"
  }
};
var HoverProvider = class {
  provideHover(document, position, _token) {
    const range = document.getWordRangeAtPosition(position, /[\w.]+/);
    if (!range)
      return null;
    const word = document.getText(range);
    const line = document.lineAt(position).text;
    const getServiceMatch = line.match(/GetService\s*\(\s*["']([^"']+)["']\s*\)/);
    if (getServiceMatch) {
      const name = getServiceMatch[1];
      const info = serviceRegistry.get(name);
      if (info)
        return new vscode5.Hover(this.buildServiceMarkdown(info), range);
    }
    const getControllerMatch = line.match(/GetController\s*\(\s*["']([^"']+)["']\s*\)/);
    if (getControllerMatch) {
      const name = getControllerMatch[1];
      const info = controllerRegistry.get(name);
      if (info)
        return new vscode5.Hover(this.buildControllerMarkdown(info), range);
    }
    const deepApiMatch = word.match(/^Kore\.(\w+)\.(\w+)\.(\w+)$/);
    if (deepApiMatch) {
      const key = `${deepApiMatch[1]}.${deepApiMatch[2]}`;
    }
    const subApiMatch = word.match(/^Kore\.(\w+)\.(\w+)$/);
    if (subApiMatch) {
      const moduleName = subApiMatch[1];
      const methodName = subApiMatch[2];
      const moduleDocs = KORE_SUBMODULE_DOCS[moduleName];
      if (moduleDocs) {
        const doc = moduleDocs[methodName];
        if (doc)
          return new vscode5.Hover(new vscode5.MarkdownString(doc), range);
      }
    }
    const koreApiMatch = word.match(/^Kore\.(\w+)$/);
    if (koreApiMatch) {
      const apiName = koreApiMatch[1];
      const doc = KORE_API_DOCS[apiName];
      if (doc)
        return new vscode5.Hover(new vscode5.MarkdownString(doc), range);
    }
    const dotMemberMatch = word.match(/^(\w+)\.(\w+)$/);
    if (dotMemberMatch) {
      const varName = dotMemberMatch[1];
      const memberName = dotMemberMatch[2];
      if (varName !== "Kore") {
        const binding = this.findKoreBinding(document, position.line, varName);
        if (binding) {
          if (binding.kind === "service") {
            const info = serviceRegistry.get(binding.targetName);
            if (info) {
              const hover = this.buildMemberHover(info, memberName);
              if (hover)
                return new vscode5.Hover(hover, range);
            }
          } else {
            const info = controllerRegistry.get(binding.targetName);
            if (info) {
              const method = info.methods.find((m) => m.name === memberName);
              if (method) {
                const md = new vscode5.MarkdownString();
                md.appendMarkdown(`**${info.name}.${method.name}**

`);
                md.appendCodeblock(`(${method.params.map((p) => `${p.name}: ${p.type}`).join(", ")})${method.returnType ? ` \u2192 ${method.returnType}` : ""}`, "lua");
                return new vscode5.Hover(md, range);
              }
            }
          }
        }
      }
    }
    return null;
  }
  buildServiceMarkdown(info) {
    const md = new vscode5.MarkdownString();
    md.appendMarkdown(`### ${info.name}

`);
    if (info.methods.length > 0) {
      md.appendMarkdown(`**Server methods:**
${info.methods.map((m) => `- \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})\``).join("\n")}

`);
    }
    const clientMethods = info.clientMethods.map((m) => `- \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})\``).join("\n");
    md.appendMarkdown(`**Client methods:**
${clientMethods || "(none)"}

`);
    const events = info.netEvents.map((e) => `- \`${e.name}\` (RemoteEvent)`).join("\n");
    if (events)
      md.appendMarkdown(`**Events:**
${events}
`);
    if (info.hasBatching)
      md.appendMarkdown(`
*Batching enabled*
`);
    return md;
  }
  buildControllerMarkdown(info) {
    const methods = info.methods.map((m) => `- \`${m.name}(${m.params.map((p) => `${p.name}: ${p.type}`).join(", ")})\``).join("\n");
    const md = new vscode5.MarkdownString();
    md.appendMarkdown(`### ${info.name}

`);
    md.appendMarkdown(`**Methods:**
${methods || "(none)"}
`);
    return md;
  }
  buildMemberHover(info, memberName) {
    const clientMethod = info.clientMethods.find((m) => m.name === memberName);
    if (clientMethod) {
      const md = new vscode5.MarkdownString();
      const isRemoteFunction = clientMethod.returnType !== null;
      md.appendMarkdown(`**${info.name}.${clientMethod.name}** \u2014 ${isRemoteFunction ? "RemoteFunction" : "RemoteEvent"}

`);
      md.appendCodeblock(`(${clientMethod.params.map((p) => `${p.name}: ${p.type}`).join(", ")}) \u2192 ${isRemoteFunction ? `Promise<${clientMethod.returnType}>` : "Promise<void>"}`, "lua");
      return md;
    }
    const netEvent = info.netEvents.find((e) => e.name === memberName);
    if (netEvent) {
      const md = new vscode5.MarkdownString();
      md.appendMarkdown(`**${info.name}.${netEvent.name}** \u2014 NetEvent (RemoteEvent)

`);
      md.appendMarkdown(`Server-to-client event signal.

`);
      md.appendCodeblock(`:Connect(function(...) end)
:Once(function(...) end)
:Wait()`, "lua");
      return md;
    }
    const serverMethod = info.methods.find((m) => m.name === memberName);
    if (serverMethod) {
      const md = new vscode5.MarkdownString();
      md.appendMarkdown(`**${info.name}.${serverMethod.name}** \u2014 Server method

`);
      md.appendCodeblock(`(${serverMethod.params.map((p) => `${p.name}: ${p.type}`).join(", ")})${serverMethod.returnType ? ` \u2192 ${serverMethod.returnType}` : ""}`, "lua");
      return md;
    }
    return null;
  }
  findKoreBinding(document, beforeLine, varName) {
    const svcPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex2(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]GetService\\s*\\(\\s*["']([^"']+)["']\\s*\\)`
    );
    const ctrlPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex2(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]GetController\\s*\\(\\s*["']([^"']+)["']\\s*\\)`
    );
    const createSvcPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex2(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]CreateService\\s*\\(`
    );
    const createCtrlPattern = new RegExp(
      `^\\s*local\\s+${escapeRegex2(varName)}\\s*=\\s*(?:\\w+\\.)*(?:Kore)?[.:]CreateController\\s*\\(`
    );
    const limit = Math.min(document.lineCount, beforeLine);
    for (let i = limit - 1; i >= 0; i--) {
      const line = document.lineAt(i).text;
      const sm = svcPattern.exec(line);
      if (sm)
        return { kind: "service", targetName: sm[1] };
      const cm = ctrlPattern.exec(line);
      if (cm)
        return { kind: "controller", targetName: cm[1] };
      if (createSvcPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name)
          return { kind: "service", targetName: name };
      }
      if (createCtrlPattern.test(line)) {
        const name = this.findNameInCreateCall(document, i);
        if (name)
          return { kind: "controller", targetName: name };
      }
    }
    return null;
  }
  findNameInCreateCall(document, startLine) {
    const scanLimit = Math.min(document.lineCount, startLine + 10);
    for (let j = startLine; j < scanLimit; j++) {
      const nameMatch = document.lineAt(j).text.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch)
        return nameMatch[1];
      if (/\}\s*\)/.test(document.lineAt(j).text))
        break;
    }
    return null;
  }
};

// src/providers/CodeActionProvider.ts
var vscode6 = __toESM(require("vscode"));
var DIAGNOSTIC_SOURCE2 = "Kore";
var KoreCodeActionProvider = class {
  provideCodeActions(document, range, context) {
    const actions = [];
    for (const diag of context.diagnostics) {
      if (diag.source !== DIAGNOSTIC_SOURCE2)
        continue;
      const didYouMean = diag.message.match(/Did you mean "([^"]+)"\?/);
      if (didYouMean) {
        const suggestion = didYouMean[1];
        const action = new vscode6.CodeAction(
          `Replace with "${suggestion}"`,
          vscode6.CodeActionKind.QuickFix
        );
        const edit = new vscode6.WorkspaceEdit();
        const diagText = document.getText(diag.range);
        const quoteMatch = diagText.match(/["']([^"']+)["']/);
        if (quoteMatch && quoteMatch.index !== void 0) {
          const quoteStart = diag.range.start.translate(0, quoteMatch.index + 1);
          const quoteEnd = quoteStart.translate(0, quoteMatch[1].length);
          edit.replace(document.uri, new vscode6.Range(quoteStart, quoteEnd), suggestion);
        } else {
          edit.replace(document.uri, diag.range, diagText.replace(/["'][^"']+["']/, `"${suggestion}"`));
        }
        action.edit = edit;
        action.diagnostics = [diag];
        action.isPreferred = true;
        actions.push(action);
      }
      const nameMismatch = diag.message.match(/\.Name "([^"]+)" does not match filename "([^"]+)"/);
      if (nameMismatch) {
        const currentName = nameMismatch[1];
        const fileName = nameMismatch[2];
        const fixAction = new vscode6.CodeAction(
          `Rename to "${fileName}" (match filename)`,
          vscode6.CodeActionKind.QuickFix
        );
        const edit = new vscode6.WorkspaceEdit();
        const diagText = document.getText(diag.range);
        edit.replace(
          document.uri,
          diag.range,
          diagText.replace(`"${currentName}"`, `"${fileName}"`).replace(`'${currentName}'`, `'${fileName}'`)
        );
        fixAction.edit = edit;
        fixAction.diagnostics = [diag];
        fixAction.isPreferred = true;
        actions.push(fixAction);
      }
    }
    return actions;
  }
};

// src/watcher/FileWatcher.ts
var vscode8 = __toESM(require("vscode"));
var path5 = __toESM(require("path"));
var fs3 = __toESM(require("fs"));

// src/parser/ServiceParser.ts
function parseService(source, filePath) {
  const name = extractName(source);
  if (!name)
    return null;
  const dependencies = extractDependencies(source);
  const clientResult = extractClientTable(source);
  const clientExclude = clientResult ? { start: clientResult.start, end: clientResult.end } : void 0;
  const allFunctions = extractFunctions(source, clientExclude);
  const lifecycleNames = /* @__PURE__ */ new Set(["Init", "Start", "Destroy"]);
  const methods = [];
  const seenMethods = /* @__PURE__ */ new Set();
  for (const fn of allFunctions) {
    if (lifecycleNames.has(fn.name))
      continue;
    if (seenMethods.has(fn.name))
      continue;
    seenMethods.add(fn.name);
    const params = fn.params.filter((p) => p.name !== "self");
    methods.push({
      name: fn.name,
      params,
      returnType: fn.returnType
    });
  }
  const clientMethods = [];
  const netEvents = [];
  let middleware = [];
  let rateLimits = [];
  let hasBatching = false;
  if (clientResult) {
    const clientSource = clientResult.content;
    const clientFunctions = extractFunctions(clientSource);
    for (const fn of clientFunctions) {
      if (fn.name === "Middleware" || fn.name === "RateLimit")
        continue;
      const params = fn.params.filter((p) => p.name !== "self" && p.name !== "player");
      clientMethods.push({
        name: fn.name,
        params,
        returnType: fn.returnType
      });
    }
    const events = extractNetEvents(clientSource);
    for (const eventName of events) {
      netEvents.push({ name: eventName });
    }
    const mws = extractMiddleware(clientSource);
    middleware = mws.map((mw) => ({
      remoteName: mw.name,
      hasInbound: mw.hasInbound,
      hasOutbound: mw.hasOutbound
    }));
    const rls = extractRateLimits(clientSource);
    rateLimits = rls.map((rl) => ({
      remoteName: rl.name,
      maxCalls: rl.maxCalls,
      perSeconds: rl.perSeconds
    }));
    hasBatching = extractBatching(clientSource);
  }
  return {
    name,
    filePath,
    methods,
    clientMethods,
    netEvents,
    middleware,
    rateLimits,
    dependencies,
    hasBatching,
    config: null
  };
}

// src/parser/ControllerParser.ts
function parseController(source, filePath) {
  const name = extractName(source);
  if (!name)
    return null;
  const dependencies = extractDependencies(source);
  const allFunctions = extractFunctions(source);
  const lifecycleNames = /* @__PURE__ */ new Set(["Init", "Start", "Destroy"]);
  const methods = [];
  for (const fn of allFunctions) {
    if (lifecycleNames.has(fn.name))
      continue;
    const params = fn.params.filter((p) => p.name !== "self");
    methods.push({
      name: fn.name,
      params,
      returnType: fn.returnType
    });
  }
  return {
    name,
    filePath,
    methods,
    dependencies,
    config: null
  };
}

// src/codegen/TypesWriter.ts
var vscode7 = __toESM(require("vscode"));
var path4 = __toESM(require("path"));
var fs2 = __toESM(require("fs"));

// src/codegen/TypesGenerator.ts
function formatParams(params) {
  if (params.length === 0)
    return "";
  return params.map((p) => `${p.name}: ${p.type}`).join(", ");
}
function generateServiceType(service) {
  const lines = [];
  lines.push(`export type ${service.name} = {`);
  lines.push("	Name: string,");
  lines.push("	Janitor: Janitor,");
  lines.push("	Log: TaggedLogger,");
  for (const method of service.methods) {
    const params = formatParams(method.params);
    const ret = method.returnType ? method.returnType : "()";
    lines.push(`	${method.name}: (${params}) -> ${ret},`);
  }
  for (const method of service.clientMethods) {
    const params = formatParams(method.params);
    const ret = method.returnType ? method.returnType : "()";
    lines.push(`	${method.name}: (${params}) -> ${ret},`);
  }
  if (service.netEvents.length > 0) {
    lines.push("	FireClient: ((self: any, eventName: string, player: Player, ...any) -> ())?,");
    lines.push("	FireAllClients: ((self: any, eventName: string, ...any) -> ())?,");
  }
  lines.push("}");
  return lines.join("\n");
}
function generateServiceClientType(service) {
  const lines = [];
  lines.push(`export type ${service.name}Client = {`);
  for (const method of service.clientMethods) {
    const params = formatParams(method.params);
    const ret = method.returnType ? `Promise<${method.returnType}>` : "Promise<nil>";
    lines.push(`	${method.name}: (${params}) -> ${ret},`);
  }
  for (const event of service.netEvents) {
    lines.push(`	${event.name}: ClientEventProxy,`);
  }
  lines.push("}");
  return lines.join("\n");
}
function generateControllerType(controller) {
  const lines = [];
  lines.push(`export type ${controller.name} = {`);
  lines.push("	Name: string,");
  lines.push("	Janitor: Janitor,");
  lines.push("	Log: TaggedLogger,");
  for (const method of controller.methods) {
    const params = formatParams(method.params);
    const ret = method.returnType ? method.returnType : "()";
    lines.push(`	${method.name}: (${params}) -> ${ret},`);
  }
  lines.push("}");
  return lines.join("\n");
}
var FRAMEWORK_TYPES = `-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Symbol
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A unique, interned sentinel value identified by name.
export type Symbol = {
	_name: string,
	_isSymbol: true,
}

--- Constructor: \`Symbol(name) -> Symbol\`
export type SymbolConstructor = (name: string) -> Symbol

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Log
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A tag-scoped logger instance returned by \`Log.Tagged(tag)\`.
export type TaggedLogger = {
	Debug: (message: string, ...any) -> (),
	Info: (message: string, ...any) -> (),
	Warn: (message: string, ...any) -> (),
	Error: (message: string, ...any) -> (),
	ErrorNoThrow: (message: string, ...any) -> (),
}

--- Valid log level names.
export type LogLevel = "Debug" | "Info" | "Warn" | "Error"

--- The static Log module.
export type LogModule = {
	SetMinLevel: (level: LogLevel) -> (),
	EnableDebug: () -> (),
	Debug: (tag: string, message: string, ...any) -> (),
	Info: (tag: string, message: string, ...any) -> (),
	Warn: (tag: string, message: string, ...any) -> (),
	Error: (tag: string, message: string, ...any) -> (),
	ErrorNoThrow: (tag: string, message: string, ...any) -> (),
	Tagged: (tag: string) -> TaggedLogger,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Signal
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A single signal connection handle.
export type SignalConnection = {
	Disconnect: (self: SignalConnection) -> (),
}

--- Configuration passed to \`Signal.new()\` for optional networking.
export type SignalConfig = {
	--- Enable networking for this signal.
	Network: boolean?,
	--- Who owns (fires) the signal: \`"Server"\`, \`"Client"\`, or \`"Both"\`.
	Owner: ("Server" | "Client" | "Both")?,
	--- Optional rate-limit config for networked signals.
	RateLimit: RateLimitConfig?,
}

--- A Kore Signal instance. Local by default, optionally networked.
export type Signal<T...> = {
	Connect: (self: Signal<T...>, fn: (T...) -> ()) -> SignalConnection,
	ConnectNet: (self: Signal<T...>, fn: (T...) -> ()) -> SignalConnection,
	Once: (self: Signal<T...>, fn: (T...) -> ()) -> SignalConnection,
	Wait: (self: Signal<T...>) -> T...,
	Fire: (self: Signal<T...>, T...) -> (),
	FireClient: (self: Signal<T...>, player: Player, T...) -> (),
	FireAllClients: (self: Signal<T...>, T...) -> (),
	DisconnectAll: (self: Signal<T...>) -> (),
	Destroy: (self: Signal<T...>) -> (),
}

--- The static Signal module.
export type SignalModule = {
	new: <T...>(config: SignalConfig?) -> Signal<T...>,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Janitor
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A task entry stored by the Janitor.
export type JanitorTask = {
	task: any,
	method: string,
}

--- A Janitor instance for deterministic cleanup.
export type Janitor = {
	Add: <T>(self: Janitor, task: T, methodName: string?, index: any?) -> T,
	Remove: (self: Janitor, index: any) -> (),
	Cleanup: (self: Janitor) -> (),
	Destroy: (self: Janitor) -> (),
}

--- The static Janitor module.
export type JanitorModule = {
	new: () -> Janitor,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Timer
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A cancel function returned by \`Timer.Delay\` and \`Timer.Every\`.
export type CancelFn = () -> ()

--- The static Timer module.
export type TimerModule = {
	--- Returns a debounced version of \`fn\` that waits \`t\` seconds after the last call.
	Debounce: <T...>(fn: (T...) -> (), t: number) -> (T...) -> (),
	--- Returns a throttled version of \`fn\` that fires at most once per \`t\` seconds.
	Throttle: <T...>(fn: (T...) -> (), t: number) -> (T...) -> (),
	--- Calls \`fn\` after \`t\` seconds. Returns a cancel function.
	Delay: (t: number, fn: () -> ()) -> CancelFn,
	--- Calls \`fn\` every \`t\` seconds. Returns a cancel function.
	Every: (t: number, fn: () -> ()) -> CancelFn,
	--- Connects to \`RunService.Heartbeat\`.
	Heartbeat: (fn: (deltaTime: number) -> ()) -> RBXScriptConnection,
	--- Connects to \`RunService.Stepped\`.
	Stepped: (fn: (time: number, deltaTime: number) -> ()) -> RBXScriptConnection,
	--- Connects to \`RunService.RenderStepped\` (client only).
	RenderStepped: (fn: (deltaTime: number) -> ()) -> RBXScriptConnection?,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Tween
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A Tween builder instance for animating instance properties.
export type TweenBuilder = {
	--- Set a property to tween. Chainable.
	Property: (self: TweenBuilder, name: string, value: any) -> TweenBuilder,
	--- Set the tween duration in seconds. Chainable.
	Duration: (self: TweenBuilder, t: number) -> TweenBuilder,
	--- Set the easing style and optional direction. Chainable.
	Easing: (
		self: TweenBuilder,
		style: string | Enum.EasingStyle,
		direction: (string | Enum.EasingDirection)?
	) -> TweenBuilder,
	--- Set the repeat count. Chainable.
	RepeatCount: (self: TweenBuilder, count: number) -> TweenBuilder,
	--- Set whether the tween reverses. Chainable.
	Reverses: (self: TweenBuilder, reverses: boolean) -> TweenBuilder,
	--- Set delay before the tween starts. Chainable.
	DelayTime: (self: TweenBuilder, t: number) -> TweenBuilder,
	--- Play the tween and return a Promise that resolves on completion.
	Play: (self: TweenBuilder) -> any, -- Promise<void>
	--- Cancel the tween (no-op if not playing).
	Cancel: (self: TweenBuilder) -> (),
}

--- The static Tween module.
export type TweenModule = {
	new: (instance: Instance) -> TweenBuilder,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Curve
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A single keyframe in a curve.
export type Keyframe = {
	--- Time position of this keyframe (0\\u20131 or any range).
	t: number,
	--- Value at this keyframe.
	v: number,
}

--- A keyframe curve sampler for animation, VFX, and time-based values.
export type CurveInstance = {
	--- Sample the curve with linear interpolation.
	Sample: (self: CurveInstance, t: number) -> number,
	--- Sample the curve with Catmull-Rom cubic interpolation (requires >= 4 keyframes).
	SampleSmooth: (self: CurveInstance, t: number) -> number,
}

--- The static Curve module.
export type CurveModule = {
	new: (keyframes: { Keyframe }) -> CurveInstance,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Data (ProfileStore bridge)
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- Configuration for \`Data.Configure()\`.
export type DataConfig = {
	--- The DataStore name. Default: \`"PlayerData"\`.
	StoreName: string?,
	--- The default data template table.
	Template: { [string]: any }?,
}

--- A loaded player profile from ProfileStore.
export type Profile = {
	Data: { [string]: any },
	Save: (self: Profile) -> (),
	EndSession: (self: Profile) -> (),
	AddUserId: (self: Profile, userId: number) -> (),
	Reconcile: (self: Profile) -> (),
	OnSessionEnd: RBXScriptSignal,
}

--- The static Data module (server-only).
export type DataModule = {
	Configure: (config: DataConfig) -> (),
	Load: (player: Player) -> any, -- Promise<Profile>
	Get: (player: Player) -> Profile?,
	OnLoaded: (player: Player, fn: (profile: Profile) -> ()) -> (),
	Save: (player: Player) -> any, -- Promise<void>
	Release: (player: Player) -> (),
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Thread (Weave wrapper)
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A dispatcher-backed thread pool for parallel Luau execution.
export type ThreadPool = {
	--- Dispatch a named task across \`count\` workers. Returns a Promise.
	Dispatch: (self: ThreadPool, taskName: string, count: number) -> any, -- Promise
	--- Dispatch a fire-and-forget task.
	DispatchDetached: (self: ThreadPool, taskName: string, count: number) -> (),
	--- Destroy the pool and release worker Actors.
	Destroy: (self: ThreadPool) -> (),
}

--- A worker kernel wrapping a single Actor.
export type ThreadKernel = {
	--- Register a handler for a named task. Chainable.
	On: (self: ThreadKernel, taskName: string, handler: (...any) -> ...any) -> ThreadKernel,
	--- Register a detached handler for a named task. Chainable.
	OnDetached: (self: ThreadKernel, taskName: string, handler: (...any) -> ...any) -> ThreadKernel,
	--- Mark this kernel as ready to receive dispatches.
	Ready: (self: ThreadKernel) -> (),
}

--- The static Thread module.
export type ThreadModule = {
	Pool: (count: number, workerScript: ModuleScript) -> ThreadPool,
	Kernel: (actor: Actor) -> ThreadKernel,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Mock
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- A mock handle wrapping a service or controller for test isolation.
export type MockHandle<T> = {
	--- Run the \`Init\` lifecycle method.
	Init: (self: MockHandle<T>) -> (),
	--- Run the \`Start\` lifecycle method.
	Start: (self: MockHandle<T>) -> (),
	--- Inject a named dependency.
	Inject: (self: MockHandle<T>, name: string, implementation: any) -> (),
	--- Get the underlying service/controller table.
	Get: (self: MockHandle<T>) -> T,
	--- Run \`Destroy\` and clean up the Janitor.
	Destroy: (self: MockHandle<T>) -> (),
}

--- The static Mock module.
export type MockModule = {
	Service: (definition: ServiceDefinition) -> MockHandle<ServiceDefinition>,
	Controller: (definition: ControllerDefinition) -> MockHandle<ControllerDefinition>,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Proxy
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- Internal resolver function for a proxy. Call with the real target once it's available.
export type ProxyResolveFn = (target: any) -> ()

--- The static Proxy module.
export type ProxyModule = {
	create: (name: string) -> (any, ProxyResolveFn),
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Loader
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- Any module with a Name field usable by the loader.
export type NamedModule = {
	Name: string,
	Dependencies: { string }?,
	[any]: any,
}

--- The static Loader module.
export type LoaderModule = {
	TopologicalSort: (modules: { NamedModule }) -> { NamedModule },
	DiscoverModules: (parent: Instance) -> { NamedModule },
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Net
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- An inbound/outbound middleware definition for a remote.
export type MiddlewareDef = {
	Inbound: ((player: Player, ...any) -> ...any)?,
	Outbound: ((player: Player, result: any) -> any)?,
}

--- A middleware function signature.
export type MiddlewareFn = (player: Player, ...any) -> ...any

--- Rate-limit configuration for a remote.
export type RateLimitConfig = {
	MaxCalls: number,
	PerSeconds: number,
}

--- Compression strategy name.
export type CompressionStrategy = "None" | "Auto" | "Aggressive" | "Custom"

--- Custom compression config.
export type CompressionConfig = {
	Strategy: CompressionStrategy?,
	Encode: ((data: any) -> any)?,
	Decode: ((data: any) -> any)?,
}

--- A frame-based remote call batcher.
export type Batcher = {
	Queue: (self: Batcher, remoteName: string, ...any) -> (),
	Destroy: (self: Batcher) -> (),
}

--- A single entry in a batch queue.
export type BatchEntry = {
	name: string,
	args: { [number]: any, n: number },
}

--- A client-side event proxy for \`RemoteEvent\`-backed signals.
export type ClientEventProxy = {
	Connect: (self: ClientEventProxy, fn: (...any) -> ()) -> RBXScriptConnection,
	Once: (self: ClientEventProxy, fn: (...any) -> ()) -> RBXScriptConnection,
	Wait: (self: ClientEventProxy) -> ...any,
	DisconnectAll: (self: ClientEventProxy) -> (),
}

--- Client table entry for a \`Kore.NetEvent\` sentinel.
export type NetEventType = Symbol

--- The static Net module.
export type NetModule = {
	SetupServerRemotes: (service: ServiceDefinition) -> (),
	CreateClientProxy: (serviceName: string, Promise: any) -> { [string]: any }?,
	DestroyServiceRemotes: (serviceName: string) -> (),
	SetCompression: (config: CompressionStrategy | CompressionConfig) -> (),
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Util
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- Table diff result.
export type DiffResult<K, V> = {
	added: { [K]: V },
	removed: { [K]: V },
	changed: { [K]: { old: V, new: V } },
}

--- The Table utility module.
export type TableUtil = {
	deepCopy: <T>(t: T) -> T,
	shallowCopy: <T>(t: T) -> T,
	merge: (...{ [any]: any }) -> { [any]: any },
	keys: <K, V>(t: { [K]: V }) -> { K },
	values: <K, V>(t: { [K]: V }) -> { V },
	filter: <K, V>(t: { [K]: V }, predicate: (value: V, key: K) -> boolean) -> { [K]: V },
	map: <K, V, R>(t: { [K]: V }, transform: (value: V, key: K) -> R) -> { [K]: R },
	find: <K, V>(t: { [K]: V }, predicate: (value: V, key: K) -> boolean) -> (V?, K?),
	flatten: <T>(t: { any }, depth: number?) -> { T },
	shuffle: <T>(t: { T }) -> { T },
	count: (t: { [any]: any }) -> number,
	freeze: <T>(t: T) -> T,
	diff: <K, V>(a: { [K]: V }, b: { [K]: V }) -> DiffResult<K, V>,
}

--- The String utility module.
export type StringUtil = {
	trim: (s: string) -> string,
	split: (s: string, sep: string?) -> { string },
	startsWith: (s: string, prefix: string) -> boolean,
	endsWith: (s: string, suffix: string) -> boolean,
	capitalize: (s: string) -> string,
	truncate: (s: string, maxLen: number, suffix: string?) -> string,
	padStart: (s: string, len: number, char: string?) -> string,
	padEnd: (s: string, len: number, char: string?) -> string,
	camelize: (s: string) -> string,
	slugify: (s: string) -> string,
}

--- The Math utility module.
export type MathUtil = {
	lerp: (a: number, b: number, t: number) -> number,
	clamp: (value: number, min: number, max: number) -> number,
	round: (value: number, decimals: number?) -> number,
	map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) -> number,
	snap: (value: number, step: number) -> number,
	sign: (value: number) -> number,
	randomRange: (min: number, max: number) -> number,
	approach: (current: number, target: number, step: number) -> number,
	damp: (a: number, b: number, smoothing: number, dt: number) -> number,
	bezier: (t: number, p0: number, p1: number, p2: number, p3: number) -> number,
}

--- The combined Util module.
export type UtilModule = {
	Table: TableUtil,
	String: StringUtil,
	Math: MathUtil,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Kore Configuration
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- Log sub-config for \`Kore.Configure()\`.
export type KoreLogConfig = {
	DiscordWebhook: string?,
}

--- Configuration table passed to \`Kore.Configure()\`.
export type KoreConfig = {
	--- Enable debug logging. Default: \`false\`.
	Debug: boolean?,
	--- Destroy mode: \`"shutdown"\` (default) or \`"dynamic"\`.
	Destroy: ("shutdown" | "dynamic")?,
	--- Log sub-configuration.
	Log: KoreLogConfig?,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Service & Controller Definitions
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- The context object passed to \`Init()\` and \`Start()\` lifecycle methods.
export type ContextType = {
	--- A tag-scoped logger for this service/controller.
	Log: TaggedLogger,
	--- Reference to the Kore API.
	Kore: KoreAPI,
	--- The service/controller's Config table, if any.
	Config: { [string]: any }?,
}

--- Client-facing table on a service, defining remote methods and events.
export type ClientTable = {
	--- Per-remote middleware definitions.
	Middleware: { [string]: MiddlewareDef }?,
	--- Per-remote rate-limit definitions.
	RateLimit: { [string]: RateLimitConfig }?,
	--- Batching configuration.
	Batching: any?,
	--- Additional remote methods/events indexed by name.
	[string]: ((...any) -> ...any) | NetEventType | {
		fn: (...any) -> ...any,
		Unreliable: boolean?,
		Immediate: boolean?,
	},
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Service & Controller Injected Fields (for CreateService / CreateController)
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- Fields injected by \`Kore.CreateService()\`. Used as the intersection return type
--- so that \`self\` in \`:\` methods gets full IntelliSense on Janitor, Log, etc.
export type ServiceFields = {
	Janitor: Janitor,
	Log: TaggedLogger,
	FireClient: ((self: any, eventName: string, player: Player, ...any) -> ())?,
	FireAllClients: ((self: any, eventName: string, ...any) -> ())?,
}

--- Fields injected by \`Kore.CreateController()\`. Used as the intersection return type
--- so that \`self\` in \`:\` methods gets full IntelliSense on Janitor, Log, etc.
export type ControllerFields = {
	Janitor: Janitor,
	Log: TaggedLogger,
}

--- A Kore service definition table.
export type ServiceDefinition = {
	--- Unique name for this service.
	Name: string,
	--- Auto-injected Janitor for deterministic cleanup.
	Janitor: Janitor,
	--- Auto-injected tagged logger.
	Log: TaggedLogger,
	--- Fire a named event to a specific client.
	FireClient: ((self: ServiceDefinition, eventName: string, player: Player, ...any) -> ())?,
	--- Fire a named event to all clients.
	FireAllClients: ((self: ServiceDefinition, eventName: string, ...any) -> ())?,
}

--- A Kore controller definition table.
export type ControllerDefinition = {
	--- Unique name for this controller.
	Name: string,
	--- Auto-injected Janitor for deterministic cleanup.
	Janitor: Janitor,
	--- Auto-injected tagged logger.
	Log: TaggedLogger,
}

-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
-- Kore API
-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

--- The main Kore framework API.
-- NOTE: GetService / GetController overloads are generated dynamically
-- by the Kore extension so each known name returns its specific type.`;
function buildKoreAPIType() {
  const services = serviceRegistry.getAll();
  const controllers = controllerRegistry.getAll();
  let getServiceType;
  if (services.length > 0) {
    const overloads = services.map((s) => `((name: "${s.name}") -> ${s.name})`);
    overloads.push("((name: string) -> ServiceDefinition)");
    getServiceType = overloads.join(" & ");
  } else {
    getServiceType = "(name: string) -> ServiceDefinition";
  }
  let getControllerType;
  if (controllers.length > 0) {
    const overloads = controllers.map((c) => `((name: "${c.name}") -> ${c.name})`);
    overloads.push("((name: string) -> ControllerDefinition)");
    getControllerType = overloads.join(" & ");
  } else {
    getControllerType = "(name: string) -> ControllerDefinition";
  }
  const lines = [];
  lines.push("export type KoreAPI = {");
  lines.push("	--- Sentinel symbol for server-to-client event remotes.");
  lines.push("	NetEvent: Symbol,");
  lines.push("");
  lines.push("	-- Re-exported modules");
  lines.push("	Promise: any,");
  lines.push("	Signal: SignalModule,");
  lines.push("	Log: LogModule,");
  lines.push("	Timer: TimerModule,");
  lines.push("	Symbol: SymbolConstructor,");
  lines.push("	Tween: TweenModule,");
  lines.push("	Curve: CurveModule,");
  lines.push("	Data: DataModule,");
  lines.push("	Thread: ThreadModule,");
  lines.push("	Mock: MockModule,");
  lines.push("	Janitor: JanitorModule,");
  lines.push("	Util: UtilModule,");
  lines.push("	Net: NetModule,");
  lines.push("	Types: any,");
  lines.push("	Fusion: any?,");
  lines.push("");
  lines.push("	--- Set framework configuration. Must be called before `Start()`.");
  lines.push("	Configure: (config: KoreConfig) -> (),");
  lines.push("	--- Register a service (server only).");
  lines.push("	AddService: (serviceTable: ServiceDefinition) -> (),");
  lines.push("	--- Register a controller (client only).");
  lines.push("	AddController: (controllerTable: ControllerDefinition) -> (),");
  lines.push("	--- Create and register a service with full IntelliSense. Returns T & ServiceFields.");
  lines.push("	CreateService: <T>(serviceTable: T & { Name: string }) -> T & ServiceFields,");
  lines.push("	--- Create and register a controller with full IntelliSense. Returns T & ControllerFields.");
  lines.push("	CreateController: <T>(controllerTable: T & { Name: string }) -> T & ControllerFields,");
  lines.push("	--- Retrieve a registered service by name. On the client, returns a network proxy.");
  lines.push(`	GetService: ${getServiceType},`);
  lines.push("	--- Retrieve a registered controller by name (client only).");
  lines.push(`	GetController: ${getControllerType},`);
  lines.push("	--- Boot the framework. Returns a Promise that resolves when all lifecycle methods complete.");
  lines.push("	Start: () -> any, -- Promise<void>");
  lines.push('	--- Dynamically destroy and unregister a service. Requires `Destroy = "dynamic"` config.');
  lines.push("	DestroyService: (name: string) -> (),");
  lines.push('	--- Dynamically destroy and unregister a controller. Requires `Destroy = "dynamic"` config.');
  lines.push("	DestroyController: (name: string) -> (),");
  lines.push("}");
  return lines.join("\n");
}
function buildReturnTable(services, controllers) {
  const staticTypes = [
    "Symbol",
    "SymbolConstructor",
    "TaggedLogger",
    "LogLevel",
    "LogModule",
    "SignalConnection",
    "SignalConfig",
    "SignalModule",
    "JanitorTask",
    "Janitor",
    "JanitorModule",
    "CancelFn",
    "TimerModule",
    "TweenBuilder",
    "TweenModule",
    "Keyframe",
    "CurveInstance",
    "CurveModule",
    "DataConfig",
    "Profile",
    "DataModule",
    "ThreadPool",
    "ThreadKernel",
    "ThreadModule",
    "MockModule",
    "ProxyResolveFn",
    "ProxyModule",
    "NamedModule",
    "LoaderModule",
    "MiddlewareDef",
    "MiddlewareFn",
    "RateLimitConfig",
    "CompressionStrategy",
    "CompressionConfig",
    "Batcher",
    "BatchEntry",
    "ClientEventProxy",
    "NetEventType",
    "NetModule",
    "TableUtil",
    "StringUtil",
    "MathUtil",
    "UtilModule",
    "KoreLogConfig",
    "KoreConfig",
    "ContextType",
    "ClientTable",
    "ServiceFields",
    "ControllerFields",
    "ServiceDefinition",
    "ControllerDefinition",
    "KoreAPI"
  ];
  const entries = staticTypes.map((t) => `	${t}: ${t}`);
  entries.push("	Signal: Signal<...any>");
  entries.push("	MockHandle: MockHandle<any>");
  entries.push("	DiffResult: DiffResult<any, any>");
  for (const s of services) {
    entries.push(`	${s.name}: ${s.name}`);
    entries.push(`	${s.name}Client: ${s.name}Client`);
  }
  for (const c of controllers) {
    entries.push(`	${c.name}: ${c.name}`);
  }
  return `return {} :: {
${entries.join(",\n")},
}`;
}
function generateTypes() {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  const lines = [];
  lines.push("-- Kore.Types \u2014 Central type definitions for the Kore framework");
  lines.push("-- Provides comprehensive type annotations for full intellisense support.");
  lines.push("-- AUTOGENERATED BY KORE EXTENSION \u2014 manual edits may be overwritten.");
  lines.push(`-- Last updated: ${timestamp2}`);
  lines.push("");
  lines.push(FRAMEWORK_TYPES);
  lines.push("");
  const services = serviceRegistry.getAll();
  if (services.length > 0) {
    lines.push("-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    lines.push("-- Auto-generated service types");
    lines.push("-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    lines.push("");
    for (const service of services) {
      lines.push(generateServiceType(service));
      lines.push("");
      lines.push(generateServiceClientType(service));
      lines.push("");
    }
  }
  const controllers = controllerRegistry.getAll();
  if (controllers.length > 0) {
    lines.push("-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    lines.push("-- Auto-generated controller types");
    lines.push("-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
    lines.push("");
    for (const controller of controllers) {
      lines.push(generateControllerType(controller));
      lines.push("");
    }
  }
  lines.push("-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  lines.push("-- Kore API");
  lines.push("-- \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  lines.push("");
  lines.push(buildKoreAPIType());
  lines.push("");
  lines.push(buildReturnTable(services, controllers));
  lines.push("");
  return lines.join("\n");
}

// src/codegen/TypesWriter.ts
async function writeTypes() {
  const workspaceFolders = vscode7.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    logError("Cannot write Types.luau \u2014 no workspace folders");
    return;
  }
  const cfg = getConfig();
  const typesPath = cfg.paths.types;
  const rootPath = workspaceFolders[0].uri.fsPath;
  const fullPath = path4.join(rootPath, typesPath);
  try {
    const content = generateTypes();
    const dir = path4.dirname(fullPath);
    if (!fs2.existsSync(dir)) {
      fs2.mkdirSync(dir, { recursive: true });
      logInfo(`Created directory: ${dir}`);
    }
    fs2.writeFileSync(fullPath, content, "utf-8");
    logInfo(`Types.luau written to ${fullPath} (${content.length} bytes)`);
  } catch (err) {
    logError(`Failed to write Types.luau to ${fullPath}`, err);
  }
}

// src/watcher/FileWatcher.ts
var SERVICE_PATTERN = /(?:Kore\s*\.\s*(?:CreateService|AddService))\s*\(/;
var CONTROLLER_PATTERN = /(?:Kore\s*\.\s*(?:CreateController|AddController))\s*\(/;
var FileWatcher = class _FileWatcher {
  constructor() {
    this.watchers = [];
    this.debounceTimers = /* @__PURE__ */ new Map();
  }
  static {
    this.DEBOUNCE_MS = 500;
  }
  activate() {
    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;
    logInfo(`Watching services at: **/${servicesPath}/**/*.luau`);
    logInfo(`Watching controllers at: **/${controllersPath}/**/*.luau`);
    const serviceWatcher = vscode8.workspace.createFileSystemWatcher(`**/${servicesPath}/**/*.luau`);
    serviceWatcher.onDidChange((uri) => this.handleServiceChange(uri));
    serviceWatcher.onDidCreate((uri) => this.handleServiceChange(uri));
    serviceWatcher.onDidDelete((uri) => this.handleServiceDelete(uri));
    this.watchers.push(serviceWatcher);
    const controllerWatcher = vscode8.workspace.createFileSystemWatcher(`**/${controllersPath}/**/*.luau`);
    controllerWatcher.onDidChange((uri) => this.handleControllerChange(uri));
    controllerWatcher.onDidCreate((uri) => this.handleControllerChange(uri));
    controllerWatcher.onDidDelete((uri) => this.handleControllerDelete(uri));
    this.watchers.push(controllerWatcher);
    const globalWatcher = vscode8.workspace.createFileSystemWatcher("**/*.luau");
    globalWatcher.onDidChange((uri) => this.handleGlobalChange(uri));
    globalWatcher.onDidCreate((uri) => this.handleGlobalChange(uri));
    globalWatcher.onDidDelete((uri) => this.handleGlobalDelete(uri));
    this.watchers.push(globalWatcher);
    logInfo("File watchers activated (directory + global)");
  }
  async scanAll() {
    const workspaceFolders = vscode8.workspace.workspaceFolders;
    if (!workspaceFolders) {
      logWarn("No workspace folders found \u2014 cannot scan for services/controllers");
      return;
    }
    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;
    const typesPath = cfg.paths.types;
    serviceRegistry.clear();
    controllerRegistry.clear();
    for (const folder of workspaceFolders) {
      const servicesDir = path5.join(folder.uri.fsPath, servicesPath);
      const controllersDir = path5.join(folder.uri.fsPath, controllersPath);
      logInfo(`Scanning services in: ${servicesDir}`);
      await this.scanDirectory(servicesDir, "service");
      logInfo(`Scanning controllers in: ${controllersDir}`);
      await this.scanDirectory(controllersDir, "controller");
    }
    logInfo("Running content-based global scan...");
    const files = await vscode8.workspace.findFiles("**/*.luau", "{**/node_modules/**,**/.git/**}");
    for (const file of files) {
      if (serviceRegistry.getByFilePath(file.fsPath))
        continue;
      if (controllerRegistry.getByFilePath(file.fsPath))
        continue;
      const relPath = vscode8.workspace.asRelativePath(file, false).replace(/\\/g, "/");
      if (relPath === typesPath)
        continue;
      try {
        const source = fs3.readFileSync(file.fsPath, "utf-8");
        this.tryRegisterFromContent(source, file.fsPath);
      } catch (err) {
        logDebug(`Global scan: could not read ${file.fsPath}`);
      }
    }
    logInfo(`Scan complete: ${serviceRegistry.size} service(s), ${controllerRegistry.size} controller(s)`);
  }
  /**
   * Attempt to register a file as a service and/or controller based on its content.
   */
  tryRegisterFromContent(source, filePath) {
    if (SERVICE_PATTERN.test(source)) {
      const info = parseService(source, filePath);
      if (info && !serviceRegistry.has(info.name)) {
        serviceRegistry.register(info);
        logInfo(`  Registered service (content-scan): ${info.name} (${path5.basename(filePath)})`);
      }
    }
    if (CONTROLLER_PATTERN.test(source)) {
      const info = parseController(source, filePath);
      if (info && !controllerRegistry.has(info.name)) {
        controllerRegistry.register(info);
        logInfo(`  Registered controller (content-scan): ${info.name} (${path5.basename(filePath)})`);
      }
    }
  }
  async scanDirectory(dirPath, type) {
    if (!fs3.existsSync(dirPath)) {
      logWarn(`Directory does not exist: ${dirPath}`);
      return;
    }
    const entries = fs3.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith("."))
        continue;
      const fullPath = path5.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, type);
        continue;
      }
      if (!entry.name.endsWith(".luau"))
        continue;
      try {
        const source = fs3.readFileSync(fullPath, "utf-8");
        if (type === "service") {
          const info = parseService(source, fullPath);
          if (info) {
            serviceRegistry.register(info);
            logInfo(`  Registered service: ${info.name} (${entry.name})`);
          } else {
            logDebug(`  Skipped ${entry.name} \u2014 no Name field found`);
          }
        } else {
          const info = parseController(source, fullPath);
          if (info) {
            controllerRegistry.register(info);
            logInfo(`  Registered controller: ${info.name} (${entry.name})`);
          } else {
            logDebug(`  Skipped ${entry.name} \u2014 no Name field found`);
          }
        }
      } catch (err) {
        logError(`Failed to parse ${fullPath}`, err);
      }
    }
  }
  updateService(source, filePath) {
    const existing = serviceRegistry.getByFilePath(filePath);
    if (existing) {
      serviceRegistry.unregister(existing.name);
    }
    const info = parseService(source, filePath);
    if (info) {
      serviceRegistry.register(info);
      logInfo(`Updated service: ${info.name}`);
    } else {
      logDebug(`Service parse returned nothing for: ${path5.basename(filePath)}`);
    }
  }
  updateController(source, filePath) {
    const existing = controllerRegistry.getByFilePath(filePath);
    if (existing) {
      controllerRegistry.unregister(existing.name);
    }
    const info = parseController(source, filePath);
    if (info) {
      controllerRegistry.register(info);
      logInfo(`Updated controller: ${info.name}`);
    } else {
      logDebug(`Controller parse returned nothing for: ${path5.basename(filePath)}`);
    }
  }
  /**
   * Handle a real-time document edit (onDidChangeTextDocument).
   * Debounces and reads from the editor buffer, not disk.
   * Uses content-based classification so services/controllers outside the
   * configured directories are still picked up.
   */
  handleDocumentEdit(document) {
    if (document.languageId !== "luau")
      return;
    const filePath = document.uri.fsPath;
    let type = this.classifyFileByPath(filePath);
    if (!type) {
      const source = document.getText();
      type = this.classifyFileByContent(source);
    }
    if (!type)
      return;
    const existing = this.debounceTimers.get(filePath);
    if (existing)
      clearTimeout(existing);
    this.debounceTimers.set(filePath, setTimeout(async () => {
      this.debounceTimers.delete(filePath);
      try {
        const source = document.getText();
        if (type === "service") {
          this.updateService(source, filePath);
        } else {
          this.updateController(source, filePath);
        }
        const currentCfg = getConfig();
        if (currentCfg.options.generateTypes) {
          await writeTypes();
        }
        logDebug(`Types.luau regenerated (live edit: ${path5.basename(filePath)})`);
      } catch (err) {
        logError(`Error handling live edit for ${filePath}`, err);
      }
    }, _FileWatcher.DEBOUNCE_MS));
  }
  /**
   * Classify by directory path (fast, used for focused watchers).
   */
  classifyFileByPath(filePath) {
    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;
    const norm2 = filePath.replace(/\\/g, "/");
    if (norm2.includes(`/${servicesPath}/`))
      return "service";
    if (norm2.includes(`/${controllersPath}/`))
      return "controller";
    return null;
  }
  /**
   * Classify by file content (robust, catches services/controllers anywhere).
   */
  classifyFileByContent(source) {
    if (SERVICE_PATTERN.test(source))
      return "service";
    if (CONTROLLER_PATTERN.test(source))
      return "controller";
    return null;
  }
  async handleServiceChange(uri) {
    try {
      const filePath = uri.fsPath;
      logDebug(`Service file changed: ${filePath}`);
      const openDoc = vscode8.workspace.textDocuments.find((d) => d.uri.fsPath === filePath);
      const source = openDoc ? openDoc.getText() : fs3.readFileSync(filePath, "utf-8");
      this.updateService(source, filePath);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling service change for ${uri.fsPath}`, err);
    }
  }
  async handleServiceDelete(uri) {
    try {
      const existing = serviceRegistry.getByFilePath(uri.fsPath);
      if (existing) {
        serviceRegistry.unregister(existing.name);
        logInfo(`Removed service: ${existing.name}`);
        vscode8.window.showWarningMessage(
          `Kore: Service "${existing.name}" was deleted. Check for GetService("${existing.name}") references.`
        );
      }
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling service delete for ${uri.fsPath}`, err);
    }
  }
  async handleControllerChange(uri) {
    try {
      const filePath = uri.fsPath;
      logDebug(`Controller file changed: ${filePath}`);
      const openDoc = vscode8.workspace.textDocuments.find((d) => d.uri.fsPath === filePath);
      const source = openDoc ? openDoc.getText() : fs3.readFileSync(filePath, "utf-8");
      this.updateController(source, filePath);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling controller change for ${uri.fsPath}`, err);
    }
  }
  async handleControllerDelete(uri) {
    try {
      const existing = controllerRegistry.getByFilePath(uri.fsPath);
      if (existing) {
        controllerRegistry.unregister(existing.name);
        logInfo(`Removed controller: ${existing.name}`);
        vscode8.window.showWarningMessage(
          `Kore: Controller "${existing.name}" was deleted. Check for GetController("${existing.name}") references.`
        );
      }
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling controller delete for ${uri.fsPath}`, err);
    }
  }
  /**
   * Global watcher callback — content-based classification for files
   * outside the configured service/controller directories.
   */
  async handleGlobalChange(uri) {
    const filePath = uri.fsPath;
    if (this.classifyFileByPath(filePath))
      return;
    try {
      const openDoc = vscode8.workspace.textDocuments.find((d) => d.uri.fsPath === filePath);
      const source = openDoc ? openDoc.getText() : fs3.readFileSync(filePath, "utf-8");
      const type = this.classifyFileByContent(source);
      if (!type)
        return;
      logDebug(`Global watcher: ${type} change detected in ${path5.basename(filePath)}`);
      if (type === "service") {
        this.updateService(source, filePath);
      } else {
        this.updateController(source, filePath);
      }
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch {
    }
  }
  async handleGlobalDelete(uri) {
    const filePath = uri.fsPath;
    if (this.classifyFileByPath(filePath))
      return;
    const svc = serviceRegistry.getByFilePath(filePath);
    if (svc) {
      serviceRegistry.unregister(svc.name);
      logInfo(`Removed service (global): ${svc.name}`);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
      return;
    }
    const ctrl = controllerRegistry.getByFilePath(filePath);
    if (ctrl) {
      controllerRegistry.unregister(ctrl.name);
      logInfo(`Removed controller (global): ${ctrl.name}`);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    }
  }
  dispose() {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
};

// src/require/PathResolver.ts
var path6 = __toESM(require("path"));
var fs4 = __toESM(require("fs"));
var PathResolver = class {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.project = null;
    this.cache = /* @__PURE__ */ new Map();
  }
  async initialize() {
    this.project = this.findBestProjectFile();
    if (this.project) {
      logInfo(`PathResolver: Using project "${this.project.name}"`);
    } else {
      logInfo("PathResolver: No Rojo project found, using folder conventions");
    }
  }
  /**
   * Find the best *.project.json file in the workspace root.
   * Prefers files with $className: DataModel (full game tree).
   */
  findBestProjectFile() {
    let files;
    try {
      files = fs4.readdirSync(this.workspaceRoot).filter((f) => f.endsWith(".project.json"));
    } catch {
      return null;
    }
    files.sort((a, b) => {
      if (a.startsWith("dev"))
        return -1;
      if (b.startsWith("dev"))
        return 1;
      return 0;
    });
    let fallback = null;
    for (const filename of files) {
      const filePath = path6.join(this.workspaceRoot, filename);
      try {
        const content = fs4.readFileSync(filePath, "utf-8");
        const project = JSON.parse(content);
        if (project.tree?.$className === "DataModel") {
          return project;
        }
        if (!fallback) {
          fallback = project;
        }
      } catch (e) {
        logError(`Failed to parse ${filename}`, e);
      }
    }
    return fallback;
  }
  /**
   * Resolve a file system path to Roblox Instance path segments.
   * e.g. ["ReplicatedStorage", "Shared", "Packages", "Module"]
   */
  resolveSegments(fsPath) {
    if (this.cache.has(fsPath)) {
      return this.cache.get(fsPath);
    }
    let segments;
    if (this.project?.tree) {
      segments = this.resolveFromRojoTree(fsPath) ?? this.resolveFromConvention(fsPath);
    } else {
      segments = this.resolveFromConvention(fsPath);
    }
    this.cache.set(fsPath, segments);
    return segments;
  }
  resolveFromRojoTree(fsPath) {
    const relativePath = path6.relative(this.workspaceRoot, fsPath).replace(/\\/g, "/");
    return this.searchTree(this.project.tree, relativePath, []);
  }
  searchTree(node, target, segments) {
    if (node.$path) {
      const nodePath = node.$path.replace(/\\/g, "/");
      if (target === nodePath || target.startsWith(nodePath + "/")) {
        const remaining = target === nodePath ? "" : target.substring(nodePath.length + 1);
        const parts = remaining ? remaining.split("/") : [];
        return [...segments, ...this.processSegments(parts)];
      }
    }
    for (const key of Object.keys(node)) {
      if (key.startsWith("$"))
        continue;
      const child = node[key];
      if (child && typeof child === "object") {
        const result = this.searchTree(child, target, [...segments, key]);
        if (result)
          return result;
      }
    }
    return null;
  }
  processSegments(segments) {
    const result = [];
    for (const segment of segments) {
      const clean = this.stripExtensions(segment);
      if (clean.toLowerCase() === "init")
        continue;
      result.push(clean);
    }
    return result;
  }
  stripExtensions(name) {
    return name.replace(/\.server\.luau$/i, "").replace(/\.client\.luau$/i, "").replace(/\.server\.lua$/i, "").replace(/\.client\.lua$/i, "").replace(/\.luau$/i, "").replace(/\.lua$/i, "");
  }
  resolveFromConvention(fsPath) {
    const relativePath = path6.relative(this.workspaceRoot, fsPath);
    const parts = relativePath.split(path6.sep);
    const processed = [];
    for (const seg of parts) {
      const clean = this.stripExtensions(seg);
      if (clean.toLowerCase() === "init")
        continue;
      processed.push(clean);
    }
    const serviceMap = {
      src: ["ReplicatedStorage"],
      server: ["ServerScriptService"],
      client: ["StarterPlayer", "StarterPlayerScripts"],
      shared: ["ReplicatedStorage"]
    };
    if (processed.length > 0) {
      const mapped = serviceMap[processed[0].toLowerCase()];
      if (mapped) {
        processed.splice(0, 1, ...mapped);
      }
    }
    return processed;
  }
  clearCache() {
    this.cache.clear();
  }
  reload() {
    this.cache.clear();
    this.project = this.findBestProjectFile();
  }
};

// src/require/ModuleIndexer.ts
var vscode9 = __toESM(require("vscode"));
var path7 = __toESM(require("path"));
var ModuleIndexer = class {
  constructor(pathResolver2) {
    this.pathResolver = pathResolver2;
    this.modules = [];
    this.watchers = [];
  }
  async initialize() {
    await this.rebuildIndex();
    this.setupWatchers();
  }
  async rebuildIndex() {
    this.modules = [];
    const start = Date.now();
    try {
      const luauFiles = await vscode9.workspace.findFiles(
        "**/*.luau",
        "{**/node_modules/**,**/_Index/**}"
      );
      const wallyFiles = await vscode9.workspace.findFiles(
        "{**/Packages/*.lua,**/ServerPackages/*.lua,**/DevPackages/*.lua}",
        "**/_Index/**"
      );
      for (const file of luauFiles) {
        this.indexFile(file, false);
      }
      for (const file of wallyFiles) {
        this.indexFile(file, true);
      }
      logInfo(`ModuleIndexer: Indexed ${this.modules.length} modules in ${Date.now() - start}ms`);
    } catch (e) {
      logError("ModuleIndexer: Indexing failed", e);
    }
  }
  indexFile(uri, isWallyPackage) {
    const fsPath = uri.fsPath;
    const fileName = path7.basename(fsPath);
    if (fileName.startsWith("."))
      return;
    if (fsPath.includes(`${path7.sep}_Index${path7.sep}`) || fsPath.includes("/_Index/"))
      return;
    const lower = fileName.toLowerCase();
    const isScript = (lower.endsWith(".server.luau") || lower.endsWith(".server.lua")) && !lower.startsWith("init.") || (lower.endsWith(".client.luau") || lower.endsWith(".client.lua")) && !lower.startsWith("init.");
    if (isScript)
      return;
    let name = fileName.replace(/\.server\.luau$/i, "").replace(/\.client\.luau$/i, "").replace(/\.server\.lua$/i, "").replace(/\.client\.lua$/i, "").replace(/\.luau$/i, "").replace(/\.lua$/i, "");
    if (name.toLowerCase() === "init") {
      name = path7.basename(path7.dirname(fsPath));
    }
    const workspaceFolder = vscode9.workspace.workspaceFolders?.find((f) => fsPath.startsWith(f.uri.fsPath));
    const relativePath = workspaceFolder ? path7.relative(workspaceFolder.uri.fsPath, fsPath) : fsPath;
    const instanceSegments = this.pathResolver.resolveSegments(fsPath);
    const instancePath = "game." + instanceSegments.join(".");
    this.modules.push({ name, fsPath, instanceSegments, instancePath, relativePath, isWallyPackage });
  }
  setupWatchers() {
    this.disposeWatchers();
    const luauWatcher = vscode9.workspace.createFileSystemWatcher("**/*.luau");
    const luaWatcher = vscode9.workspace.createFileSystemWatcher(
      "{**/Packages/*.lua,**/ServerPackages/*.lua,**/DevPackages/*.lua}"
    );
    const shouldIndex = (uri) => !uri.fsPath.includes(`${path7.sep}_Index${path7.sep}`) && !uri.fsPath.includes("/_Index/");
    const onLuauCreate = luauWatcher.onDidCreate((uri) => {
      if (shouldIndex(uri))
        this.indexFile(uri, false);
    });
    const onLuauDelete = luauWatcher.onDidDelete((uri) => {
      this.modules = this.modules.filter((m) => m.fsPath !== uri.fsPath);
    });
    const onLuauChange = luauWatcher.onDidChange((uri) => {
      if (shouldIndex(uri)) {
        this.modules = this.modules.filter((m) => m.fsPath !== uri.fsPath);
        this.indexFile(uri, false);
      }
    });
    const onLuaCreate = luaWatcher.onDidCreate((uri) => {
      if (shouldIndex(uri))
        this.indexFile(uri, true);
    });
    const onLuaDelete = luaWatcher.onDidDelete((uri) => {
      this.modules = this.modules.filter((m) => m.fsPath !== uri.fsPath);
    });
    const onLuaChange = luaWatcher.onDidChange((uri) => {
      if (shouldIndex(uri)) {
        this.modules = this.modules.filter((m) => m.fsPath !== uri.fsPath);
        this.indexFile(uri, true);
      }
    });
    this.watchers.push(
      luauWatcher,
      onLuauCreate,
      onLuauDelete,
      onLuauChange,
      luaWatcher,
      onLuaCreate,
      onLuaDelete,
      onLuaChange
    );
  }
  disposeWatchers() {
    for (const w of this.watchers)
      w.dispose();
    this.watchers = [];
  }
  getModules() {
    return this.modules;
  }
  dispose() {
    this.disposeWatchers();
    this.modules = [];
  }
};

// src/extension.ts
var LUAU_SELECTOR = { language: "luau", scheme: "file" };
var diagnosticProvider;
var fileWatcher;
var pathResolver;
var moduleIndexer;
var outputChannel2;
var koreActive = false;
async function activate(context) {
  outputChannel2 = vscode10.window.createOutputChannel("Kore");
  initLogger(outputChannel2);
  logInfo("Extension activating...");
  context.subscriptions.push(
    vscode10.commands.registerCommand("kore.initProject", async () => {
      const created = await createKoreToml();
      if (created) {
        vscode10.window.showInformationMessage("Kore: Created Kore.toml. Kore features are now active.");
        if (!koreActive) {
          await activateKoreFeatures(context);
        }
      }
    })
  );
  startWatching(context);
  if (koreTomlExists()) {
    await activateKoreFeatures(context);
  } else {
    logInfo('No Kore.toml found \u2014 Kore features disabled. Run "Kore: Init Project" to create one.');
    const choice = await vscode10.window.showInformationMessage(
      "Kore: No Kore.toml found in this workspace. Create one to enable Kore features.",
      "Create Kore.toml",
      "Dismiss"
    );
    if (choice === "Create Kore.toml") {
      const created = await createKoreToml();
      if (created) {
        await activateKoreFeatures(context);
      }
    }
    onConfigChanged(async () => {
      if (!koreActive && koreTomlExists()) {
        await activateKoreFeatures(context);
      }
    });
  }
}
async function activateKoreFeatures(context) {
  if (koreActive)
    return;
  koreActive = true;
  const cfg = getConfig();
  logInfo(`Kore.toml loaded \u2014 services: ${cfg.paths.services}, controllers: ${cfg.paths.controllers}`);
  if (cfg.options.debug) {
    setDebugEnabled(true);
  }
  try {
    diagnosticProvider = new DiagnosticProvider();
    fileWatcher = new FileWatcher();
    logInfo("Providers initialized");
    await fileWatcher.scanAll();
    if (cfg.options.generateTypes) {
      await writeTypes();
    }
    const workspaceFolder = vscode10.workspace.workspaceFolders?.[0];
    const workspaceRoot = workspaceFolder?.uri.fsPath ?? "";
    pathResolver = new PathResolver(workspaceRoot);
    await pathResolver.initialize();
    setPathResolver(pathResolver);
    moduleIndexer = new ModuleIndexer(pathResolver);
    await moduleIndexer.initialize();
    logInfo(`Module indexer ready: ${moduleIndexer.getModules().length} module(s)`);
    context.subscriptions.push(
      vscode10.languages.registerCompletionItemProvider(LUAU_SELECTOR, new CompletionProvider(moduleIndexer), ".", '"', "'", cfg.options.prefix),
      vscode10.languages.registerHoverProvider(LUAU_SELECTOR, new HoverProvider()),
      vscode10.languages.registerCodeActionsProvider(LUAU_SELECTOR, new KoreCodeActionProvider(), {
        providedCodeActionKinds: [vscode10.CodeActionKind.QuickFix]
      })
    );
    logInfo("Completion provider registered");
    fileWatcher.activate();
    context.subscriptions.push({ dispose: () => fileWatcher.dispose() });
    context.subscriptions.push({ dispose: () => moduleIndexer.dispose() });
    const projectWatcher = vscode10.workspace.createFileSystemWatcher("**/*.project.json");
    const handleProjectChange = async () => {
      pathResolver.reload();
      await moduleIndexer.rebuildIndex();
      logInfo("Project file changed \u2014 reindexed modules");
    };
    context.subscriptions.push(projectWatcher);
    context.subscriptions.push(projectWatcher.onDidChange(handleProjectChange));
    context.subscriptions.push(projectWatcher.onDidCreate(handleProjectChange));
    context.subscriptions.push(projectWatcher.onDidDelete(handleProjectChange));
    context.subscriptions.push(
      vscode10.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === "luau") {
          diagnosticProvider.update(doc);
        }
      }),
      vscode10.workspace.onDidOpenTextDocument((doc) => {
        if (doc.languageId === "luau") {
          diagnosticProvider.update(doc);
        }
      }),
      vscode10.workspace.onDidChangeTextDocument((e) => {
        fileWatcher.handleDocumentEdit(e.document);
      })
    );
    context.subscriptions.push(
      vscode10.workspace.onDidCreateFiles(async (event) => {
        const currentCfg = getConfig();
        if (!currentCfg.options.autoTemplate)
          return;
        const servicesPath = currentCfg.paths.services;
        const controllersPath = currentCfg.paths.controllers;
        const koreRequire = currentCfg.require.kore;
        const typesRequire = getTypesRequirePath();
        for (const file of event.files) {
          if (!file.fsPath.endsWith(".luau"))
            continue;
          try {
            const stat = await vscode10.workspace.fs.stat(file);
            if (stat.size > 0)
              continue;
          } catch {
            continue;
          }
          const relative3 = vscode10.workspace.asRelativePath(file, false).replace(/\\/g, "/");
          const name = path8.basename(file.fsPath, ".luau");
          let template = null;
          if (relative3.startsWith(servicesPath)) {
            template = [
              `local Kore = require(${koreRequire})`,
              `local Types = require(${typesRequire})`,
              "",
              `local ${name} = Kore.CreateService({`,
              `	Name = "${name}",`,
              `})`,
              "",
              `${name}.Client = {`,
              `	-- Remote methods and Kore.NetEvent declarations`,
              `}`,
              "",
              `function ${name}:Init(ctx)`,
              `	-- Sync initialization (no yielding)`,
              `end`,
              "",
              `function ${name}:Start(ctx)`,
              `	-- Async start (yielding OK)`,
              `end`,
              "",
              `return ${name}`,
              ""
            ].join("\n");
          } else if (relative3.startsWith(controllersPath)) {
            template = [
              `local Kore = require(${koreRequire})`,
              `local Types = require(${typesRequire})`,
              "",
              `local ${name} = Kore.CreateController({`,
              `	Name = "${name}",`,
              `})`,
              "",
              `function ${name}:Init(ctx)`,
              `	-- Sync initialization (no yielding)`,
              `end`,
              "",
              `function ${name}:Start(ctx)`,
              `	-- Async start (yielding OK)`,
              `end`,
              "",
              `return ${name}`,
              ""
            ].join("\n");
          }
          if (template) {
            const encoder = new TextEncoder();
            await vscode10.workspace.fs.writeFile(file, encoder.encode(template));
            logInfo(`Auto-template: created ${name} (${relative3.startsWith(servicesPath) ? "service" : "controller"})`);
            const doc = await vscode10.workspace.openTextDocument(file);
            await vscode10.window.showTextDocument(doc);
          }
        }
      })
    );
    onConfigChanged(async (newCfg) => {
      logInfo("Config changed \u2014 rescanning...");
      setDebugEnabled(newCfg.options.debug);
      await fileWatcher.scanAll();
      if (newCfg.options.generateTypes) {
        await writeTypes();
      }
    });
    context.subscriptions.push(
      vscode10.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("kore.debug")) {
          refreshDebugSetting();
          logInfo("Debug setting changed");
        }
        if (e.affectsConfiguration("kore")) {
          invalidateCache();
        }
      })
    );
    context.subscriptions.push(
      vscode10.commands.registerCommand("kore.refreshTypes", async () => {
        logInfo("Manual refresh triggered via kore.refreshTypes");
        try {
          await fileWatcher.scanAll();
          const currentCfg = getConfig();
          if (currentCfg.options.generateTypes) {
            await writeTypes();
          }
          pathResolver.reload();
          await moduleIndexer.rebuildIndex();
          vscode10.window.showInformationMessage("Kore: Types refreshed successfully.");
        } catch (err) {
          logError("Failed to refresh types", err);
          vscode10.window.showErrorMessage("Kore: Failed to refresh types. Check Kore output channel.");
        }
      }),
      vscode10.commands.registerCommand("kore.reindexModules", async () => {
        try {
          logInfo("Manual reindex triggered via kore.reindexModules");
          pathResolver.reload();
          await moduleIndexer.rebuildIndex();
          vscode10.window.showInformationMessage(`Kore: Reindexed ${moduleIndexer.getModules().length} modules.`);
        } catch (err) {
          logError("Failed to reindex modules", err);
          vscode10.window.showErrorMessage("Kore: Failed to reindex modules. Check Kore output channel.");
        }
      }),
      vscode10.commands.registerCommand("kore.openDocs", () => {
        vscode10.env.openExternal(vscode10.Uri.parse("https://github.com/mrkirdid/kore"));
      }),
      vscode10.commands.registerCommand("kore.showRegistry", () => {
        const services = serviceRegistry.getAll();
        const controllers = controllerRegistry.getAll();
        const panel = vscode10.window.createWebviewPanel(
          "koreRegistry",
          "Kore: Service Registry",
          vscode10.ViewColumn.One,
          {}
        );
        let html = '<html><body style="font-family: sans-serif; padding: 20px;">';
        html += "<h1>Kore Service Registry</h1>";
        html += "<h2>Services</h2>";
        if (services.length === 0) {
          html += "<p>No services discovered.</p>";
        } else {
          for (const svc of services) {
            html += `<h3>${escapeHtml(svc.name)}</h3>`;
            html += `<p><strong>File:</strong> ${escapeHtml(svc.filePath)}</p>`;
            if (svc.dependencies.length > 0) {
              html += `<p><strong>Dependencies:</strong> ${svc.dependencies.map(escapeHtml).join(", ")}</p>`;
            }
            if (svc.clientMethods.length > 0) {
              html += "<p><strong>Client Methods:</strong></p><ul>";
              for (const m of svc.clientMethods) {
                html += `<li>${escapeHtml(m.name)}(${m.params.map((p) => `${escapeHtml(p.name)}: ${escapeHtml(p.type)}`).join(", ")})</li>`;
              }
              html += "</ul>";
            }
            if (svc.netEvents.length > 0) {
              html += "<p><strong>Net Events:</strong></p><ul>";
              for (const e of svc.netEvents) {
                html += `<li>${escapeHtml(e.name)}</li>`;
              }
              html += "</ul>";
            }
          }
        }
        html += "<h2>Controllers</h2>";
        if (controllers.length === 0) {
          html += "<p>No controllers discovered.</p>";
        } else {
          for (const ctrl of controllers) {
            html += `<h3>${escapeHtml(ctrl.name)}</h3>`;
            html += `<p><strong>File:</strong> ${escapeHtml(ctrl.filePath)}</p>`;
            if (ctrl.dependencies.length > 0) {
              html += `<p><strong>Dependencies:</strong> ${ctrl.dependencies.map(escapeHtml).join(", ")}</p>`;
            }
            if (ctrl.methods.length > 0) {
              html += "<p><strong>Methods:</strong></p><ul>";
              for (const m of ctrl.methods) {
                html += `<li>${escapeHtml(m.name)}(${m.params.map((p) => `${escapeHtml(p.name)}: ${escapeHtml(p.type)}`).join(", ")})</li>`;
              }
              html += "</ul>";
            }
          }
        }
        html += "</body></html>";
        panel.webview.html = html;
      })
    );
    context.subscriptions.push(diagnosticProvider);
    context.subscriptions.push(
      vscode10.workspace.onDidChangeWorkspaceFolders(async () => {
        logInfo("Workspace folders changed \u2014 rescanning...");
        invalidateCache();
        pathResolver.reload();
        await fileWatcher.scanAll();
        const currentCfg = getConfig();
        if (currentCfg.options.generateTypes) {
          await writeTypes();
        }
        await moduleIndexer.rebuildIndex();
      })
    );
    logInfo(`Kore activated. Found ${serviceRegistry.size} service(s), ${controllerRegistry.size} controller(s).`);
    if (serviceRegistry.size === 0 && controllerRegistry.size === 0) {
      logWarn("No services or controllers discovered \u2014 check Kore.toml paths.");
      logInfo(`  paths.services    = ${cfg.paths.services}`);
      logInfo(`  paths.controllers = ${cfg.paths.controllers}`);
    }
  } catch (err) {
    logError("Kore features failed to activate", err);
    vscode10.window.showErrorMessage("Kore: Failed to activate. Check the Kore output channel for details.");
  }
}
function deactivate() {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
  if (moduleIndexer) {
    moduleIndexer.dispose();
  }
  if (diagnosticProvider) {
    diagnosticProvider.dispose();
  }
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
