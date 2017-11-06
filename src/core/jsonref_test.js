const test = require('tape');
const JsonRef = require('./jsonref');

test('parse', function (t) {
    t.deepEqual(new JsonRef(''), {url: null, parts: []});
    t.deepEqual(new JsonRef('/'), {url: null, parts: ['']});
    t.deepEqual(new JsonRef('/a/b/c'), {url: null, parts: ['a', 'b', 'c']});
    t.deepEqual(new JsonRef('#'), {url: null, parts: []});
    t.deepEqual(new JsonRef('#/'), {url: null, parts: ['']});
    t.deepEqual(new JsonRef('#/a/b/c'), {url: null, parts: ['a', 'b', 'c']});

    t.deepEqual(new JsonRef('efg'), {url: null, parts: ['efg']});
    t.deepEqual(new JsonRef('efg~1efg'), {url: null, parts: ['efg/efg']});
    t.deepEqual(new JsonRef('efg~0efg'), {url: null, parts: ['efg~efg']});

    t.deepEqual(new JsonRef('#a%20b%20c'), {url: null, parts: ['a b c']});
    t.end();
});

test('match', function (t) {
    const data = {
        'foo': ['bar', 'baz'],
        '': 0,
        'a/b': 1,
        'c%d': 2,
        'e^f': 3,
        'g|h': 4,
        'i\\j': 5,
        'k"l': 6,
        ' ': 7,
        'm~n': 8
    };

    t.deepEqual(new JsonRef('').match(data), data);
    t.deepEqual(new JsonRef('/').match(data), 0);
    t.deepEqual(new JsonRef('/a~1b').match(data), 1);
    t.deepEqual(new JsonRef('/c%d').match(data), 2);
    t.deepEqual(new JsonRef('/e^f').match(data), 3);
    t.deepEqual(new JsonRef('/g|h').match(data), 4);
    t.deepEqual(new JsonRef('/i\\j').match(data), 5);
    t.deepEqual(new JsonRef('/k"l').match(data), 6);
    t.deepEqual(new JsonRef('/ ').match(data), 7);
    t.deepEqual(new JsonRef('/m~0n').match(data), 8);
    t.deepEqual(new JsonRef('/foo').match(data), ['bar', 'baz']);
    t.deepEqual(new JsonRef('/foo/0').match(data), 'bar');


    t.deepEqual(new JsonRef('#').match(data), data);
    t.deepEqual(new JsonRef('#/').match(data), 0);
    t.deepEqual(new JsonRef('#/a~1b').match(data), 1);
    t.deepEqual(new JsonRef('#/c%25d').match(data), 2);
    t.deepEqual(new JsonRef('#/e%5ef').match(data), 3);
    t.deepEqual(new JsonRef('#/g%7ch').match(data), 4);
    t.deepEqual(new JsonRef('#/i%5cj').match(data), 5);
    t.deepEqual(new JsonRef('#/k%22l').match(data), 6);
    t.deepEqual(new JsonRef('#/%20').match(data), 7);
    t.deepEqual(new JsonRef('#/m~0n').match(data), 8);
    t.deepEqual(new JsonRef('#/foo').match(data), ['bar', 'baz']);
    t.deepEqual(new JsonRef('#/foo/0').match(data), 'bar');
    t.end();
});