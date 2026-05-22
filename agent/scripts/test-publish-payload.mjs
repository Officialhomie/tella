import { readFileSync } from 'fs'
import { Sails } from 'sails-js'
import { SailsIdlParser } from 'sails-js/parser'

const idlPath = process.argv[2]
const idl = readFileSync(idlPath, 'utf8')
const parser = new SailsIdlParser()
await parser.init()
const sails = new Sails(parser)
sails.parseIdl(idl)

const payload = sails.services.Content.functions.Publish.encodePayload(
  'Test Title',
  'Test desc',
  'QmTest',
  1000000000000n,
  'deadbeef:cafebabe',
  'Newsletter',
)
console.log('0x' + Buffer.from(payload).toString('hex'))
