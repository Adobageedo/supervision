# Guide Frontend Angular - Gestion des Interventions

## Initialisation

### Option 1: Script Automatique (Recommandé)

```bash
chmod +x init-frontend.sh
./init-frontend.sh
```

### Option 2: Manuel

```bash
# Installer Angular CLI
npm install -g @angular/cli

# Créer l'application
ng new frontend --routing --style=scss --strict

cd frontend

# Installer Angular Material
ng add @angular/material

# Installer les dépendances
npm install @angular/material-moment-adapter moment
npm install chart.js ng2-charts
```

## Architecture de l'Application

```
frontend/src/app/
├── core/                           # Services et logique métier centrale
│   ├── services/
│   │   ├── auth.service.ts        # Service d'authentification
│   │   ├── intervention.service.ts # Service interventions
│   │   ├── predefined.service.ts  # Service valeurs prédéfinies
│   │   └── audit.service.ts       # Service audit
│   ├── guards/
│   │   ├── auth.guard.ts          # Guard d'authentification
│   │   └── role.guard.ts          # Guard de rôle
│   ├── interceptors/
│   │   ├── auth.interceptor.ts    # Intercepteur JWT
│   │   └── error.interceptor.ts   # Gestion des erreurs
│   └── models/
│       ├── user.model.ts          # Modèle utilisateur
│       ├── intervention.model.ts  # Modèle intervention
│       └── predefined.model.ts    # Modèle valeurs prédéfinies
│
├── shared/                         # Composants partagés
│   ├── components/
│   │   ├── navbar/
│   │   ├── sidebar/
│   │   ├── loading-spinner/
│   │   └── confirmation-dialog/
│   ├── directives/
│   └── pipes/
│       ├── date-format.pipe.ts
│       └── duration.pipe.ts
│
├── features/                       # Modules fonctionnels
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.scss
│   │   └── auth.module.ts
│   │
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   └── dashboard.module.ts
│   │
│   ├── interventions/
│   │   ├── list/                  # Liste des interventions
│   │   ├── detail/                # Détail d'une intervention
│   │   ├── form/                  # Formulaire création/édition
│   │   └── interventions.module.ts
│   │
│   └── admin/
│       ├── users/                 # Gestion des utilisateurs
│       ├── predefined-values/     # Gestion des valeurs prédéfinies
│       └── admin.module.ts
│
├── app-routing.module.ts
├── app.component.ts
└── app.module.ts
```

## Commandes de Génération

### Services

```bash
# Services core
ng generate service core/services/auth
ng generate service core/services/intervention
ng generate service core/services/predefined
ng generate service core/services/audit

# Guards
ng generate guard core/guards/auth
ng generate guard core/guards/role

# Interceptors
ng generate interceptor core/interceptors/auth
ng generate interceptor core/interceptors/error
```

### Composants

```bash
# Auth
ng generate module features/auth --routing
ng generate component features/auth/login

# Dashboard
ng generate module features/dashboard --routing
ng generate component features/dashboard

# Interventions
ng generate module features/interventions --routing
ng generate component features/interventions/list
ng generate component features/interventions/detail
ng generate component features/interventions/form

# Admin
ng generate module features/admin --routing
ng generate component features/admin/users
ng generate component features/admin/predefined-values

# Composants partagés
ng generate component shared/components/navbar
ng generate component shared/components/sidebar
ng generate component shared/components/loading-spinner
ng generate component shared/components/confirmation-dialog
```

### Pipes

```bash
ng generate pipe shared/pipes/date-format
ng generate pipe shared/pipes/duration
```

## Configuration TypeScript (tsconfig.json)

Ajoutez les path aliases pour faciliter les imports:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@app/*": ["src/app/*"],
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@env/*": ["src/environments/*"]
    }
  }
}
```

## Modules Material à Importer

Créez `src/app/shared/material.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';

const materialModules = [
  MatButtonModule,
  MatCardModule,
  MatInputModule,
  MatFormFieldModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatIconModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatMenuModule,
  MatSelectModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatDialogModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
  MatChipsModule,
  MatTabsModule,
  MatTooltipModule,
  MatCheckboxModule,
];

@NgModule({
  imports: materialModules,
  exports: materialModules,
})
export class MaterialModule {}
```

## Modèles TypeScript

### User Model

```typescript
export enum UserRole {
  ADMIN = 'admin',
  WRITE = 'write',
  READ = 'read',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

### Intervention Model

```typescript
export interface Intervention {
  id: string;
  titre: string;
  centrale: string;
  equipement: string;
  typeEvenement: string;
  typeDysfonctionnement: string;
  dateDebut: Date;
  dateFin?: Date;
  dateIndisponibiliteDebut?: Date;
  dateIndisponibiliteFin?: Date;
  commentaires?: string;
  perteProduction?: number;
  perteCommunication?: number;
  isArchived: boolean;
  archivedAt?: Date;
  intervenants: Intervenant[];
  createdBy?: User;
  createdById?: string;
  updatedBy?: User;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Intervenant {
  id?: string;
  nom: string;
  prenom?: string;
  type?: string;
  entreprise?: string;
}

export interface InterventionFilters {
  centrale?: string;
  equipement?: string;
  typeEvenement?: string;
  typeDysfonctionnement?: string;
  dateDebutFrom?: Date;
  dateDebutTo?: Date;
  isArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface InterventionListResponse {
  interventions: Intervention[];
  total: number;
  pages: number;
}
```

## Services HTTP

### Auth Service

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '@env/environment';
import { User, LoginRequest, LoginResponse } from '@core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.storeAuth(response.data);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private storeAuth(data: LoginResponse): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.currentUserSubject.next(data.user);
  }

  private loadStoredUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUserSubject.next(JSON.parse(userStr));
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }
}
```

## Intercepteurs

### Auth Interceptor

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
```

## Guards

### Auth Guard

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/auth/login']);
    return false;
  }
}
```

## Routing

Exemple de configuration dans `app-routing.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'interventions',
    loadChildren: () => import('./features/interventions/interventions.module').then(m => m.InterventionsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

## Démarrage

```bash
cd frontend
npm install
npm start
```

L'application sera accessible sur http://localhost:4200

## Build Production

```bash
ng build --configuration production
```

Les fichiers de build seront dans `dist/frontend/`

## Tests

```bash
# Tests unitaires
ng test

# Tests e2e
ng e2e

# Coverage
ng test --code-coverage
```

## Ressources

- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [RxJS](https://rxjs.dev/)
