exports = module.exports = JsonRef;

function JsonRef(refstr) {
    if (refstr.indexOf("#") >= 0) {
        const s = refstr.split("#");
        this.url = (s[0] === '') ? null : s[0];
        this.parts = this.parse(decodeURI(s[1]));
    } else {
        this.url = null;
        this.parts = this.parse(refstr);
    }
}

const mone = new RegExp("~1");
const mzero = new RegExp("~0");

function decodeRef(part) {
    return part.replace(mone, "/").replace(mzero, "~");
}

JsonRef.prototype.parse = function (refstr) {
    if (refstr === '') {
        return [];
    }
    if (refstr.startsWith('/')) {
        return refstr.substr(1).split('/').map(decodeRef);
    }
    return [decodeRef(refstr)];
};

JsonRef.prototype.match = function (json) {
    function iterate(rest, json) {
        if (rest.length === 0) {
            return json;
        }
        const current = rest[0];
        rest.shift();
        if ((typeof json) === 'object') {
            return iterate(rest, json[current]);
        } else if ((typeof json) === 'array') {
            const idx = parseInt(current);
            if (idx < json.length) {
                return iterate(rest, json[idx]);
            }
        }
        return undefined;
    }
    return iterate(this.parts, json);
};