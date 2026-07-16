/**
 * Thin logging wrapper (issue #80).
 *
 * `error` always logs — real errors should surface in production too.
 * `warn` / `log` / `debug` are silenced in production builds to keep the
 * browser console clean; Docusaurus inlines `process.env.NODE_ENV` at build
 * time, so this branch is dead-code-eliminated in the production bundle.
 *
 * Call-site noise filters (e.g. the `shouldSilence` auth-session helper) stay
 * where they are — this wrapper only controls the prod/dev gate.
 */
const isProduction = process.env.NODE_ENV === 'production';

type LogArgs = readonly unknown[];

export const logger = {
  error: (...args: LogArgs): void => {
    console.error(...args);
  },
  warn: (...args: LogArgs): void => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  log: (...args: LogArgs): void => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  debug: (...args: LogArgs): void => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
};
