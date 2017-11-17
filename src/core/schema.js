const JsonRef = require('./jsonref');
const fetch = (typeof window === 'undefined') ? require('node-fetch') : require('fetch');
const deepEqual = require('deep-equal');

exports = module.exports = JsonSchema;

function JsonSchema(schema, resolved) {
    this.schema = schema;
    this.resolved = resolved;
}
JsonSchema.prototype.resolve = function () {
    if (this.resolved) {
        return this.schema;
    }
    function iterator(obj) {
        const tores = [];
        if ((typeof obj) !== 'object') {
            return Promise.resolve({assembly: obj, tores: tores});
        }
        return Promise.all(Object.entries(obj).map(function (entry) {
            if (entry[0] === '$ref') {
                const ref = new JsonRef(entry[1]);
                if (ref.url) {
                    return fetch(ref.url).then(function (resp) {
                        return (resp.ok) ? resp.json() : Promise.reject(resp.statusText);
                    }).then(function (json) {
                        try {
                            const match = ref.match(json);
                            return iterator(match).then(function (o) {
                                o.tores.forEach(function (t) {
                                    tores.push(t);
                                });
                                return Promise.resolve(Object.entries(o.assembly));
                            })
                        } catch (fetcherr) {
                            return iterator(fetcherr.json).then(function (o) {
                                o.tores.forEach(function (t) {
                                    tores.push(t);
                                });
                                var match = o.assembly;
                                while (fetcherr.rest.length > 0) {
                                    const current = fetcherr.rest.shift();
                                    match = match[current];
                                }
                                return iterator(match).then(function (m) {
                                    m.tores.forEach(function (t) {
                                        tores.push(t);
                                    });
                                    return Promise.resolve(Object.entries(m.assembly));
                                });
                            })
                        }
                    });
                } else {
                    return Promise.resolve([ref]);
                }
            } else {
                if ((typeof entry[1]) === 'object') {
                    if (Array.isArray(entry[1])) {
                        return Promise.all(entry[1].map(function (t) {
                            return iterator(t).then(function (o) {
                                o.tores.forEach(function (t) {
                                    tores.push(t);
                                });
                                return Promise.resolve(o.assembly);
                            });
                        })).then(function (o) {
                            return Promise.resolve([[entry[0], o]])
                        });
                    } else {
                        return iterator(entry[1]).then(function (o) {
                            o.tores.forEach(function (t) {
                                tores.push(t);
                            });
                            return Promise.resolve([[entry[0], o.assembly]]);
                        });
                    }
                } else {
                    return Promise.resolve([[entry[0], entry[1]]]);
                }
            }
        })).then(function (entries) {
            const assembly = {};
            entries.forEach(function (t) {
                t.forEach(function (u) {
                    if (u instanceof JsonRef) {
                        tores.push({ref: u, target: assembly});
                    } else {
                        assembly[u[0]] = u[1];
                    }
                })
            });
            return Promise.resolve({assembly: assembly, tores: tores});
        });
    }

    this.resolved = true;
    return iterator(this.schema, {}, "root").then(function (o) {
        const steps = [];
        while (o.tores.length > 0) {
            o.tores.forEach(function (t, idx) {
                const match = t.ref.match(o.assembly);
                if (o.tores.map(function (s) {
                        return s.target
                    }).indexOf(match) < 0) {
                    Object.entries(match).forEach(function (e) {
                        t.target[e[0]] = e[1];
                    });
                    o.tores.splice(idx, 1);
                    steps.length = 0;
                } else {
                    if (steps.indexOf(idx) >= 0) {
                        throw new Error("circular dependency");
                    }
                    steps.push(idx);
                }
            });
        }
        return Promise.resolve(o.assembly);
    });
};

JsonSchema.prototype.validate = function (value) {
    if (!this.resolved) {
        throw new Error('schema is not resolved');
    }

    function resolveType(value) {
        if (value === null) {
            return 'null';
        } else if ((typeof value) === 'object') {
            if (Array.isArray(value)) {
                return 'array';
            } else {
                return 'object';
            }
        } else if ((typeof value) === 'number') {
            if (Number.isInteger(value)) {
                return 'integer';
            } else {
                return 'number';
            }
        } else {
            return typeof value;
        }
    }

    const type = resolveType(value);
    const errors = [];
    const expected = [];
    const obj = this.schema;

    function expect(types) {
        if (types.indexOf(type) < 0) {
            types.forEach(function (t) {
                if (expected.indexOf(t) < 0) {
                    expected.push(t);
                }
            });
            return false;
        }
        return true;
    }

    if (obj.multipleOf && expect(['number', 'integer'])) {
        if (value % obj.multipleOf !== 0) {
            errors.push({name: 'multipleOf', multipleOf: obj.multipleOf, actualReminder: value % obj.multipleOf});
        }
    }

    if (obj.maximum && expect(['number', 'integer'])) {
        if (value > obj.maximum) {
            errors.push({name: 'maximum', maximum: obj.maximum});
        }
    }

    if (obj.exclusiveMaximum && expect(['number', 'integer'])) {
        if (value >= obj.exclusiveMaximum) {
            errors.push({name: 'exclusiveMaximum', exclusiveMaximum: obj.exclusiveMaximum});
        }
    }

    if (obj.minimum && expect(['number', 'integer'])) {
        if (value < obj.minimum) {
            errors.push({name: 'minimum', minimum: obj.minimum});
        }
    }

    if (obj.exclusiveMinimum && expect(['number', 'integer'])) {
        if (value <= obj.exclusiveMinimum) {
            errors.push({name: 'exclusiveMinimum', exclusiveMinimum: obj.exclusiveMinimum});
        }
    }

    if (obj.maxLength && expect(['string'])) {
        if (value.length > obj.maxLength) {
            errors.push({name: 'maxLength', maxLength: obj.maxLength, actualLength: value.length});
        }
    }

    if (obj.minLength && expect(['string'])) {
        if (value.length < obj.minLength) {
            errors.push({name: 'minLength', minLength: obj.minLength, actualLength: value.length});
        }
    }

    if (obj.pattern && expect(['string'])) {
        if (!new RegExp(obj.pattern).test(value)) {
            errors.push({name: 'pattern', pattern: obj.pattern});
        }
    }

    if (obj.items && expect(['array'])) {
        const errs = {};
        if (resolveType(obj.items) === 'array') {
            value.forEach(function (t, idx) {
                if (idx < obj.items.length) {
                    const schema = new JsonSchema(obj.items[idx], true);
                    const e = schema.validate(t);
                    if (e.length > 0) {
                        errs[idx] = e;
                    }
                } else {
                    if (obj.additionalItems) {
                        const schema = new JsonSchema(obj.additionalItems, true);
                        const e = schema.validate(t);
                        if (e.length > 0) {
                            errs[idx] = e;
                        }
                    } else {
                        errs[idx] = [{name: 'maxItems', maxItems: obj.items.length, actualItems: value.length}];
                    }
                }
            });
        } else {
            const schema = new JsonSchema(obj.items, true);
            value.forEach(function (e, idx) {
                const t = schema.validate(e);
                if (t.length > 0) {
                    errs[idx] = t;
                }
            });
        }
        if (Object.entries(errs).length > 0) {
            errors.push({name: 'items', items: obj.items, errors: errs});
        }
    }

    if (obj.maxItems && expect(['array'])) {
        if (value.length > obj.maxItems) {
            errors.push({name: 'maxItems', maxItems: obj.maxItems, actualItems: value.length});
        }
    }

    if (obj.minItems && expect(['array'])) {
        if (value.length < obj.minItems) {
            errors.push({name: 'minItems', minItems: obj.minItems, actualItems: value.length});
        }
    }

    if (obj.uniqueItems && expect(['array'])) {
        const dups = [];
        const dupidxs = [];
        const uniqs = [];
        value.forEach(function (t1, idx) {
            const c = value.filter(function (t2) {
                return deepEqual(t1, t2);
            });
            if (c.length > 1) {
                dupidxs.push(idx);
                c.forEach(function (ce, idx) {
                    if (uniqs.indexOf(ce) < 0) {
                        if (idx === 0) {
                            dups.push(ce);
                        }
                        uniqs.push(ce);
                    }
                });
            }
        });
        if (dups.length > 0) {
            errors.push({name: 'uniqueItems', uniqueItems: obj.uniqueItems, dups: dups, dupIndices: dupidxs});
        }
    }

    if (obj.contains && expect(['array'])) {
        const schema = new JsonSchema(obj.contains, true);
        if (value.filter(function (t) {
                return schema.validate(t).length === 0;
            }).length === 0) {
            errors.push({name: 'contains', contains: obj.contains});
        }
    }

    if (obj.maxProperties && expect(['object'])) {
        const nprops = Object.entries(value).length;
        if (nprops > obj.maxProperties) {
            errors.push({name: 'maxProperties', maxProperties: obj.maxProperties, actualProperties: nprops});
        }
    }

    if (obj.minProperties && expect(['object'])) {
        const nprops = Object.entries(value).length;
        if (nprops < obj.minProperties) {
            errors.push({name: 'minProperties', minProperties: obj.minProperties, actualProperties: nprops});
        }
    }

    if (obj.required && expect(['object'])) {
        const props = Object.entries(value).map(function (t) {
            return t[0];
        });
        const miss = obj.required.filter(function (t) {
            return props.indexOf(t) < 0;
        });
        if (miss.length > 0) {
            errors.push({name: 'required', required: obj.required, actualProperties: props, missingProperties: miss});
        }
    }

    if (obj.properties && expect(['object'])) {
        const errs = {};
        Object.entries(obj.properties).forEach(function (t) {
            if (value[t[0]]) {
                const es = new JsonSchema(t[1], true).validate(value[t[0]]);
                if (es.length > 0) {
                    errs[t[0]] = es;
                }
            }
        });
        if (Object.entries(errs).length > 0) {
            errors.push({name: 'properties', properties: obj.properties, errors: errs});
        }
    }

    if (obj.patternProperties && expect(['object'])) {
        const errs = {};
        const regs = Object.entries(obj.patternProperties).map(function (t) {
            return {reg: new RegExp(t[0]), schema: new JsonSchema(t[1], true)}
        });
        Object.entries(value).forEach(function (t) {
            regs.filter(function (e) {
                if (e.reg.test(t[0])) {
                    const es = e.schema.validate(t[1]);
                    if (es.length > 0) {
                        errs[t[0]] = es;
                    }
                }
            })
        });

        if (Object.entries(errs).length > 0) {
            errors.push({name: 'patternProperties', patternProperties: obj.patternProperties, errors: errs});
        }
    }

    if (obj.additionalProperties && expect(['object'])) {
        const errs = {};
        const regs = [];
        const lits = [];

        const schema = new JsonSchema(obj.additionalProperties, true);

        if (obj.patternProperties) {
            Object.entries(obj.patternProperties).forEach(function (t) {
                regs.push(new RegExp(t[0]));
            });
        }

        if (obj.properties) {
            Object.entries(obj.properties).forEach(function (t) {
                lits.push(t[0]);
            });
        }

        Object.entries(value).forEach(function (t) {
            if (lits.indexOf(t[0]) >= 0 || regs.filter(function (o) {
                    return o.test(t[0]);
                }).length > 0) {
                return;
            }
            const es = schema.validate(t[1]);
            if (es.length > 0) {
                errs[t[0]] = es;
            }
        });

        if (Object.entries(errs).length > 0) {
            errors.push({name: 'additionalProperties', additionalProperties: obj.additionalProperties, errors: errs});
        }
    }

    if (obj.dependencies && expect(['object'])) {
        const errs = {};
        Object.entries(obj.dependencies).forEach(function (t) {
            if (t[0] in value) {
                if (resolveType(t[1]) === 'array') {
                    const ms = t[1].filter(function (o) {
                        return !(o in value);
                    });
                    if (ms.length > 0) {
                        errs[t[0]] = [{name: 'required', required: t[1], actualProperties: Object.entries(value).map(function (x) { return x[0]; }), missingProperties: t[1], value: value}];
                    }
                } else {
                    const schema = new JsonSchema(t[1], true);
                    const es = schema.validate(value);
                    if (es.length > 0) {
                        errs[t[0]] = es;
                    }
                }
            }
        });

        if (Object.entries(errs).length > 0) {
            errors.push({name: 'dependencies', dependencies: obj.dependencies, errors: errs});
        }
    }

    if (obj.propertyNames && expect(['object'])) {
        const reg = new RegExp(obj.propertyNames);
        const miss = [];
        if (Object.entries(value).filter(function (t) {
                if (!reg.test(t[0])) {
                    miss.push(t[0]);
                    return true;
                }
                return false;
            }).length > 0) {
            errors.push({name: 'propertyNames', propertyNames: obj.propertyNames, actualProperties: Object.entries(value).map(function (t) {
                return t[0];
            }), missmatchProperties: miss});
        }
    }

    if (obj.enum) {
        if (obj.enum.filter(function (x) { return deepEqual(x, value)}).length === 0) {
            errors.push({name: 'enum', enum: obj.enum});
        }
    }

    if (obj.const) {
        if (!deepEqual(obj.const, value)) {
            errors.push({name: 'const', const: obj.const});
        }
    }

    if (obj.type) {
        const types = Array.isArray(obj.type) ? obj.type : [obj.type];
        const vt = resolveType(value);
        if (types.indexOf(vt) < 0 && !(vt === 'integer' && types.indexOf('number') >= 0)) {
            types.forEach(function (t) { expected.push(t) });
        }
    }

    if (obj.allOf) {
        const errs = [];
        obj.allOf.forEach(function (t) {
            new JsonSchema(t, true).validate(value).forEach(function (e) {
                errs.push(e);
            });
        });
        if (errs.length > 0) {
            errors.push({name: 'allOf', allOf: obj.allOf, errors: errs});
        }
    }

    if (obj.anyOf) {
        const errs = [];
        var success = false;
        obj.anyOf.forEach(function (t) {
            const es = new JsonSchema(t, true).validate(value);
            if (es.length === 0) {
                success = true;
            }
            return es.forEach(function (e) {
                errs.push(e);
            });
        });
        if (!success) {
            errors.push({name: 'anyOf', anyOf: obj.anyOf, errors: errs});
        }
    }

    if (obj.oneOf) {
        const errs = obj.oneOf.map(function (t) {
            return new JsonSchema(t, true).validate(value);
        });
        if (errs.filter(function (t) {
                return t.length === 0;
            }).length !== 1) {
            const matched = errs.map(function (t, idx) {
                if (t.length === 0) {
                    return obj.oneOf[idx];
                } else {
                    return null;
                }
            }).filter(function (t) {
                return t !== null;
            });
            errors.push({name: 'oneOf', oneOf: obj.oneOf, matched: matched});
        }
    }

    if (obj.not) {
        if (new JsonSchema(obj.not, true).validate(value).length === 0) {
            errors.push({name: 'not', not: obj.not});
        }
    }

    if (expected.length > 0) {
        errors.push({name: 'type', expectedTypes: expected, actualType: type, value: value});
    }
    return errors.map(function (t) {
        t['value'] = value;
        return t;
    });
};

JsonSchema.prototype.translate = function (error, lang) {
    function interpolate(err, message) {
        Object.entries(err).forEach(function (t) {
            if ((typeof t[1]) === 'object') {
                if (t[0] === 'value' || Array.isArray(t[1])) {
                    if (t[0] === 'value') {
                        message = message.replace('{' + t[0] + '}', JSON.stringify(t[1]));
                    } else if (t[0] === 'matched') {
                        message = message.replace('{' + t[0] + '}', t[1].map(JSON.stringify));
                    } else {
                        message = message.replace('{' + t[0] + '}', t[1]);
                    }
                } else {
                    const m = Object.entries(t[1]).map(function (e) {
                        return '(' + e[0] + ': ' + e[1] + ')';
                    });
                    message = message.replace('{' + t[0] + '}', m);
                }
            } else {
                message = message.replace('{' + t[0] + '}', t[1]);
            }
        });
        return message;
    }
    lang = (lang) ? lang : 'en';
    const messages = require('./langs/' + lang);
    const message = messages[error.name];

    switch (error.name) {
        case 'multipleOf':
        case 'maximum':
        case 'exclusiveMaximum':
        case 'minimum':
        case 'exclusiveMinimum':
        case 'maxLength':
        case 'minLength':
        case 'pattern':
        case 'maxItems':
        case 'minItems':
        case 'uniqueItems':
        case 'contains':
        case 'maxProperties':
        case 'minProperties':
        case 'required':
        case 'propertyNames':
        case 'enum':
        case 'const':
        case 'type':
        case 'oneOf':
        case 'not':
            return interpolate(error, message);
        case 'items':
            return interpolate(Object.assign({}, error, {
                errors: Object.entries(error.errors).map(function (t) {
                    return [t[0], t[1].map(function (e) {
                        return JsonSchema.prototype.translate(e, lang);
                    })];
                }).reduce(function (obj, t) {
                    t[1].forEach(function (k) {
                        obj.push(k);
                    });
                    return obj;
                }, []).join(', ')
            }), message);
        case 'properties':
        case 'patternProperties':
        case 'additionalProperties':
        case 'dependencies':
            return interpolate(Object.assign({}, error, {
                errors: Object.entries(error.errors).map(function (t) {
                    return [t[0], t[1].map(function (e) {
                        return JsonSchema.prototype.translate(e, lang);
                    })];
                }).reduce(function (obj, t) {
                    obj[t[0]] = t[1];
                    return obj;
                }, {})
            }), message);
            break;
        case 'allOf':
        case 'anyOf':
            return interpolate(Object.assign({}, error, {
                errors: error.errors.map(function (t) {
                    return JsonSchema.prototype.translate(t, lang);
                })
            }), message);
            break;
    }
};

JsonSchema.prototype.validateTranslate = function (value, lang) {
    return this.validate(value).map(function (t) {
        return JsonSchema.prototype.translate(t, lang);
    });
};

JsonSchema.prototype.inferType = function () {
    if (this.schema.type) {
        return this.schema.type;
    }
    if (this.schema.multipleOf || this.schema.maximum || this.schema.minimum || this.schema.exclusiveMaximum || this.schema.exclusiveMinimum) {
        return 'number';
    }
    if (this.schema.minLength || this.schema.maxLength || this.schema.pattern) {
        return 'string';
    }
    if (this.schema.items || this.schema.maxItems || this.schema.minItems || this.schema.uniqueItems || this.schema.contains) {
        return 'array';
    }
    if (this.schema.maxProperties || this.schema.minProperties || this.schema.required || this.schema.properties || this.schema.patternProperties || this.schema.additionalProperties || this.schema.dependencies || this.schema.propertyNames) {
        return 'object';
    }
    return null;
};