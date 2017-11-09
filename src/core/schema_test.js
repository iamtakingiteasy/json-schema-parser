const test = require('tape');
const JsonSchema = require('./schema');

test('parse', function (t) {
    new JsonSchema(
        {"$schema":"http://json-schema.org/draft-04/schema#","title":"Signup DTO","type":"object","additionalProperties":false,"properties":{"username":{"type":"string","minLength":3,"maxLength":50},"password":{"type":"string","minLength":3,"maxLength":50},"email":{"type":"string","pattern":"(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21-\\x5a\\x53-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])+)\\])"},"captcha":{"type":"string"},"settings":{"$ref":"#/definitions/SettingsDTO"}},"required":["settings"],"definitions":{"SettingsDTO":{"type":"object","additionalProperties":false,"properties":{"language":{"type":"string","minLength":2,"maxLength":2}}}}}
    ).resolve().then(console.log, console.warn);
    t.end();
});