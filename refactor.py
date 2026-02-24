import os

replacements = {
    'Profile': 'Profile',
    'profile': 'profile',
    'Profiles': 'Profiles',
    'profiles': 'profiles'
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
            
        content = content.replace('Profiles', 'Profiles')
        content = content.replace('profiles', 'profiles')
        content = content.replace('Profile', 'Profile')
        content = content.replace('profile', 'profile')
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath}")
    except UnicodeDecodeError:
        pass

for root, dirs, files in os.walk('.'):
    if 'node_modules' in dirs: dirs.remove('node_modules')
    if 'vendor' in dirs: dirs.remove('vendor')
    if '.git' in dirs: dirs.remove('.git')
    if 'storage' in dirs: dirs.remove('storage')
    if 'public' in dirs: dirs.remove('public')
    if 'bootstrap' in dirs: dirs.remove('bootstrap')
    if 'database' in root and 'migrations' in root: continue # Already did migrations
    if '.gemini' in root: continue
    if 'tests' in dirs: dirs.remove('tests')
    
    for file in files:
        if file.endswith('.php') or file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.py') or file.endswith('.json'):
            replace_in_file(os.path.join(root, file))
