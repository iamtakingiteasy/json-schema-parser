const test = require('tape');
const JsonSchema = require('./schema');

test('parseref', function (t) {
    new JsonSchema(
        {
            type: 'object',
            properties: {
                username: {
                    type: 'string'
                },
                settings: {
                    $ref: '#/definitions/SettingsDTO'
                }
            },
            definitions: {
                SettingsDTO: {
                    type: 'object',
                    properties: {
                        language: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 2
                        }
                    }
                }
            }
        }
    ).resolve().then(function (res) {
        t.deepEqual(res, {
            type: 'object',
            properties: {
                username: {
                    type: 'string'
                },
                settings: {
                    type: 'object',
                    properties: {
                        language: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 2
                        }
                    }
                }
            },
            definitions: {
                SettingsDTO: {
                    type: 'object',
                    properties: {
                        language: {
                            type: 'string',
                            minLength: 2,
                            maxLength: 2
                        }
                    }
                }
            }
        });
        t.end();
    });
});

test('cyclic', function (t) {
    new JsonSchema(
        {
            type: 'object',
            properties: {
                a: {
                    $ref: '#/properties/b'
                },
                b: {
                    $ref: '#/properties/c'
                },
                c: {
                    $ref: '#/properties/a'
                }
            }
        }
    ).resolve().then(function (succ) {
        t.fail();
    }, function (err) {
        t.end();
    });
});

test('array', function (t) {
    new JsonSchema(
        {
            type: 'object',
            properties: {
                a: [1,2,{
                    $ref: '#/properties/b'
                },3,4,5],
                b: {
                    type: 'string'
                }
            }
        }
    ).resolve().then(function (succ) {
        t.end();
    }, function (err) {
        t.fail(err);
    });
});

test('url', function (t) {
    new JsonSchema(
        {
            type: 'object',
            properties: {
                $ref: 'http://json-schema.org/example/card.json#/properties/geo/properties'
            }
        }
    ).resolve().then(function (succ) {
        t.end();
    }, function (err) {
        t.fail(err);
    });
});

test('validate-multipleOf', function (t) {
    t.deepEqual(new JsonSchema({
        multipleOf: 7
    }, true).validate(1), [{name: 'multipleOf', multipleOf: 7, actualReminder: 1, value: 1}]);
    t.deepEqual(new JsonSchema({
        multipleOf: 7
    }, true).validate(7), []);
    t.deepEqual(new JsonSchema({
        multipleOf: 7
    }, true).validate('lol'), [{name: 'type', expectedTypes: ['number', 'integer'], actualType: 'string', value: 'lol'}]);
    t.end();

});

test('validate-maximum', function (t) {
    t.deepEqual(new JsonSchema({
        maximum: 7
    }, true).validate(9), [{name: 'maximum', maximum: 7, value: 9}]);
    t.deepEqual(new JsonSchema({
        maximum: 7
    }, true).validate(7), []);
    t.deepEqual(new JsonSchema({
        maximum: 7
    }, true).validate('lol'), [{name: 'type', expectedTypes: ['number', 'integer'], actualType: 'string', value: 'lol'}]);
    t.end();
});

test('validate-exclusiveMaximum', function (t) {
    t.deepEqual(new JsonSchema({
        exclusiveMaximum: 7
    }, true).validate(7), [{name: 'exclusiveMaximum', exclusiveMaximum: 7, value: 7}]);
    t.deepEqual(new JsonSchema({
        exclusiveMaximum: 7
    }, true).validate(6), []);
    t.deepEqual(new JsonSchema({
        exclusiveMaximum: 7
    }, true).validate('lol'), [{name: 'type', expectedTypes: ['number', 'integer'], actualType: 'string', value: 'lol'}]);
    t.end();
});

test('validate-minimum', function (t) {
    t.deepEqual(new JsonSchema({
        minimum: 7
    }, true).validate(5), [{name: 'minimum', minimum: 7, value: 5}]);
    t.deepEqual(new JsonSchema({
        minimum: 7
    }, true).validate(7), []);
    t.deepEqual(new JsonSchema({
        minimum: 7
    }, true).validate('lol'), [{name: 'type', expectedTypes: ['number', 'integer'], actualType: 'string', value: 'lol'}]);
    t.end();
});

test('validate-exclusiveMinimum', function (t) {
    t.deepEqual(new JsonSchema({
        exclusiveMinimum: 7
    }, true).validate(7), [{name: 'exclusiveMinimum', exclusiveMinimum: 7, value: 7}]);
    t.deepEqual(new JsonSchema({
        exclusiveMinimum: 7
    }, true).validate(8), []);
    t.deepEqual(new JsonSchema({
        exclusiveMinimum: 7
    }, true).validate('lol'), [{name: 'type', expectedTypes: ['number', 'integer'], actualType: 'string', value: 'lol'}]);
    t.end();
});

test('validate-maxLength', function (t) {
    t.deepEqual(new JsonSchema({
        maxLength: 7
    }, true).validate('abcdefgh'), [{name: 'maxLength', maxLength: 7, actualLength: 8, value: 'abcdefgh'}]);
    t.deepEqual(new JsonSchema({
        maxLength: 7
    }, true).validate('abcdefg'), []);
    t.deepEqual(new JsonSchema({
        maxLength: 7
    }, true).validate(32), [{name: 'type', expectedTypes: ['string'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-minLength', function (t) {
    t.deepEqual(new JsonSchema({
        minLength: 7
    }, true).validate('abcdef'), [{name: 'minLength', minLength: 7, actualLength: 6, value: 'abcdef'}]);
    t.deepEqual(new JsonSchema({
        minLength: 7
    }, true).validate('abcdefg'), []);
    t.deepEqual(new JsonSchema({
        minLength: 7
    }, true).validate(32), [{name: 'type', expectedTypes: ['string'], actualType: 'integer', value :32}]);
    t.end();
});

test('validate-pattern', function (t) {
    t.deepEqual(new JsonSchema({
        pattern: '^abc.*efg$'
    }, true).validate('zzzabcefgzzz'), [{name: 'pattern', pattern: '^abc.*efg$', value: 'zzzabcefgzzz'}]);
    t.deepEqual(new JsonSchema({
        pattern: '^abc.*efg$'
    }, true).validate('abcdefg'), []);
    t.deepEqual(new JsonSchema({
        pattern: '^abc.*efg$'
    }, true).validate(32), [{name: 'type', expectedTypes: ['string'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-items-scalar', function (t) {
    t.deepEqual(new JsonSchema({
        items: {
            maximum: 7
        }
    }, true).validate([1,2,3,4,5,6,7,8]), [{name: 'items', items: {maximum: 7}, errors: {7: [{name: 'maximum', maximum: 7, value: 8}]}, value: [1,2,3,4,5,6,7,8]}]);
    t.deepEqual(new JsonSchema({
        items: {
            maximum: 7
        }
    }, true).validate([1,2,3,4,5,6,7]), []);
    t.deepEqual(new JsonSchema({
        items: {
            maximum: 7
        }
    }, true).validate(32), [{name: 'type', expectedTypes: ['array'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-items-array', function (t) {
    t.deepEqual(new JsonSchema({
        items: [{
            maximum: 7
        }, {
            maximum: 5
        }]
    }, true).validate([9,8]), [{name: 'items', items: [{maximum: 7}, {maximum: 5}], errors: {0: [{name: 'maximum', maximum: 7, value: 9}], 1: [{name: 'maximum', maximum: 5, value: 8}]}, value: [9,8]}]);
    t.deepEqual(new JsonSchema({
        items: [{
            maximum: 7
        }, {
            maximum: 5
        }]
    }, true).validate([1,2]), []);
    t.deepEqual(new JsonSchema({
        items: [{
            maximum: 7
        }, {
            maximum: 5
        }]
    }, true).validate(32), [{name: 'type', expectedTypes: ['array'], actualType: 'integer', value: 32}]);
    t.deepEqual(new JsonSchema({
        items: [{
            maximum: 7
        }, {
            maximum: 5
        }]
    }, true).validate([1,2,3,4]), [{name: 'items', items: [{maximum: 7}, {maximum: 5}], errors: {2: [{name: 'maxItems', maxItems: 2, actualItems: 4}], 3: [{name: 'maxItems', maxItems: 2, actualItems: 4}]}, value: [1,2,3,4]}]);
    t.end();
});

test('validate-maxItems', function (t) {
    t.deepEqual(new JsonSchema({
        maxItems: 7
    }, true).validate([1,2,3,4,5,6,7,8]), [{name: 'maxItems', maxItems: 7, actualItems: 8, value: [1,2,3,4,5,6,7,8]}]);
    t.deepEqual(new JsonSchema({
        maxItems: 7
    }, true).validate([1,2,3,4,5,6,7]), []);
    t.deepEqual(new JsonSchema({
        maxItems: 7
    }, true).validate(32), [{name: 'type', expectedTypes: ['array'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-minItems', function (t) {
    t.deepEqual(new JsonSchema({
        minItems: 7
    }, true).validate([1,2,3,4,5,6]), [{name: 'minItems', minItems: 7, actualItems: 6, value: [1,2,3,4,5,6]}]);
    t.deepEqual(new JsonSchema({
        minItems: 7
    }, true).validate([1,2,3,4,5,6,7]), []);
    t.deepEqual(new JsonSchema({
        maxItems: 7
    }, true).validate(32), [{name: 'type', expectedTypes: ['array'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-uniqueItems', function (t) {
    t.deepEqual(new JsonSchema({
        uniqueItems: true
    }, true).validate([1,2,1]), [{name: 'uniqueItems', uniqueItems: true, dupIndices: [0, 2], dups: [1], value: [1,2,1]}]);
    t.deepEqual(new JsonSchema({
        uniqueItems: true
    }, true).validate([1,2,3]), []);
    t.deepEqual(new JsonSchema({
        uniqueItems: true
    }, true).validate(32), [{name: 'type', expectedTypes: ['array'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-contains', function (t) {
    t.deepEqual(new JsonSchema({
        contains: {
            maximum: 5
        }
    }, true).validate([10, 9, 8]), [{name: 'contains', contains: {maximum: 5}, value: [10, 9, 8]}]);
    t.deepEqual(new JsonSchema({
        contains: {
            maximum: 5
        }
    }, true).validate([5,6,7]), []);
    t.deepEqual(new JsonSchema({
        contains: {
            maximum: 5
        }
    }, true).validate(32), [{name: 'type', expectedTypes: ['array'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-maxProperties', function (t) {
    t.deepEqual(new JsonSchema({
        maxProperties: 1
    }, true).validate({foo: 'bar', baz: 'qux'}), [{name: 'maxProperties', maxProperties: 1, actualProperties: 2, value: {foo: 'bar', baz: 'qux'}}]);
    t.deepEqual(new JsonSchema({
        maxProperties: 1
    }, true).validate({foo: 'bar'}), []);
    t.deepEqual(new JsonSchema({
        maxProperties: 1
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-minProperties', function (t) {
    t.deepEqual(new JsonSchema({
        minProperties: 2
    }, true).validate({foo: 'bar'}), [{name: 'minProperties', minProperties: 2, actualProperties: 1, value: {foo: 'bar'}}]);
    t.deepEqual(new JsonSchema({
        minProperties: 2
    }, true).validate({foo: 'bar', baz: 'qux'}), []);
    t.deepEqual(new JsonSchema({
        minProperties: 2
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-required', function (t) {
    t.deepEqual(new JsonSchema({
        required: ['foo', 'baz']
    }, true).validate({foo: 'bar'}), [{name: 'required', required: ['foo', 'baz'], actualProperties: ['foo'], missingProperties: ['baz'], value: {foo: 'bar'}}]);
    t.deepEqual(new JsonSchema({
        required: ['foo', 'baz']
    }, true).validate({foo: 'bar', baz: 'qux'}), []);
    t.deepEqual(new JsonSchema({
        required: ['foo', 'baz']
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-properties', function (t) {
    t.deepEqual(new JsonSchema({
        properties: {
            foo: {
                maximum: 5
            }
        }
    }, true).validate({foo: 10}), [{name: 'properties', properties: {foo: {maximum: 5}}, errors: {foo: [{name: 'maximum', maximum: 5, value: 10}]}, value: {foo: 10}}]);
    t.deepEqual(new JsonSchema({
        properties: {
            foo: {
                maximum: 5
            }
        }
    }, true).validate({foo: 5}), []);
    t.deepEqual(new JsonSchema({
        properties: {
            foo: {
                maximum: 5
            }
        }
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-patternProperties', function (t) {
    t.deepEqual(new JsonSchema({
        patternProperties: {
            '^f.o$': {
                maximum: 5
            }
        }
    }, true).validate({fzo: 10}), [{name: 'patternProperties', patternProperties: {'^f.o$': {maximum: 5}}, errors: {fzo: [{name: 'maximum', maximum: 5, value: 10}]}, value: {fzo: 10}}]);
    t.deepEqual(new JsonSchema({
        patternProperties: {
            '^f.o$': {
                maximum: 5
            }
        }
    }, true).validate({fzo: 5}), []);
    t.deepEqual(new JsonSchema({
        patternProperties: {
            '^f.o$': {
                maximum: 5
            }
        }
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();    
});

test('validate-additionalProperties', function (t) {
    t.deepEqual(new JsonSchema({
        additionalProperties: {
            minimum: 1
        },
        properties: {
            bar : {
                minimum: 7
            }
        },
        patternProperties: {
            '^f.o$': {
                maximum: 5
            }
        }
    }, true).validate({baka: 0}), [{name: 'additionalProperties', additionalProperties: {minimum: 1}, errors: {baka: [{name: 'minimum', minimum: 1, value: 0}]}, value: {baka: 0}}]);
    t.deepEqual(new JsonSchema({
        additionalProperties: {
            minimum: 1
        },
        properties: {
            bar : {
                minimum: 7
            }
        },
        patternProperties: {
            '^f.o$': {
                maximum: 5
            }
        }
    }, true).validate({baka: 5}), []);
    t.deepEqual(new JsonSchema({
        additionalProperties: {
            minimum: 1
        },
        properties: {
            bar : {
                minimum: 7
            }
        },
        patternProperties: {
            '^f.o$': {
                maximum: 5
            }
        }
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-dependencies-props', function (t) {
    t.deepEqual(new JsonSchema({
        dependencies: {
            foo: ['bar']
        }
    }, true).validate({foo: 123}), [{name: 'dependencies', dependencies: {foo: ['bar']}, errors: {foo: [{name: 'required', required: ['bar'], actualProperties: ['foo'], missingProperties: ['bar'], value: {foo: 123}}]}, value: {foo: 123}}]);
    t.deepEqual(new JsonSchema({
        dependencies: {
            foo: ['bar']
        }
    }, true).validate({foo: 123, bar: 345}), []);
    t.deepEqual(new JsonSchema({
        dependencies: {
            foo: ['bar']
        }
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-dependencies-schema', function (t) {
    t.deepEqual(new JsonSchema({
        dependencies: {
            foo: {
                required: ['bar']
            }
        }
    }, true).validate({foo: 123}), [{name: 'dependencies', dependencies: {foo: {required: ['bar']}}, errors: {foo: [{name: 'required', required: ['bar'], actualProperties: ['foo'], missingProperties: ['bar'], value: {foo: 123}}]}, value: {foo: 123}}]);
    t.deepEqual(new JsonSchema({
        dependencies: {
            foo: {
                required: ['bar']
            }
        }
    }, true).validate({foo: 123, bar: 345}), []);
    t.deepEqual(new JsonSchema({
        dependencies: {
            foo: {
                required: ['bar']
            }
        }
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});


test('validate-propertyNames', function (t) {
    t.deepEqual(new JsonSchema({
        propertyNames: '^f.o$'
    }, true).validate({bar: 123}), [{name: 'propertyNames', propertyNames: '^f.o$', actualProperties: ['bar'], missmatchProperties: ['bar'], value: {bar: 123}}]);
    t.deepEqual(new JsonSchema({
        propertyNames: '^f.o$'
    }, true).validate({fzo: 123}), []);
    t.deepEqual(new JsonSchema({
        propertyNames: '^f.o$'
    }, true).validate(32), [{name: 'type', expectedTypes: ['object'], actualType: 'integer', value: 32}]);
    t.end();
});

test('validate-enum', function (t) {
    t.deepEqual(new JsonSchema({
        enum: [1,2,3]
    }, true).validate(5), [{name: 'enum', enum: [1,2,3], value: 5}]);
    t.deepEqual(new JsonSchema({
        enum: [1,2,3]
    }, true).validate(2), []);
    t.end();
});

test('validate-const', function (t) {
    t.deepEqual(new JsonSchema({
        const: {a: 123}
    }, true).validate(5), [{name: 'const', const: {a: 123}, value: 5}]);
    t.deepEqual(new JsonSchema({
        const: {a: 123}
    }, true).validate({a: 123}), []);
    t.end();
});

test('validate-type', function (t) {
    t.deepEqual(new JsonSchema({
        type: 'string'
    }, true).validate(5), [{name: 'type', expectedTypes: ['string'], actualType: 'integer', value: 5}]);
    t.deepEqual(new JsonSchema({
        type: 'string'
    }, true).validate('abc'), []);
    t.end();
});

test('validate-allOf', function (t) {
    t.deepEqual(new JsonSchema({
        allOf: [{type: 'string'}, {minLength: 3}]
    }, true).validate('ab'), [{name: 'allOf', allOf: [{ type: 'string'}, {minLength: 3}], errors: [{name: 'minLength', minLength: 3, actualLength: 2, value: 'ab'}], value: 'ab'}]);
    t.deepEqual(new JsonSchema({
        allOf: [{type: 'string'}, {minLength: 3}]
    }, true).validate('abc'), []);
    t.end();
});

test('validate-anyOf', function (t) {
    t.deepEqual(new JsonSchema({
        anyOf: [{type: 'string'}, {type: 'number'}]
    }, true).validate({a: 123}), [{name: 'anyOf', anyOf: [{type: 'string'}, {type: 'number'}], errors: [{name: 'type', expectedTypes: ['string'], actualType: 'object', value: {a: 123}}, {name: 'type', expectedTypes: ['number'], actualType: 'object', value: {a: 123}}], value: {a: 123}}]);
    t.deepEqual(new JsonSchema({
        anyOf: [{type: 'string'}, {type: 'number'}]
    }, true).validate('abc'), []);
    t.end();
});

test('validate-oneOf', function (t) {
    t.deepEqual(new JsonSchema({
        oneOf: [{type: 'string'}, {maxLength: 3}, {type: 'boolean'}]
    }, true).validate("abc"), [{name: 'oneOf', oneOf: [{type: 'string'}, {maxLength: 3}, {type: 'boolean'}], matched: [{type: 'string'}, {maxLength: 3}], value: 'abc'}]);
    t.deepEqual(new JsonSchema({
        oneOf: [{type: 'string'}, {maxLength: 3}]
    }, true).validate('abcd'), []);
    t.end();
});

test('validate-not', function (t) {
    t.deepEqual(new JsonSchema({
        not: {enum: [1,2,3]}
    }, true).validate(2), [{name: 'not', not: {enum: [1,2,3]}, value: 2}]);
    t.deepEqual(new JsonSchema({
        not: {enum: [1,2,3]}
    }, true).validate(5), []);
    t.end();
});