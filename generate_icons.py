from PIL import Image
import os

public_dir = r"c:\Users\OPIUM\Downloads\NX\frontend\public"
logo_path = os.path.join(public_dir, "logo.jpg")

if os.path.exists(logo_path):
    with Image.open(logo_path) as img:
        # Convert to RGB if it's not
        if img.mode != "RGB":
            img = img.convert("RGB")
            
        # Create 192x192
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(os.path.join(public_dir, "icon-192x192.png"), "PNG")
        
        # Create 512x512
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(os.path.join(public_dir, "icon-512x512.png"), "PNG")
        
    print("Generated PWA icons successfully.")
else:
    print("logo.jpg not found.")
