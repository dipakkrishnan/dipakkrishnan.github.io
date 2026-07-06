# dipak-krishnan.github.io

Personal site and writing, built with Astro.

## Commands

```sh
npm install
npm run dev
npm run build
```

The stage-one Notion sync command is intentionally a no-op unless `NOTION_TOKEN` and `NOTION_DATABASE_ID` are configured. It is wired into `npm run build` so the exporter can be filled in without changing the deploy path.
