# Totally

## Description

This project is a web application built with React and TypeScript, using the Next.js v15 framework. It's set up with pnpm for package management and uses Tailwind CSS for styling.

### Functional Description

This application is designed to manage and track scores for multiple players across multiple rounds of a game. It provides functionalities to add players, record scores for each round, and display a scoreboard with the total scores for each player.

### Technical Description

The project is structured into several directories:

- `src/`: This is where the main application code resides.
    - `app/`: Contains the main layout and navigation components, as well as specific pages for players, rounds, and scores.
    - `components/`: Contains reusable components like avatars, player input, round, scoreboard, scores table, and a theme provider.
    - `lib/atoms/`: Contains the Jotai atoms and utility functions.
    - `styles/`: Contains global CSS styles.
- `public/`: Contains static files that are served by the server.

## Development

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
