import { compile } from '@mdx-js/mdx';
import { readFile } from 'node:fs/promises';
const files = process.argv.slice(2);
let fail = 0;
for (const f of files) {
  try {
    const src = await readFile(f, 'utf8');
    const body = src.replace(/^---\n[\s\S]*?\n---\n/, '');
    await compile(body);
    console.log('OK   ' + f.split('/').pop());
  } catch (e) {
    fail++;
    console.log('FAIL ' + f.split('/').pop() + ' :: ' + e.message.split('\n')[0]);
  }
}
process.exit(fail ? 1 : 0);
