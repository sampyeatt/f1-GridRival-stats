import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection} from '@angular/core'
import {provideRouter} from '@angular/router'
import {routes} from './app.routes'
import {provideClientHydration, withEventReplay} from '@angular/platform-browser'
import {provideHttpClient, withFetch} from '@angular/common/http'
import {providePrimeNG} from 'primeng/config'
import Aura from '@primeuix/themes/aura'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ]
}
