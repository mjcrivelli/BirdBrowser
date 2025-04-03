import pandas as pd

# Path to the Excel file
excel_path = "attached_assets/aves_Toca_v2 (1).xlsx"

# Read the Excel file
df = pd.read_excel(excel_path)

# Check and print the columns
print("Columns in Excel file:", df.columns.tolist())

# Check if 'Picture' column exists
if 'Picture' in df.columns:
    # Print the first 5 entries in the Picture column
    print("\nFirst 5 entries in the Picture column:")
    for i, row in df.head(5).iterrows():
        bird_name = row.get('Nome Comum', 'Unknown')
        picture_url = row.get('Picture', 'No URL')
        print(f"{bird_name}: {picture_url}")
else:
    print("\nNo 'Picture' column found in the Excel file.")