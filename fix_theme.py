import os
import glob

def fix_theme():
    directory = 'c:/Users/OPIUM/Downloads/NX/frontend/src/**/*.jsx'
    files = glob.glob(directory, recursive=True)
    
    replacements = {
        'text-white': 'text-app-text',
        'bg-[#111111]': 'bg-app-bg',
        'bg-[#1a1a1a]': 'bg-app-surface',
        'bg-[#222]': 'bg-app-panel',
        'bg-[#333]': 'bg-app-panel border border-app-border/10',
        'bg-[#1C1C1E]': 'bg-app-panel',
        'bg-[#0B0F19]': 'bg-app-surface',
        'bg-black': 'bg-app-bg',
        'border-gray-800': 'border-app-border/10',
        'border-gray-700': 'border-app-border/20',
        'border-white/10': 'border-app-border/10',
        'border-white/20': 'border-app-border/20',
        'border-white/5': 'border-app-border/5',
        'text-gray-400': 'text-app-muted/60',
        'text-gray-500': 'text-app-muted/50',
        'text-gray-300': 'text-app-muted/80',
        'bg-app-panel/80': 'bg-app-panel',
        'text-nx-darkBg': 'text-black', # For buttons with lime background
        'bg-nx-darkBg': 'bg-app-bg'
    }
    
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        for old, new in replacements.items():
            content = content.replace(old, new)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")

if __name__ == "__main__":
    fix_theme()
