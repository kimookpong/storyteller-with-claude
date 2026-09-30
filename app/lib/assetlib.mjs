// bundle asset (src/assets) สำหรับเบราว์เซอร์ — esbuild ในหน่วยความจำ · สร้างใหม่เมื่อไฟล์ใน src/assets เปลี่ยน
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const WATCH = [path.join(ROOT, 'src', 'assets'), path.join(ROOT, 'src', 'theme')];
let cache = {key: null, code: null};

const stamp = () => WATCH.flatMap((d) => (fs.existsSync(d) ? fs.readdirSync(d).map((f) => fs.statSync(path.join(d, f)).mtimeMs) : [])).reduce((a, b) => Math.max(a, b), 0);

export const assetLib = async () => {
  const key = stamp();
  if (cache.key === key) return cache.code;
  let code;
  try {
    const esbuild = await import('esbuild');
    const r = await esbuild.build({
      entryPoints: [path.join(ROOT, 'app', 'lib', 'asset-entry.tsx')], bundle: true, write: false, format: 'esm', platform: 'browser',
      jsx: 'transform', target: 'es2020', minify: true, define: {'process.env.NODE_ENV': '"production"'}, logLevel: 'silent',
      loader: {'.json': 'json'}, external: [],
    });
    code = r.outputFiles[0].text;
  } catch (e) {
    code = `export const error = ${JSON.stringify(String(e.message ?? e).slice(0, 2000))}; export const names = []; export const render = () => ''; export const vb = () => null;`;
  }
  cache = {key, code};
  return code;
};
