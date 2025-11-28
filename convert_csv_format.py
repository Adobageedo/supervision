#!/usr/bin/env python3
"""
Convert CSV files from semicolon-delimited to comma-delimited with UTF-8 encoding.
This fixes encoding and delimiter issues for the import script.
"""

import csv
import os
from pathlib import Path

CSV_DIR = 'csv_data'

def convert_csv_file(filename):
    """Convert a single CSV file from semicolon to comma delimiter with UTF-8 encoding."""
    filepath = Path(CSV_DIR) / filename
    
    if not filepath.exists():
        print(f"⚠️  File not found: {filepath}")
        return False
    
    # Try to read with multiple encodings
    encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
    rows = None
    
    for encoding in encodings:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                # Detect delimiter
                first_line = f.readline()
                f.seek(0)
                
                delimiter = ';' if ';' in first_line else ','
                reader = csv.reader(f, delimiter=delimiter)
                rows = list(reader)
                
                if rows:
                    print(f"✅ Read {filename} (encoding: {encoding}, delimiter: '{delimiter}')")
                    break
        except Exception as e:
            continue
    
    if not rows:
        print(f"❌ Could not read {filename}")
        return False
    
    # Write back as UTF-8 with comma delimiter
    try:
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f, delimiter=',')
            writer.writerows(rows)
        print(f"✅ Converted {filename} to UTF-8 with comma delimiter")
        return True
    except Exception as e:
        print(f"❌ Error writing {filename}: {e}")
        return False

def main():
    """Convert all CSV files in the csv_data directory."""
    print("\n" + "="*60)
    print("   CSV FORMAT CONVERTER")
    print("="*60 + "\n")
    
    if not os.path.exists(CSV_DIR):
        print(f"❌ Directory '{CSV_DIR}' not found")
        return
    
    csv_files = [f for f in os.listdir(CSV_DIR) if f.endswith('.csv')]
    
    if not csv_files:
        print(f"⚠️  No CSV files found in '{CSV_DIR}'")
        return
    
    print(f"Found {len(csv_files)} CSV file(s):\n")
    
    success_count = 0
    for filename in csv_files:
        if convert_csv_file(filename):
            success_count += 1
        print()
    
    print("="*60)
    print(f"✅ Converted {success_count}/{len(csv_files)} files successfully")
    print("="*60 + "\n")

if __name__ == '__main__':
    main()
