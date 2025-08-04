import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));


@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getQualy() {
    return this.http.get('https://f1connectapi.vercel.app/api/current/last/qualy?limit=1');
  }

  getDrivers() {
    return this.http.get('https://f1connectapi.vercel.app/api/current/drivers');
  }

  getTeams() {
    return this.http.get('https://f1connectapi.vercel.app/api/current/teams');
  }

  getRaces() {
    return this.http.get('https://f1connectapi.vercel.app/api/current/last/race')
  }
}

