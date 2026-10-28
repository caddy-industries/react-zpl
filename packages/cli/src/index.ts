import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { LabelLoader } from './loader';
import { startServer } from './server';

const HELP = `react-zpl - preview and export ZPL labels written in React

Usage
  react-zpl dev     [--dir labels] [--port 3000] [--host localhost] [--margin 1mm]
  react-zpl export  [--dir labels] [--out out] [--dpi 203] [--margin 1mm] [--svg] [--template]

--margin sets the printer's unprintable edge (CSS order: "1mm" or "1mm 2mm").
It overrides <Label printMargin>.
--template writes ZPL with {{field}} placeholders in place of string props.

Each .tsx file in the labels folder should default-export a component that
returns a <Label>. Set Component.PreviewProps to give it sample data, and
Component.PreviewVariants to name more examples (merged over PreviewProps).
`;

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      dir: { type: 'string', default: 'labels' },
      port: { type: 'string', default: '3000' },
      host: { type: 'string', default: 'localhost' },
      out: { type: 'string', default: 'out' },
      dpi: { type: 'string' },
      margin: { type: 'string' },
      svg: { type: 'boolean', default: false },
      template: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  });
  const command = positionals[0];
  if (values.help || !command) {
    console.log(HELP);
    return;
  }
  const root = process.cwd();

  if (command === 'dev') {
    const loader = await LabelLoader.create(root, values.dir!, true);
    const count = loader.list().length;
    const port = Number(values.port);
    await startServer(loader, port, values.host!, values.margin);
    console.log(`\n  react-zpl preview running at http://${values.host}:${port}`);
    console.log(`  Watching ${count} label${count === 1 ? '' : 's'} in ./${values.dir}\n`);
    return;
  }

  if (command === 'export') {
    const loader = await LabelLoader.create(root, values.dir!, false);
    const labels = loader.list();
    const dpi = values.dpi ? Number(values.dpi) : undefined;
    let failed = 0;
    for (const label of labels) {
      try {
        const result = await loader.render(label.id, { dpi, printMargin: values.margin, template: values.template });
        const target = join(resolve(root, values.out!), `${label.name}.zpl`);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, result.zpl);
        if (values.svg) writeFileSync(target.replace(/\.zpl$/, '.svg'), result.svg);
        const notes = result.warnings.length ? ` (${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''})` : '';
        console.log(`  ✓ ${label.name}${notes}`);
        for (const w of result.warnings) console.log(`      ! ${w}`);
        if (result.template?.kept.length) console.log(`      kept sample values for: ${result.template.kept.join(', ')}`);
      } catch (err) {
        failed++;
        console.log(`  ✗ ${label.name}: ${(err as Error).message}`);
      }
    }
    await loader.close();
    console.log(`\nExported ${labels.length - failed} of ${labels.length} labels to ${relative(root, resolve(root, values.out!)) || '.'}`);
    if (failed) process.exitCode = 1;
    return;
  }

  console.error(`Unknown command "${command}".\n`);
  console.log(HELP);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
