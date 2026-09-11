# Top News India

A reader-driven Indian news aggregator that ranks news stories based on reader votes.

## Features

* Aggregates news from RSS feeds
* Reader-based story ranking
* Daily automated feed processing
* Vote protection using visitor IDs and IP-based limits

## Built With

* JavaScript
* Cloudflare Workers
* Cloudflare D1
* Cloudflare Queues
* Cloudflare Cron Triggers

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npx wrangler dev
```

Local secrets can be placed in `.dev.vars`.

## Deployment

```bash
npx wrangler deploy
```

## License

This project is licensed under the **MIT License**.

See the `LICENSE` file for the full license text.
