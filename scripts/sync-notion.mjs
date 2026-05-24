const hasNotionConfig = Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);

if (!hasNotionConfig) {
  console.log('Notion sync skipped: NOTION_TOKEN and NOTION_DATABASE_ID are not configured.');
  process.exit(0);
}

console.log('Notion sync is configured, but the exporter has not been implemented yet.');
console.log('Keeping the build unblocked for stage one.');
