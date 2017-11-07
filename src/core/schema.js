const JsonRef = require('./jsonref');
const fetch = require('whatwg-fetch');

exports = module.exports = JsonSchema;

function JsonSchema(schema, root) {
    this.parse(schema, root || this);
}

JsonSchema.prototype.parse = function (schema, root) {
    function setId(obj, key, type) {
        var arraycheck = false;
        if (type === 'array') {
            type = 'object';
            arraycheck = true;
        }
        if (key in schema) {
            if (type && (typeof schema[key]) !== type || (arraycheck && !Array.isArray(schema[key]))) {
                throw 'unexpected type ' + (typeof schema[key]) + ' for key ' + key;
            }
            obj[key] = schema[key];
        }
    }
    function setObj(obj, key) {
        if (key in schema) {
            if ((typeof schema[key]) !== 'object') {
                throw 'unexpected type ' + (typeof schema[key]) + ' for key ' + key;
            }
            obj[key] = new JsonSchema(schema[key], root);
        }
    }
    function setArrIds(obj, key) {
        if (key in schema) {
            if ((typeof schema[key]) !== 'object' || !Array.isArray(schema[key])) {
                throw 'unexpected type ' + (typeof schema[key]) + ' for key ' + key;
            }
            obj[key] = schema[key].map(function (e) {
                if ((typeof e) !== 'object') {
                    throw 'unexpected type ' + (typeof e) + ' for key ' + key;
                }
                return new JsonSchema(e, root);
            });
        }
    }
    function setObjIds(obj, key) {
        if (key in schema) {
            if ((typeof schema[key]) !== 'object') {
                throw 'unexpected type ' + (typeof schema[key]) + ' for key ' + key;
            }
            obj[key] = {};
            for (const v in schema[key]) {
                if (schema[key].hasOwnProperty(v)) {
                    if ((typeof schema[key][v]) !== 'object') {
                        throw 'unexpected type ' + (typeof schema[key][v]) + ' for key ' + key;
                    }
                    obj[key][v] = new JsonSchema(schema[key][v], root);
                }
            }
        }
    }

    if ((typeof schema) === 'string') {
        schema = JSON.parse(schema);
    }
    this.raw = schema;

    this.schema = {};
    const id = schema['$id'] || schema['id'];
    if (id) {
        this.schema.id = id;
    }
    setId(this.schema, 'type', 'string');
    setId(this.schema, 'const');
    setId(this.schema, 'title', 'string');
    setId(this.schema, 'description', 'string');
    setId(this.schema, 'default');
    setId(this.schema, 'examples', 'array');
    setObj(this.schema, 'not');
    setArrIds(this.schema, 'allOf');
    setArrIds(this.schema, 'anyOf');
    setArrIds(this.schema, 'oneOf');
    setId(this.schema, 'enum', 'array');
    if (schema['$ref']) {
        this.schema.type = 'ref';
        this.schema.ref = new JsonRef(schema['$ref']);
        this.schema.origin = root;
    } else if (this.schema.type) {
        switch (this.schema.type) {
            case 'null':
                break;
            case 'boolean':
                break;
            case 'object':
                setId(this.schema, 'required', 'array');
                setId(this.schema, 'maxProperties');
                setId(this.schema, 'minProperties');
                setId(this.schema, 'additionalProperties');
                setObj(this.schema, 'propertyNames');
                setObjIds(this.schema, 'properties');
                setObjIds(this.schema, 'patternProperties');
                break;
            case 'array':
                if (schema['items'] && Array.isArray(schema['items'])) {
                    setArrIds(this.schema, 'items');
                } else {
                    setObj(this.schema, 'items');
                }
                setObj(this.schema, 'contains');
                setId(this.schema, 'minItems');
                setId(this.schema, 'maxItems');
                setId(this.schema, 'uniqueItems');
                break;
            case 'integer':
            case 'number':
                setId(this.schema, 'minimum');
                setId(this.schema, 'maximum');
                setId(this.schema, 'exclusiveMaximum');
                setId(this.schema, 'exclusiveMinimum');
                setId(this.schema, 'multipleOf');
                break;
            case 'string':
                setId(this.schema, 'maxLength');
                setId(this.schema, 'minLength');
                setId(this.schema, 'pattern');
                break;
            default:
                throw 'unexpected type ' + this.schema.type;
                break
        }
    }
};

JsonSchema.prototype.process = function (rcv) {
    const schema = this.schema;
    return new Promise(function (resolve, reject) {
        switch (schema.type) {
            case 'ref':
                if (schema.ref.url === null) {
                    new JsonSchema(schema.ref.parse(schema.origin.raw)).process(rcv).then(resolve);
                } else {
                    return fetch(schema.ref.url).then(function (resp) {
                        return resp.json();
                    }).then(function (json) {
                        new JsonSchema(schema.ref.match(json)).process(rcv).then(resolve);
                    });
                }
                break;
            case 'null':
            case 'boolean':
            case 'object':
            case 'array':
            case 'integer':
            case 'number':
            case 'string':
                resolve(rcv(schema.type, schema));
                break;
            default:
                reject();
                break;
        }
    });
};