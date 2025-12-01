#!/usr/bin/env python3
"""
CSV Data Import Script for Supervision Database

This script imports data from CSV files into the PostgreSQL database.
It supports all tables in the system and handles relationships properly.

Usage:
    python import_data.py

Prerequisites:
    pip install psycopg2-binary python-dotenv bcrypt

CSV File Requirements:
    - Place CSV files in the 'csv_data' directory
    - File names should match table names (e.g., 'users.csv', 'predefined_values.csv')
    - First row must contain column headers matching database column names
    - Use UTF-8 encoding
"""

import csv
import os
import time
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional
import json
import uuid
import psycopg2
from psycopg2 import sql
from psycopg2.extensions import connection, cursor
from dotenv import load_dotenv
try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False
    print("⚠️  Warning: bcrypt not installed. Passwords will be stored as-is. Install with: pip install bcrypt")

# Load environment variables
load_dotenv()

# Database configuration (support both DATABASE_* and legacy DB_* variable names)
DB_CONFIG = {
    'host': 'localhost',#os.getenv('DATABASE_HOST') or os.getenv('DB_HOST', 'localhost'),
    'port': '5432',#int(os.getenv('DATABASE_PORT') or os.getenv('DB_PORT', '4201')),
    'database': os.getenv('DATABASE_NAME') or os.getenv('DB_NAME', 'supervision_maintenance'),
    'user': os.getenv('DATABASE_USER') or os.getenv('DB_USER', 'supervision_user'),
    'password': os.getenv('DATABASE_PASSWORD') or os.getenv('DB_PASSWORD', 'supervision_password')
}

# CSV data directory
CSV_DIR = 'csv_data'

# Table import order (respects foreign key dependencies)
IMPORT_ORDER = [
    'users',
    'predefined_values',
    'companies',
    'intervenants',
    'interventions',
    'audit_logs'
]

# Column mappings and transformations
# Note: If 'id' is provided in CSV, it will be used. Otherwise, auto-generated.
COLUMN_MAPPINGS = {
    'users': {
        'skip_columns': [],  # Allow ID import
        'required': ['email', 'password', 'role'],
        'defaults': {
            'isActive': True,
            'firstName': '',
            'lastName': '',
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
    },
    'predefined_values': {
        'skip_columns': [],  # Allow ID import (important for parentId relationships!)
        'required': ['type', 'value'],
        'defaults': {
            'isActive': True,
            'sortOrder': 0,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
    },
    'companies': {
        'skip_columns': [],  # Allow ID import
        'required': ['name'],
        'defaults': {
            'isActive': True,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
    },
    'intervenants': {
        'skip_columns': [],  # Allow ID import
        'required': ['name', 'surname'],
        'defaults': {
            'isActive': True,
            'country': 'France',
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
    },
    'interventions': {
        'skip_columns': [],  # Allow ID import
        'required': ['titre', 'centrale', 'equipement'],
        'defaults': {
            'hasPerteProduction': False,
            'hasPerteCommunication': False,
            'indispoTerminee': False,
            'rapportAttendu': False,
            'rapportRecu': False,
            'isArchived': False,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
    },
    'audit_logs': {
        'skip_columns': [],  # Allow ID import
        'required': ['entityType', 'action', 'entityId'],
        'defaults': {
            'createdAt': datetime.now()
        }
    }
}

# Exact schema definition per table to enforce allowed columns and casting
SCHEMA: Dict[str, Dict[str, str]] = {
    'users': {
        'id': 'uuid',
        'email': 'string',
        'password': 'string',
        'firstName': 'string',
        'lastName': 'string',
        'role': 'string',  # admin | write | read
        'isActive': 'bool',
        'refreshToken': 'string?',
        'lastLogin': 'timestamp?',
        'firebaseUid': 'string?',
        'createdAt': 'timestamp',
        'updatedAt': 'timestamp',
    },
    'companies': {
        'id': 'uuid',
        'name': 'string',
        'address': 'text?',
        'phone': 'string?',
        'email': 'string?',
        'website': 'string?',
        'isActive': 'bool',
        'createdAt': 'timestamp',
        'updatedAt': 'timestamp',
    },
    'intervenants': {
        'id': 'uuid',
        'name': 'string',
        'surname': 'string',
        'phone': 'string?',
        'email': 'string?',
        'country': 'string?',
        'companyId': 'uuid?',
        'type': 'string?',
        'isActive': 'bool',
        'createdAt': 'timestamp',
        'updatedAt': 'timestamp',
    },
    'interventions': {
        'id': 'uuid',
        'titre': 'string',
        'centraleType': 'string?',
        'centrale': 'string',
        'equipement': 'string',
        'entrepriseIntervenante': 'string?',
        'nombreIntervenant': 'int?',
        'intervenantEnregistre': 'text?',
        'dateRef': 'timestamp?',
        'debutInter': 'timestamp?',
        'finInter': 'timestamp?',
        'hasPerteProduction': 'bool',
        'hasPerteCommunication': 'bool',
        'indispoTerminee': 'bool',
        'dateIndisponibiliteDebut': 'timestamp?',
        'dateIndisponibiliteFin': 'timestamp?',
        'typeEvenement': 'json_text?',
        'typeDysfonctionnement': 'json_text?',
        'rapportAttendu': 'bool',
        'rapportRecu': 'bool',
        'commentaires': 'text?',
        'isArchived': 'bool',
        'archivedAt': 'timestamp?',
        'createdById': 'uuid?',
        'updatedById': 'uuid?',
        'createdAt': 'timestamp',
        'updatedAt': 'timestamp',
    },
    'predefined_values': {
        'id': 'uuid',
        'type': 'enum_predefined',
        'value': 'string',
        'description': 'text?',
        'nickname': 'string?',
        'equipmentType': 'string?',
        'parentId': 'uuid?',
        'isActive': 'bool',
        'sortOrder': 'int',
        'createdAt': 'timestamp',
        'updatedAt': 'timestamp',
    },
    'audit_logs': {
        'id': 'uuid',
        'entityType': 'string',
        'entityId': 'string',
        'action': 'string',
        'oldValues': 'jsonb?',
        'newValues': 'jsonb?',
        'description': 'text?',
        'ipAddress': 'string?',
        'userAgent': 'string?',
        'userId': 'uuid?',
        'createdAt': 'timestamp',
    },
}

PREDEFINED_TYPES = {
    'centrale',
    'equipement',
    'type_evenement',
    'type_dysfonctionnement',
    'type_intervenant',
}

def _to_bool(v: Any) -> Optional[bool]:
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    if s in {'true', '1', 'yes'}:
        return True
    if s in {'false', '0', 'no'}:
        return False
    return None

def _to_number(v: Any) -> Optional[float]:
    if v in (None, ''):
        return None
    try:
        return float(v)
    except Exception:
        return None

def _to_int(v: Any) -> Optional[int]:
    if v in (None, ''):
        return None
    try:
        return int(v)
    except Exception:
        return None

def _to_timestamp(v: Any) -> Optional[str]:
    """Return ISO string acceptable by PostgreSQL if possible, else None."""
    if v in (None, ''):
        return None
    if isinstance(v, (int, float)):
        # treat as epoch seconds
        try:
            return datetime.fromtimestamp(float(v)).isoformat()
        except Exception:
            return None
    s = str(v).strip()
    # Accept already ISO-like strings
    try:
        # Python 3.11: fromisoformat handles most cases
        return datetime.fromisoformat(s.replace('Z', '+00:00')).isoformat()
    except Exception:
        return s  # let DB try; better than dropping

def _to_json_text_array(v: Any) -> Optional[str]:
    """Ensure value is serialized JSON array as text."""
    if v in (None, ''):
        return '[]'
    if isinstance(v, list):
        return json.dumps(v, ensure_ascii=False)
    s = str(v).strip()
    # If it's already a JSON array
    if (s.startswith('[') and s.endswith(']')):
        try:
            arr = json.loads(s)
            if isinstance(arr, list):
                return json.dumps(arr, ensure_ascii=False)
        except Exception:
            pass
    # Split by comma as a fallback
    parts = [p.strip() for p in s.split(',') if p.strip()]
    return json.dumps(parts, ensure_ascii=False)

def _to_jsonb(v: Any) -> Optional[str]:
    if v in (None, ''):
        return None
    if isinstance(v, (dict, list)):
        return json.dumps(v, ensure_ascii=False)
    s = str(v)
    try:
        obj = json.loads(s)
        return json.dumps(obj, ensure_ascii=False)
    except Exception:
        # store as a string field inside JSON
        return json.dumps({'value': s}, ensure_ascii=False)

def _int_to_uuid(value: Any, namespace: str = 'supervision') -> str:
    """Convert an integer ID to a deterministic UUID v5."""
    if value in (None, '', 'null'):
        return None
    
    # If already a valid UUID, return as-is
    s = str(value).strip()
    if '-' in s:
        try:
            uuid.UUID(s)  # Validate
            return s
        except Exception:
            pass
    
    # Convert integer to UUID using namespace
    # This ensures same integer always maps to same UUID
    namespace_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, namespace)
    return str(uuid.uuid5(namespace_uuid, str(value)))


class DatabaseImporter:
    """Handles CSV import into PostgreSQL database."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize the importer with database configuration."""
        self.config = config
        self.conn: Optional[connection] = None
        self.cur: Optional[cursor] = None
        
    def connect(self) -> None:
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(**self.config)
            self.cur = self.conn.cursor()
            print(f"✅ Connected to database: {self.config['database']}")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            sys.exit(1)
    
    def disconnect(self) -> None:
        """Close database connection."""
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()
            print("✅ Database connection closed")
    
    def read_csv(self, filename: str) -> List[Dict[str, Any]]:
        """Read CSV file and return list of rows as dictionaries."""
        filepath = os.path.join(CSV_DIR, filename)
        
        if not os.path.exists(filepath):
            print(f"⚠️  File not found: {filepath}")
            return []
        
        # Try multiple encodings and delimiters
        encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
        delimiters = [',', ';', '\t']
        
        for encoding in encodings:
            for delimiter in delimiters:
                try:
                    with open(filepath, 'r', encoding=encoding) as f:
                        # Read first line to detect delimiter
                        first_line = f.readline()
                        f.seek(0)
                        
                        # Auto-detect delimiter from first line
                        if delimiter in first_line:
                            reader = csv.DictReader(f, delimiter=delimiter)
                            rows = list(reader)
                            if rows:  # Successfully read data
                                print(f"📄 Read {len(rows)} rows from {filename} (encoding: {encoding}, delimiter: '{delimiter}')")
                                return rows
                except Exception:
                    continue
        
        print(f"❌ Error reading {filename}: Could not parse with any encoding/delimiter combination")
        return []
    
    def prepare_row(self, row: Dict[str, Any], table: str) -> Dict[str, Any]:
        """Prepare row data for insertion: whitelist columns, apply defaults, cast values."""
        mapping = COLUMN_MAPPINGS.get(table, {})
        skip_columns = mapping.get('skip_columns', [])
        defaults = mapping.get('defaults', {})
        schema = SCHEMA.get(table, {})

        # Start with filtered row (drop unknown columns and skipped ones)
        filtered: Dict[str, Any] = {}
        for col, val in row.items():
            if col in skip_columns:
                continue
            if col not in schema:
                continue
            filtered[col] = val

        # Apply defaults
        for key, value in defaults.items():
            if key not in filtered or filtered[key] in ('', None):
                filtered[key] = value

        # Cast per schema
        casted: Dict[str, Any] = {}
        for key, val in filtered.items():
            kind = schema.get(key)
            if kind is None:
                continue

            base = kind.rstrip('?')
            nullable = kind.endswith('?')

            if base == 'uuid':
                # Convert integer IDs to UUIDs, or validate existing UUIDs
                v = _int_to_uuid(val) if val not in (None, '', 'null') else (None if nullable else None)
            elif base == 'string' or base == 'text':
                v = None if (val == '' and nullable) else (None if val is None and nullable else str(val) if val is not None else None)
            elif base == 'bool':
                v = _to_bool(val)
            elif base == 'number':
                v = _to_number(val)
            elif base == 'int':
                v = _to_int(val)
            elif base == 'timestamp':
                v = _to_timestamp(val)
            elif base == 'json_text':
                v = _to_json_text_array(val)
            elif base == 'jsonb':
                v = _to_jsonb(val)
            elif base == 'enum_predefined':
                v = str(val).strip().lower() if val is not None else None
                if v not in PREDEFINED_TYPES:
                    raise ValueError(f"Invalid predefined_values.type: {v}")
            else:
                v = val

            if v is None and not nullable and key not in ('id',):
                # keep None for DB defaults where appropriate
                pass

            casted[key] = v

        return casted
    
    def insert_row(self, table: str, data: Dict[str, Any]) -> bool:
        """Insert a single row into the specified table."""
        if not self.cur or not self.conn:
            print("❌ No database connection")
            return False
        
        try:
            # Hash plain text passwords for users table
            if table == 'users' and 'password' in data and data['password']:
                pwd = str(data['password'])
                # Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
                if not pwd.startswith('$2'):
                    if HAS_BCRYPT:
                        # Hash the plain text password
                        hashed = bcrypt.hashpw(pwd.encode('utf-8'), bcrypt.gensalt())
                        data['password'] = hashed.decode('utf-8')
                        print(f"  🔐 Hashed password for {data.get('email', 'user')}")
                    else:
                        print(f"  ⚠️  Cannot hash password for {data.get('email', 'user')} - bcrypt not installed")
            
            # Drop empty IDs to let DB auto-generate
            # Note: Integer IDs are now converted to UUIDs in prepare_row()
            if 'id' in data:
                v = data.get('id')
                if v in (None, '', 'null'):
                    data = {k: val for k, val in data.items() if k != 'id'}

            columns = list(data.keys())
            values = list(data.values())
            
            # Build INSERT query
            query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
                sql.Identifier(table),
                sql.SQL(', ').join(map(sql.Identifier, columns)),
                sql.SQL(', ').join(sql.Placeholder() * len(values))
            )
            
            self.cur.execute(query, values)
            return True
        except Exception as e:
            print(f"❌ Error inserting row into {table}: {e}")
            print(f"   Data: {data}")
            try:
                # rollback this failed statement so following rows can continue
                self.conn.rollback()
            except Exception:
                pass
            return False
    
    def reset_sequence(self, table: str) -> None:
        """Reset the ID sequence for a table after importing with explicit IDs."""
        if not self.cur or not self.conn:
            return
        
        try:
            # Get the sequence name (PostgreSQL convention: tablename_id_seq)
            sequence_name = f"{table}_id_seq"
            
            # Reset sequence to max(id) + 1
            self.cur.execute(
                sql.SQL("SELECT setval({}, COALESCE((SELECT MAX(id) FROM {}), 1), true)").format(
                    sql.Literal(sequence_name),
                    sql.Identifier(table)
                )
            )
            self.conn.commit()
            print(f"🔄 Reset sequence for {table}")
        except Exception as e:
            # Sequence might not exist or table might not have id column
            pass
    
    def import_table(self, table: str) -> int:
        """Import all data from CSV file into specified table."""
        print(f"\n📊 Importing {table}...")
        
        # Read CSV file
        filename = f"{table}.csv"
        rows = self.read_csv(filename)
        
        if not rows:
            print(f"⚠️  No data to import for {table}")
            return 0
        
        # Validate required columns
        mapping = COLUMN_MAPPINGS.get(table, {})
        required = mapping.get('required', [])
        
        if required:
            first_row = rows[0]
            missing = [col for col in required if col not in first_row]
            if missing:
                print(f"❌ Missing required columns for {table}: {missing}")
                return 0
        
        # Check if IDs are being imported
        has_id = 'id' in rows[0] and rows[0]['id'] != ''
        has_integer_ids = False
        
        if has_id:
            # Check if first row has integer ID
            first_id = str(rows[0]['id']).strip()
            if first_id and '-' not in first_id:
                has_integer_ids = True
                print(f"🔄 Converting integer IDs to UUIDs for {table}")
        
        # Import rows
        success_count = 0
        for idx, row in enumerate(rows, 1):
            prepared = self.prepare_row(row, table)
            if self.insert_row(table, prepared):
                success_count += 1
            else:
                print(f"⚠️  Failed to import row {idx}")
        
        self.conn.commit()
        
        # Reset sequence if IDs were imported
        if has_id:
            self.reset_sequence(table)
        
        print(f"✅ Imported {success_count}/{len(rows)} rows into {table}")
        return success_count
    
    def clear_table(self, table: str) -> None:
        """Clear all data from a table (use with caution!)."""
        if not self.cur or not self.conn:
            return
        
        try:
            self.cur.execute(sql.SQL("TRUNCATE TABLE {} CASCADE").format(sql.Identifier(table)))
            self.conn.commit()
            print(f"🗑️  Cleared table: {table}")
        except Exception as e:
            print(f"❌ Error clearing {table}: {e}")
    
    def import_all(self, clear_existing: bool = False) -> None:
        """Import all tables in the correct order."""
        print("\n" + "="*60)
        print("   CSV DATA IMPORT")
        print("="*60)
        
        if clear_existing:
            response = input("\n⚠️  WARNING: This will delete ALL existing data! Continue? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Import cancelled")
                return
            
            print("\n🗑️  Clearing existing data...")
            for table in reversed(IMPORT_ORDER):
                self.clear_table(table)
        
        print("\n📥 Starting import process...\n")
        
        total_imported = 0
        for table in IMPORT_ORDER:
            count = self.import_table(table)
            total_imported += count
            print(f"  Imported {count} rows into {table}, wainting 5s")
            time.sleep(1)
        
        print("\n" + "="*60)
        print(f"✅ Import complete! Total rows imported: {total_imported}")
        print("="*60 + "\n")


def create_sample_csvs():
    """Create sample CSV templates for each table."""
    print("📝 Creating sample CSV templates...")
    
    os.makedirs(CSV_DIR, exist_ok=True)
    
    samples = {
        'users.csv': [
            ['id', 'email', 'password', 'firstName', 'lastName', 'role', 'isActive', 'refreshToken', 'lastLogin', 'firebaseUid', 'createdAt', 'updatedAt'],
            ['', 'admin@supervision.com', 'Admin123!', 'Admin', 'User', 'admin', 'true', '', '', '', '', ''],
            ['', 'operator@supervision.com', 'Admin123!', 'John', 'Doe', 'read', 'true', '', '', '', '', '']
        ],
        'predefined_values.csv': [
            ['id', 'type', 'value', 'description', 'nickname', 'equipmentType', 'parentId', 'isActive', 'sortOrder', 'createdAt', 'updatedAt'],
            # Centrales (parentId empty) - types must be lowercase
            ['', 'centrale', 'Centrale Nord', 'Centrale principale Nord', 'CN', '', '', 'true', '0', '', ''],
            ['', 'centrale', 'Centrale Sud', 'Centrale principale Sud', 'CS', '', '', 'true', '1', '', ''],
            # Equipements (set parentId after first import if you need linkage)
            ['', 'equipement', 'Turbine 1', 'Turbine principale', '', 'Turbine', '', 'true', '0', '', ''],
            ['', 'equipement', 'Generator A', 'Generateur principal', '', 'Generator', '', 'true', '1', '', ''],
            # Event types
            ['', 'type_evenement', 'Maintenance preventive', 'Maintenance planifiee', '', '', '', 'true', '0', '', ''],
            ['', 'type_evenement', 'Panne', 'Arret imprevu', '', '', '', 'true', '1', '', ''],
            # Malfunction types
            ['', 'type_dysfonctionnement', 'Surchauffe', 'Temperature excessive', '', '', '', 'true', '0', '', ''],
            ['', 'type_dysfonctionnement', 'Vibrations', 'Vibrations anormales', '', '', '', 'true', '1', '', ''],
            # Intervenant types
            ['', 'type_intervenant', 'Technicien', 'Technicien de maintenance', '', '', '', 'true', '0', '', ''],
            ['', 'type_intervenant', 'Ingenieur', 'Ingenieur specialise', '', '', '', 'true', '1', '', '']
        ],
        'companies.csv': [
            ['id', 'name', 'address', 'phone', 'email', 'website', 'isActive', 'createdAt', 'updatedAt'],
            ['', 'Maintenance Corp', '1 Rue des Services, Paris', '+33123456789', 'contact@maintcorp.com', 'https://maintcorp.com', 'true', '', ''],
            ['', 'TechServices SARL', '20 Avenue des Energies, Lyon', '+33498765432', 'hello@techservices.com', 'https://techservices.com', 'true', '', '']
        ],
        'intervenants.csv': [
            ['id', 'name', 'surname', 'phone', 'email', 'country', 'companyId', 'type', 'isActive', 'createdAt', 'updatedAt'],
            ['', 'Dupont', 'Jean', '+33612345678', 'jean.dupont@maintenance.com', 'France', '', 'Technicien', 'true', '', ''],
            ['', 'Martin', 'Sophie', '+33687654321', 'sophie.martin@techservices.com', 'France', '', 'Ingenieur', 'true', '', '']
        ],
        'interventions.csv': [
            [
                'id', 'titre', 'centraleType', 'centrale', 'equipement',
                'entrepriseIntervenante', 'nombreIntervenant', 'intervenantEnregistre',
                'dateRef', 'debutInter', 'finInter',
                'hasPerteProduction', 'hasPerteCommunication', 'indispoTerminee',
                'dateIndisponibiliteDebut', 'dateIndisponibiliteFin',
                'typeEvenement', 'typeDysfonctionnement',
                'rapportAttendu', 'rapportRecu', 'commentaires',
                'isArchived', 'archivedAt', 'createdById', 'updatedById', 'createdAt', 'updatedAt'
            ],
            [
                '', 'Maintenance Turbine 1', '', 'Centrale Nord', 'Turbine 1',
                'Maintenance Corp', '2', 'Dupont Jean; Martin Sophie',
                '2024-01-15T00:00:00', '2024-01-15T08:00:00', '2024-01-15T12:00:00',
                'false', 'false', 'false',
                '', '',
                '["Maintenance preventive"]', '[]',
                'false', 'false', 'Maintenance trimestrielle',
                'false', '', '', '', '', ''
            ],
            [
                '', 'Reparation Generator A', '', 'Centrale Nord', 'Generator A',
                'TechServices SARL', '1', 'Durand Paul',
                '2024-01-20T00:00:00', '2024-01-20T14:00:00', '2024-01-20T18:00:00',
                'true', 'false', 'false',
                '', '',
                '["Panne"]', '["Surchauffe"]',
                'true', 'false', 'Temperature excessive detectee',
                'false', '', '', '', '', ''
            ]
        ],
        'audit_logs.csv': [
            ['id', 'entityType', 'entityId', 'action', 'oldValues', 'newValues', 'description', 'ipAddress', 'userAgent', 'userId', 'createdAt'],
            ['', 'intervention', '', 'create', '', '{"titre":"Exemple"}', 'Imported via CSV', '', '', '', '']
        ]
    }
    
    for filename, data in samples.items():
        filepath = os.path.join(CSV_DIR, filename)
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f, delimiter=',')
            writer.writerows(data)
        print(f"✅ Created: {filepath}")
    
    print(f"\n📁 Sample CSV files created in '{CSV_DIR}/' directory")
    print("\n💡 Important notes about IDs:")
    print("   • ID column is OPTIONAL - leave empty for auto-generated IDs")
    print("   • When you SPECIFY IDs, you control the exact ID values")
    print("   • This makes it EASY to set parentId relationships!")
    print("   • Example: Centrale ID=1, then Equipement parentId=1")
    print("   • Sequences are automatically reset after import")
    print("\n📝 Edit these files with your data and run the script again to import")


def main():
    """Main execution function."""
    print("\n" + "="*60)
    print("   SUPERVISION DATABASE - CSV IMPORT TOOL")
    print("="*60 + "\n")
    
    # Check if CSV directory exists
    if not os.path.exists(CSV_DIR):
        print(f"📁 CSV data directory '{CSV_DIR}' not found")
        create_sample = input("Would you like to create sample CSV templates? (yes/no): ")
        if create_sample.lower() == 'yes':
            create_sample_csvs()
        return
    
    # Check if there are CSV files
    csv_files = [f for f in os.listdir(CSV_DIR) if f.endswith('.csv')]
    if not csv_files:
        print(f"⚠️  No CSV files found in '{CSV_DIR}' directory")
        create_sample = input("Would you like to create sample CSV templates? (yes/no): ")
        if create_sample.lower() == 'yes':
            create_sample_csvs()
        return

    print(f"📁 Found {len(csv_files)} CSV file(s):")
    for f in csv_files:
        print(f"   - {f}")
    print()

    # Offer to regenerate templates to ensure they match current schema
    regen = input("Regenerate sample CSV templates (this will overwrite existing CSVs)? (yes/no): ")
    if regen.lower() == 'yes':
        create_sample_csvs()
        return
    
    # Ask if user wants to clear existing data
    clear_data = input("Clear existing data before import? (yes/no): ")
    clear_existing = clear_data.lower() == 'yes'
    
    # Create importer and run import
    importer = DatabaseImporter(DB_CONFIG)
    
    try:
        importer.connect()
        importer.import_all(clear_existing=clear_existing)
    except KeyboardInterrupt:
        print("\n\n⚠️  Import cancelled by user")
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
    finally:
        importer.disconnect()


if __name__ == '__main__':
    main()
