# Paperworks

Paperworks is a Vite + React + TypeScript starter using shadcn-ui and Tailwind CSS.

## Quick start

Requirements: Node.js and npm installed.

```sh
git clone <https://github.com/robfernan/Paperworks.git>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

The development server runs with Vite and provides Hot Module Replacement (HMR). Changes you make to source files will be reflected in the browser immediately without a full page reload.

## Current notes

- Project renamed to **Paperworks**.
- Removed the `lovable-tagger` mockup plugin from the build.
- Dev server: `vite` on port `8080` by default (see `vite.config.ts`).
- To merge existing static HTML projects into this app, place their assets under `public/` or convert pages into React components under `src/pages/`.

## Offline-first usage

- Paperworks is designed to run entirely offline in the browser as a Single Page App (SPA). All core tools store data locally (in `localStorage`) and perform PDF manipulation client-side.
- Core tools implemented:
	- Business Card Builder — edit fields, save locally, export JSON.
	- Resume Builder — edit/save locally.
	- Invoice Creator — line items, totals, save locally.
	- PDF Pro — load a PDF from disk, reorder pages, rotate pages, draw a signature and embed it, then save an edited PDF. Uses `pdf-lib` for client-side PDF manipulation.

To run locally:

```sh
npm install
npm run dev
```

All data created with these tools is stored in your browser and never sent to a server unless you choose to export/upload it.

## End goals

- Desktop: Frameless Wails (Golang) app — native desktop app with draggable, resizable frameless window.
- Mobile: Capacitor build for iOS/Android to package a mobile app.
- Open-source alternative to Adobe Acrobat focusing on document creation, editing, and export.

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## License & Copyright

Paperworks © 2026
