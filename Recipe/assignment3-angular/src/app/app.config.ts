import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    // T7 This call wires up Angular's service worker file so the app can cache pages and behave like an installable PWA.
    // T7 Think of the service worker as a background helper that keeps the app available offline once a user installs it.
    provideServiceWorker('ngsw-worker.js', {
      // T7 We only switch the service worker on outside of dev mode so live users get offline support without disrupting local builds.
      enabled: !isDevMode(),
      // T7 This timing waits for the app to settle before installing, preventing slow first loads while still enabling background caching.
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
