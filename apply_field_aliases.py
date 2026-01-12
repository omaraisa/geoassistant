"""
ArcGIS Pro Field Alias Update Script
=====================================
This script updates field aliases for all layers in the RealStates map service
based on the mapping defined in field_alias_mapping.csv

Requirements:
- Run this script in ArcGIS Pro Python environment
- field_alias_mapping.csv must be in the same directory
- Map document with RealStates layers must be open

Usage:
1. Open your ArcGIS Pro project with the RealStates layers
2. Open Python window in ArcGIS Pro
3. Run this script: exec(open(r'C:\path\to\apply_field_aliases.py').read())
"""

import arcpy
import csv
import os

# Layer name mapping (MapServer layer name to ArcGIS Pro layer name)
LAYER_MAPPING = {
    'PLOT': 'PLOT',
    'PROJECT': 'PROJECT',
    'COMMUNITY': 'COMMUNITY',
    'DISTRICT': 'DISTRICT',
    'MUNICIPALITY': 'MUNICIPALITY',
    'RENT_REVENUE_COMMUNITY': 'RENT_REVENUE_COMMUNITY',
    'RENT_REVENUE_DISTRICT': 'RENT_REVENUE_DISTRICT',
    'RENT_REVENUE_PROJECT': 'RENT_REVENUE_PROJECT',
    'RENTAL_INDEX_COMMUNITY': 'RENTAL_INDEX_COMMUNITY',
    'RENTAL_INDEX_DISTRICT': 'RENTAL_INDEX_DISTRICT',
    'RENTAL_INDEX_PROJECT': 'RENTAL_INDEX_PROJECT',
    'SALE_RATES_DISTRICT': 'SALE_RATES_DISTRICT',
    'SALE_RATES_PROJECT': 'SALE_RATES_PROJECT',
    'SUPPLY_COMMUNITY': 'SUPPLY_COMMUNITY',
    'SUPPLY_DISTRICT': 'SUPPLY_DISTRICT',
    'SUPPLY_PLOT': 'SUPPLY_PLOT',
    'SUPPLY_PROJECT': 'SUPPLY_PROJECT',
    'TRANSACTIONS_DISTRICT': 'TRANSACTIONS_DISTRICT',
    'TRANSACTIONS_PROJECT': 'TRANSACTIONS_PROJECT',
}

def load_field_mappings(csv_path):
    """Load field alias mappings from CSV file"""
    mappings = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            layer = row['Layer']
            field_name = row['Field_Name']
            field_alias = row['Field_Alias']
            
            if layer not in mappings:
                mappings[layer] = {}
            
            mappings[layer][field_name] = field_alias
    
    return mappings

def apply_aliases_to_layer(layer_path, field_mappings):
    """Apply field aliases to a specific layer"""
    try:
        # Get list of fields in the layer
        fields = arcpy.ListFields(layer_path)
        
        updated_count = 0
        for field in fields:
            if field.name in field_mappings:
                new_alias = field_mappings[field.name]
                
                # Only update if alias is different
                if field.aliasName != new_alias:
                    arcpy.management.AlterField(
                        layer_path,
                        field.name,
                        field.name,  # Keep the same field name
                        new_alias    # Set new alias (4th parameter)
                    )
                    print(f"  [OK] {field.name} -> {new_alias}")
                    updated_count += 1
                else:
                    print(f"  - {field.name} already has correct alias")
        
        return updated_count
    
    except Exception as e:
        print(f"  [ERROR] Error processing layer: {str(e)}")
        return 0

def main(csv_path=None):
    """Main execution function"""
    print("=" * 60)
    print("ArcGIS Field Alias Update Script")
    print("=" * 60)
    
    # Get the CSV path
    if csv_path is None:
        # Try to get script directory if running as a file
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            csv_path = os.path.join(script_dir, 'field_alias_mapping.csv')
        except NameError:
            # __file__ not defined (running in Python window)
            # Try common locations
            possible_paths = [
                r'D:\sandbox\Real States Smart Assistant\geo_assistant\field_alias_mapping.csv',
                os.path.join(os.getcwd(), 'field_alias_mapping.csv'),
                os.path.join(os.path.expanduser('~'), 'field_alias_mapping.csv'),
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    csv_path = path
                    break
            
            if csv_path is None or not os.path.exists(csv_path):
                print("X Error: field_alias_mapping.csv not found")
                print("\nPlease specify the path manually:")
                print("  main(r'C:\\path\\to\\field_alias_mapping.csv')")
                print("\nOr place field_alias_mapping.csv in one of these locations:")
                for path in possible_paths:
                    print(f"  - {path}")
                return
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        print(f"X Error: field_alias_mapping.csv not found at {csv_path}")
        return
    
    print(f"Loading field mappings from: {csv_path}")
    field_mappings = load_field_mappings(csv_path)
    print(f"[OK] Loaded mappings for {len(field_mappings)} layers\n")
    
    # Get the active map from current ArcGIS Pro project
    try:
        aprx = arcpy.mp.ArcGISProject("CURRENT")
        map_obj = aprx.activeMap
        
        if not map_obj:
            print("[ERROR] No active map found. Please open a map in ArcGIS Pro.")
            return
        
        print(f"Active map: {map_obj.name}\n")
        
    except Exception as e:
        print(f"[ERROR] Error accessing ArcGIS Pro project: {str(e)}")
        return
    
    # Process each layer
    total_updated = 0
    processed_layers = 0
    
    for layer_key, layer_name in LAYER_MAPPING.items():
        if layer_key not in field_mappings:
            print(f"[WARNING] No field mappings found for {layer_key}")
            continue
        
        # Find the layer in the map
        layers = [lyr for lyr in map_obj.listLayers() if lyr.name == layer_name]
        
        if not layers:
            print(f"[WARNING] Layer '{layer_name}' not found in map")
            continue
        
        layer = layers[0]
        print(f"Processing layer: {layer_name}")
        
        # Get the data source path
        if hasattr(layer, 'dataSource'):
            layer_path = layer.dataSource
            updated = apply_aliases_to_layer(layer_path, field_mappings[layer_key])
            total_updated += updated
            processed_layers += 1
        else:
            print(f"  [WARNING] Cannot access data source for {layer_name}")
        
        print()
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Layers processed: {processed_layers}/{len(LAYER_MAPPING)}")
    print(f"Fields updated: {total_updated}")
    print("\n[OK] Field alias update complete!")
    print("\nNext steps:")
    print("1. Save your ArcGIS Pro project")
    print("2. Republish the map service to ArcGIS Server")
    print("3. The AI will now see clearer field names!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n[FATAL ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
