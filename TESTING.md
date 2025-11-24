# Guide des Tests

## Vue d'Ensemble

L'application utilise plusieurs niveaux de tests pour garantir la qualité du code:

- **Tests Unitaires**: Tests des fonctions et classes individuelles
- **Tests d'Intégration**: Tests des interactions entre composants
- **Tests End-to-End (E2E)**: Tests du parcours utilisateur complet

## Backend - Tests avec Jest

### Installation

```bash
cd backend
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

### Configuration (déjà créée)

Le fichier `jest.config.js` est déjà configuré.

### Exécution des Tests

```bash
# Tous les tests
npm test

# Mode watch (re-exécute automatiquement)
npm run test:watch

# Avec coverage
npm test -- --coverage

# Tests spécifiques
npm test -- auth.service.spec.ts
```

### Structure des Tests Backend

```
backend/
├── src/
│   ├── services/
│   │   ├── AuthService.ts
│   │   └── __tests__/
│   │       └── AuthService.spec.ts
│   ├── controllers/
│   │   └── __tests__/
│   └── utils/
│       └── __tests__/
└── test/
    ├── setup.ts
    ├── helpers/
    └── e2e/
        ├── auth.e2e.spec.ts
        └── interventions.e2e.spec.ts
```

### Exemple: Test Unitaire de Service

```typescript
// src/services/__tests__/AuthService.spec.ts
import { AuthService } from '../AuthService';
import { AppDataSource } from '../../config/database';
import { User } from '../../entities/User';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    authService = new AuthService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      const result = await authService.login(
        'admin@supervision.com',
        'Admin123!'
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@supervision.com');
    });

    it('should throw error on invalid credentials', async () => {
      await expect(
        authService.login('admin@supervision.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Exemple: Test d'Intégration (E2E) API

```typescript
// test/e2e/auth.e2e.spec.ts
import request from 'supertest';
import app from '../../src/server';
import { AppDataSource } from '../../src/config/database';

describe('Auth API (e2e)', () => {
  let authToken: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@supervision.com',
          password: 'Admin123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      authToken = response.body.data.accessToken;
    });

    it('should return 401 on invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@supervision.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.user.email).toBe('admin@supervision.com');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });
  });
});
```

### Configuration du Fichier Setup

```typescript
// test/setup.ts
import { AppDataSource } from '../src/config/database';

beforeAll(async () => {
  // Connexion à la base de données de test
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  // Nettoyage après tous les tests
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
```

## Frontend - Tests Angular

### Types de Tests

1. **Tests Unitaires** (Karma + Jasmine)
2. **Tests E2E** (Cypress)

### Exécution des Tests

```bash
cd frontend

# Tests unitaires
npm test

# Tests unitaires avec coverage
ng test --code-coverage

# Tests E2E avec Cypress
npm run e2e
```

### Exemple: Test de Component

```typescript
// src/app/features/auth/login/login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should validate email field', () => {
    const email = component.loginForm.get('email');
    
    email?.setValue('');
    expect(email?.hasError('required')).toBeTruthy();
    
    email?.setValue('invalidemail');
    expect(email?.hasError('email')).toBeTruthy();
    
    email?.setValue('valid@email.com');
    expect(email?.valid).toBeTruthy();
  });

  it('should call authService.login on submit', () => {
    authService.login.and.returnValue(of({
      success: true,
      data: { user: {}, accessToken: 'token', refreshToken: 'refresh' }
    }));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should navigate to dashboard on successful login', () => {
    authService.login.and.returnValue(of({
      success: true,
      data: { user: {}, accessToken: 'token', refreshToken: 'refresh' }
    }));

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
```

### Exemple: Test de Service

```typescript
// src/app/core/services/__tests__/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../auth.service';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const mockResponse = {
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh'
      }
    };

    service.login({ email: 'test@example.com', password: 'password' })
      .subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.accessToken).toBe('token');
      });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should store auth data after login', () => {
    spyOn(localStorage, 'setItem');

    const mockResponse = {
      success: true,
      data: {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'token',
        refreshToken: 'refresh'
      }
    };

    service.login({ email: 'test@example.com', password: 'password' })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(mockResponse);

    expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'token');
    expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh');
  });
});
```

### Tests E2E avec Cypress

```typescript
// cypress/e2e/login.cy.ts
describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should display login form', () => {
    cy.get('form').should('exist');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.get('input[type="email"]').type('admin@supervision.com');
    cy.get('input[type="password"]').type('Admin123!');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('admin@supervision.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Invalid credentials').should('be.visible');
  });
});
```

## Coverage

### Objectifs de Coverage

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Générer le Rapport de Coverage

```bash
# Backend
cd backend
npm test -- --coverage
# Voir le rapport dans coverage/lcov-report/index.html

# Frontend
cd frontend
ng test --code-coverage
# Voir le rapport dans coverage/index.html
```

## Bonnes Pratiques

### Backend

1. **Isoler les tests**: Chaque test doit être indépendant
2. **Utiliser des mocks**: Pour les dépendances externes
3. **Nettoyer après les tests**: Réinitialiser la base de données
4. **Tester les cas d'erreur**: Pas seulement les cas de succès
5. **Nommer clairement**: Utiliser des descriptions explicites

### Frontend

1. **Tester le comportement**: Pas l'implémentation
2. **Utiliser TestBed**: Pour les tests de composants
3. **Mock les services**: Utiliser des spies Jasmine
4. **Tester l'accessibilité**: Vérifier les attributs aria
5. **Tests E2E sélectifs**: Seulement pour les parcours critiques

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: supervision_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm ci
      - name: Run tests
        run: cd backend && npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests
        run: cd frontend && ng test --watch=false --code-coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Ressources

- [Jest Documentation](https://jestjs.io/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Cypress Documentation](https://docs.cypress.io/)
