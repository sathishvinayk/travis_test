'use strict'

const dup = require('duplexify'),
    th2 = require('through2'),
    bl = require('bl'),
    pump = require('pump'),
    varint= require('varint'),
    nt = require('process-nextick-args'),
    inherits = require('inherits'),
    EE = require('events').EventEmitter,
    buf = require('safe-buffer').Buffer;

var jsonCodex = {
    encode: function(skull){
        return JSON.stringify(skull)
    },
    decode: function(buffer){
        return JSON.parse(buffer)
    }
}

function getCodex(skull){
    var codex = jsonCodex
    if(skull && skull.codex) codex = skull.codex
    return codex
}

function encoder(skull){
    var writable = th2.obj(encode)
    writable._codex = getCodex(skull)
    return writable
}

function decoder(skull){
    var readable = th2.obj(decode)
    readable._parser = new Parser(skull)
    readable._parser.on('message', function(data){
        readable.push(data)
    })
    return readable
}

function sledgeHammer(source, skull){
    var readable = decoder(skull), writable = encoder(skull)

    pump (source, readable)
    pump (writable, source)

    return dup.obj(writable, readable)
}

function decode(buffer, enc, cb){
    this._parser.parse(buffer)
    cb()
}
function Parser(skull){
    if(!(this instanceof Parser)) return new Parser(skull)
    this._codex = getCodex(skull)
    this._bl = bl()
    this._remaining = 0
    this._states = [ '_parseHeader', '_parsePayload' ]
    this._counter = 0
}

inherits(Parser, EE)

Parser.prototype.parse = function(buffer){
    if(!buffer || buffer.length === 0) return
    this._bl.append(buffer)
    while(this._bl.length > 0 && this[this._states[this._counter]]()) {
        this._counter++
        if(this._counter >= this._states.length) this._counter=0
    }
    return this._bl.length
}

Parser.prototype._parseHeader = function(){
    var result = varint.decode(this._bl.slice(0, 8)) || 0
    if(result !== undefined){
        this._remaining = result
        this._bl.consume(varint.decode.bytes)
        return true
    }else {
        return false
    }
}

Parser.prototype._parsePayload = function(){
    if(this._bl.length >= this._remaining){
        this.emit('message', this._codex.decode(this._bl.slice(0, this._remaining)))
        this._bl.consume(this._remaining)
        this._remaining = -1
        return true
    }
    return false
}

function encode(obj, enc, cb){
    var toWrite = this._codex.encode(obj)
    this.push(new Buffer(varint.encode(calcLength(toWrite))))
    this.push(toWrite)
    cb()
}

sledgeHammer.encoder = encoder
sledgeHammer.decoder = decoder

function uncork(stream){stream.uncork()}

var defaultSkull = {
    codex : jsonCodex
}

function calcLength(obj){
    if(typeof obj === 'string'){
        return Buffer.byteLength(obj)
    }else {
        return obj.length
    }
}
function toStream(msg, skull, stream, cb){
    if(!stream){
        stream = skull
        skull = defaultSkull
    }
    if(stream.cork){
        stream.cork()
        nt(uncork, stream)
    }
    var encode = skull.codex.encode
    var toWrite = encode(msg)

    stream.write(Buffer.from(varint.encode(calcLength(toWrite))))
    return stream.write(toWrite, cb)
}

sledgeHammer.parser = Parser
sledgeHammer.writeToStream = toStream

module.exports = sledgeHammer