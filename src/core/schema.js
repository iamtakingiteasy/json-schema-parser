const JsonRef = require('./jsonref');
const fetch = require('whatwg-fetch');

exports = module.exports = JsonSchema;

function JsonSchema(schema) {
    this.schema = schema;
}
JsonSchema.prototype.resolve = function () {
    const tores = {};
    function iterator(obj, pkey) {
        return Promise.all(Object.entries(obj).map(function (t) {
            if (t[0] === '$ref') {
                const ref = new JsonRef(t[1]);
                if (ref.url === null) {
                    tores[pkey] = ref;
                    return [];
                } else {
                    return fetch(ref.url).then(function (resp) {
                        if (!resp.ok) {
                            throw new Error("fetch error");
                        }
                        return resp.json();
                    }).then(function (json) {
                        return iterator(ref.match(json)).then(function (r) {
                            return Promise.resolve(Object.entries(r));
                        });
                    });
                }
            } else {
                if ((typeof t[1]) === 'object') {
                    if (Array.isArray(t[1])) {
                        return Promise.all(t[1].map(function (e) {
                            if ((typeof e) === 'object') {
                                return iterator(e, t[0]);
                            } else {
                                return Promise.resolve(e);
                            }
                        })).then(function (r) {
                            return Promise.resolve([[t[0], r]]);
                        });
                    } else {
                        return iterator(t[1], t[0]).then(function (r) {
                            return Promise.resolve([[t[0], r]]);
                        });
                    }
                } else {
                    return Promise.resolve([t]);
                }
            }
        })).then(function (r) {
            const result = {};
            r.forEach(function (t) {
                t.forEach(function (x) {
                    result[x[0]] = x[1];
                });
            });
            return Promise.resolve(result);
        });
    }
    return iterator(this.schema, null).then(function (r) {
        const resolved = [];
        function proc(v) {
            if (resolved.indexOf(v) >= 0) {
                throw new Error("circular reference detected");
            }
            resolved.push(v);
            const parts = tores[v].parts;
            if (parts.length > 0 && parts[0] in tores) {
                proc(parts[0]);
                r[v] = tores[v].match(r);
                delete tores[v];
            } else {
                r[v] = tores[v].match(r);
                delete tores[v];
            }
        }
        while (Object.entries(tores).length > 0) {
            for (const v in tores) {
                if (tores.hasOwnProperty(v)) {
                    proc(v);
                    break;
                }
            }
        }
        return Promise.resolve(r);
    });
};