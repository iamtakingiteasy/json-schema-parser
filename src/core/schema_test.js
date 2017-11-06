const test = require('tape');
const JsonSchema = require('./schema');

test('parse', function (t) {
    /*
    const schema = new JsonSchema({
        "id": "http://some.site.somewhere/entry-schema#",
        "$schema": "http://json-schema.org/draft-06/schema#",
        "description": "schema for an fstab entry",
        "type": "object",
        "required": [ "storage" ],
        "properties": {
            "storage": {
                "type": "object",
                "oneOf": [
                    { "$ref": "#/definitions/diskDevice" },
                    { "$ref": "#/definitions/diskUUID" },
                    { "$ref": "#/definitions/nfs" },
                    { "$ref": "#/definitions/tmpfs" }
                ]
            },
            "fstype": {
                "enum": [ "ext3", "ext4", "btrfs" ]
            },
            "options": {
                "type": "array",
                "minItems": 1,
                "items": { "type": "string" },
                "uniqueItems": true
            },
            "readonly": { "type": "boolean" }
        },
        "definitions": {
            "diskDevice": {
                "properties": {
                    "type": { "enum": [ "disk" ] },
                    "device": {
                        "type": "string",
                        "pattern": "^/dev/[^/]+(/[^/]+)*$"
                    }
                },
                "required": [ "type", "device" ],
                "additionalProperties": false
            },
            "diskUUID": {
                "properties": {
                    "type": { "enum": [ "disk" ] },
                    "label": {
                        "type": "string",
                        "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$"
                    }
                },
                "required": [ "type", "label" ],
                "additionalProperties": false
            },
            "nfs": {
                "properties": {
                    "type": { "enum": [ "nfs" ] },
                    "remotePath": {
                        "type": "string",
                        "pattern": "^(/[^/]+)+$"
                    },
                    "server": {
                        "type": "string",
                        "oneOf": [
                            { "format": "hostname" },
                            { "format": "ipv4" },
                            { "format": "ipv6" }
                        ]
                    }
                },
                "required": [ "type", "server", "remotePath" ],
                "additionalProperties": false
            },
            "tmpfs": {
                "properties": {
                    "type": { "enum": [ "tmpfs" ] },
                    "sizeInMB": {
                        "type": "integer",
                        "minimum": 16,
                        "maximum": 512
                    }
                },
                "required": [ "type", "sizeInMB" ],
                "additionalProperties": false
            }
        }
    });
    */
    t.deepEquals(new JsonSchema({
        'type': 'null'
    }).schema, {type: 'null'});
    t.deepEquals(new JsonSchema({
        'id': 'http://some.site.somewhere/entry-schema#',
        'type': 'null'
    }).schema, {id: 'http://some.site.somewhere/entry-schema#', type: 'null'});
    t.deepEquals(new JsonSchema({
        '$id': 'http://some.site.somewhere/entry-schema#',
        'type': 'null'
    }).schema, {id: 'http://some.site.somewhere/entry-schema#', type: 'null'});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'const': 123
    }).schema, {type: 'integer', const: 123});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'title': 'test'
    }).schema, {type: 'integer', title: 'test'});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'description': 'test'
    }).schema, {type: 'integer', description: 'test'});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'default': 123
    }).schema, {type: 'integer', default: 123});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'examples': [1,2,3]
    }).schema, {type: 'integer', examples: [1,2,3]});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'not': {
            'const': 3
        }
    }).schema, {type: 'integer', not: new JsonSchema({const: 3})});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'allOf': [
            {'minimum': 3},
            {'maximum': 10}
        ]
    }).schema, {type: 'integer', 'allOf': [new JsonSchema({minimum: 3}), new JsonSchema({maximum: 10})]});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'anyOf': [
            {'minimum': 3},
            {'maximum': 10}
        ]
    }).schema, {type: 'integer', 'anyOf': [new JsonSchema({minimum: 3}), new JsonSchema({maximum: 10})]});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'oneOf': [
            {'const': 3},
            {'const': 10}
        ]
    }).schema, {type: 'integer', 'oneOf': [new JsonSchema({const: 3}), new JsonSchema({const: 10})]});
    t.deepEquals(new JsonSchema({
        'type': 'integer',
        'enum': [
            1,2,3
        ]
    }).schema, {type: 'integer', 'enum': [1,2,3]});
    t.deepEquals(new JsonSchema({
        'type': 'object',
        'required': [
            'a', 'b', 'c'
        ]
    }).schema, {type: 'object', 'required': ['a','b','c']});
    t.deepEquals(new JsonSchema({
        'type': 'object',
        'maxProperties': 3
    }).schema, {type: 'object', 'maxProperties': 3});
    t.deepEquals(new JsonSchema({
        'type': 'object',
        'minProperties': 3
    }).schema, {type: 'object', 'minProperties': 3});
    t.deepEquals(new JsonSchema({
        'type': 'object',
        'propertyNames': {
            'type': 'string'
        }
    }).schema, {type: 'object', 'propertyNames': new JsonSchema({'type': 'string'})});
    t.deepEquals(new JsonSchema({
        'type': 'object',
        'properties': {
            'a': {
                'type': 'string'
            }
        }
    }).schema, {type: 'object', 'properties': {'a': new JsonSchema({'type': 'string'})}});
    t.deepEquals(new JsonSchema({
        'type': 'object',
        'patternProperties': {
            '^a+$': {
                'type': 'string'
            }
        }
    }).schema, {type: 'object', 'patternProperties': {'^a+$': new JsonSchema({'type': 'string'})}});
    t.deepEquals(new JsonSchema({
        'type': 'object',
        'additionalProperties': false
    }).schema, {type: 'object', 'additionalProperties': false});
    t.deepEquals(new JsonSchema({
        'type': 'array',
        'items': {
            'type': 'number'
        }
    }).schema, {type: 'array', 'items': new JsonSchema({'type': 'number'})});
    t.deepEquals(new JsonSchema({
        'type': 'array',
        'items': [
            {
                'type': 'number'
            },
            {
                'type': 'string'
            }
        ]
    }).schema, {type: 'array', 'items': [new JsonSchema({'type': 'number'}), new JsonSchema({'type': 'string'})]});
    t.deepEquals(new JsonSchema({
        'type': 'array',
        'contains': {
            'type': 'number'
        }
    }).schema, {type: 'array', 'contains': new JsonSchema({'type': 'number'})});
    t.deepEquals(new JsonSchema({
        'type': 'array',
        'maxItems': 10
    }).schema, {type: 'array', 'maxItems': 10});
    t.deepEquals(new JsonSchema({
        'type': 'array',
        'minItems': 10
    }).schema, {type: 'array', 'minItems': 10});
    t.deepEquals(new JsonSchema({
        'type': 'array',
        'uniqueItems': false
    }).schema, {type: 'array', 'uniqueItems': false});
    t.deepEquals(new JsonSchema({
        'type': 'number',
        'minimum': 1
    }).schema, {type: 'number', 'minimum': 1});
    t.deepEquals(new JsonSchema({
        'type': 'number',
        'maximum': 1
    }).schema, {type: 'number', 'maximum': 1});
    t.deepEquals(new JsonSchema({
        'type': 'number',
        'exclusiveMinimum': 1
    }).schema, {type: 'number', 'exclusiveMinimum': 1});
    t.deepEquals(new JsonSchema({
        'type': 'number',
        'exclusiveMaximum': 1
    }).schema, {type: 'number', 'exclusiveMaximum': 1});
    t.deepEquals(new JsonSchema({
        'type': 'number',
        'multipleOf': 7
    }).schema, {type: 'number', 'multipleOf': 7});
    t.deepEquals(new JsonSchema({
        'type': 'string',
        'minLength': 5
    }).schema, {type: 'string', 'minLength': 5});
    t.deepEquals(new JsonSchema({
        'type': 'string',
        'maxLength': 5
    }).schema, {type: 'string', 'maxLength': 5});
    t.deepEquals(new JsonSchema({
        'type': 'string',
        'pattern': '^a+$'
    }).schema, {type: 'string', 'pattern': '^a+$'});
    t.end();
});