import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection} from '@angular/core'
import {provideRouter} from '@angular/router'
import {routes} from './app.routes'
import {provideClientHydration, withEventReplay} from '@angular/platform-browser'
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http'
import {providePrimeNG} from 'primeng/config'
import {authInterceptor} from './interceptors/auth.interceptor'
import {DarkMode} from './component/theme/theme'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: DarkMode
      }
    })
  ]
}
