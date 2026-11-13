// Prints file names/counts only; never prints credential values or file contents.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const git=args=>execFileSync('git',args,{maxBuffer:30*1024*1024});
const files=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean);
let key='';try{key=(readFileSync(new URL('.env',import.meta.url),'utf8').match(/^QWEN_API_KEY\s*=\s*(.*)$/m)?.[1]||'').trim().replace(/^(['"])(.*)\1$/,'$2');}catch{}
for(const file of files){if(/(^|\/)(node_modules|dist|\.cache)(\/|$)|desktop\.ini$|\.tsbuildinfo$/.test(file)||(/(^|\/)\.env(?:\.|$)/.test(file)&&!file.endsWith('/.env.example')))throw Error('Forbidden staged file: '+file);const content=git(['show',':'+file]);if(key&&!key.startsWith('replace-')&&content.includes(Buffer.from(key)))throw Error('Local credential found in staged file: '+file);if(/sk-[A-Za-z0-9_-]{24,}/.test(content.toString()))throw Error('Possible credential found in staged file: '+file);}
console.log('PASS: '+files.length+' staged files; local credential, .env, dependencies, build output and unrelated desktop files excluded.');
