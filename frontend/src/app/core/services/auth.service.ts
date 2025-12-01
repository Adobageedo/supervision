import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, from, switchMap, tap, of } from 'rxjs';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import { User, ApiResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private firebaseUserSubject = new BehaviorSubject<FirebaseUser | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public firebaseUser$ = this.firebaseUserSubject.asObservable();

  constructor() {
    this.loadStoredUser();
    
    // Listen to Firebase auth state changes
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      this.firebaseUserSubject.next(firebaseUser);
      
      if (firebaseUser) {
        // Get fresh ID token and sync with backend
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem('accessToken', idToken);
        
        // Sync user data with backend
        this.syncUserWithBackend(idToken).subscribe({
          next: (response) => {
            if (response.success) {
              this.storeUser(response.data.user);
            }
          },
          error: (err) => console.error('Failed to sync user with backend:', err)
        });
      } else {
        this.clearAuth();
      }
    });
  }

  // Firebase email/password login
  login(email: string, password: string): Observable<ApiResponse<{ user: User }>> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        const idToken = await credential.user.getIdToken();
        localStorage.setItem('accessToken', idToken);
        return idToken;
      }),
      switchMap((idToken) => this.syncUserWithBackend(idToken)),
      tap((response) => {
        if (response.success) {
          this.storeUser(response.data.user);
        }
      })
    );
  }

  // Firebase email/password registration
  register(email: string, password: string, firstName: string, lastName: string): Observable<ApiResponse<{ user: User }>> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        // Update Firebase profile with display name
        await updateProfile(credential.user, {
          displayName: `${firstName} ${lastName}`
        });
        const idToken = await credential.user.getIdToken();
        localStorage.setItem('accessToken', idToken);
        return idToken;
      }),
      switchMap((idToken) => this.syncUserWithBackend(idToken)),
      tap((response) => {
        if (response.success) {
          this.storeUser(response.data.user);
        }
      })
    );
  }

  // Sync user with backend (sends Firebase ID token, gets user data from our DB)
  private syncUserWithBackend(idToken: string): Observable<ApiResponse<{ user: User }>> {
    return this.http.post<ApiResponse<{ user: User }>>(
      `${environment.apiUrl}/auth/login`,
      { idToken }
    );
  }

  // Logout from Firebase
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.clearAuth();
      })
    );
  }

  // Get current Firebase ID token (refreshes automatically if expired)
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  // Refresh the ID token and update localStorage
  async refreshToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken(true); // Force refresh
      localStorage.setItem('accessToken', idToken);
      return idToken;
    }
    return null;
  }

  getProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${environment.apiUrl}/auth/profile`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.storeUser(response.data.user);
          }
        })
      );
  }

  private storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuth(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private loadStoredUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUserSubject.next(JSON.parse(userStr));
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getFirebaseUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUserSubject.value;
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['admin']);
  }

  canWrite(): boolean {
    return this.hasRole(['admin', 'write']);
  }
}
