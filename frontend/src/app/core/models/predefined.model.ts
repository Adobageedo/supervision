export enum PredefinedType {
  CENTRALE = 'centrale',
  EQUIPEMENT = 'equipement',
  TYPE_EVENEMENT = 'type_evenement',
  TYPE_DYSFONCTIONNEMENT = 'type_dysfonctionnement',
  TYPE_INTERVENANT = 'type_intervenant',
}

export interface PredefinedValue {
  id: string;
  type: PredefinedType;
  value: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PredefinedValuesMap {
  [PredefinedType.CENTRALE]: PredefinedValue[];
  [PredefinedType.EQUIPEMENT]: PredefinedValue[];
  [PredefinedType.TYPE_EVENEMENT]: PredefinedValue[];
  [PredefinedType.TYPE_DYSFONCTIONNEMENT]: PredefinedValue[];
  [PredefinedType.TYPE_INTERVENANT]: PredefinedValue[];
}
