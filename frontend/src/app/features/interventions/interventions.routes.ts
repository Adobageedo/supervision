import { Routes } from '@angular/router';

export const INTERVENTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/intervention-list.component').then(m => m.InterventionListComponent)
  },
  {
    path: 'planning',
    loadComponent: () => import('./planning/intervention-planning.component').then(m => m.InterventionPlanningComponent)
  },
  {
    path: 'bazefield-timeline',
    loadComponent: () => import('./bazefield-timeline/bazefield-timeline.component').then(m => m.BazefieldTimelineComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./form/intervention-form.component').then(m => m.InterventionFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/intervention-detail.component').then(m => m.InterventionDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./form/intervention-form.component').then(m => m.InterventionFormComponent)
  }
];
