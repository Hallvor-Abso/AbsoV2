import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'bot/**/*.test.ts'],
    // Valeurs factices : le bot/env.ts exige ces variables au chargement.
    env: {
      DISCORD_BOT_TOKEN: 'test',
      DISCORD_CLIENT_ID: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
  },
});
