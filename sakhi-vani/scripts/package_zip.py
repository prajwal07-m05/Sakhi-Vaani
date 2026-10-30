"""Builds SAKHI_VANI_COMPLETE_PROJECT.zip and SAKHI_VANI_WINDOWS_STARTER.zip (excludes node_modules, builds, secrets)."""
import os, sys, zipfile

EXCLUDE_DIRS = {'node_modules', 'dist', 'build', '.expo', 'data', '.git'}
EXCLUDE_FILES = {'.env'}

def build(src, out_complete, out_starter):
    base = os.path.basename(os.path.abspath(src))
    with zipfile.ZipFile(out_complete, 'w', zipfile.ZIP_DEFLATED) as z:
        for d, dirs, files in os.walk(src):
            dirs[:] = sorted(x for x in dirs if x not in EXCLUDE_DIRS)
            for f in sorted(files):
                if f in EXCLUDE_FILES or f.endswith('.zip') or f.endswith('.log'):
                    continue
                p = os.path.join(d, f)
                z.write(p, os.path.join(base, os.path.relpath(p, src)))
    starter = ['setup.bat', 'start-backend.bat', 'start-mobile.bat', 'start-all.bat', 'check-environment.bat', 'run-tests.bat', 'build-android.bat', 'docs/WINDOWS_SETUP.md', 'README.md', '.env.example']
    with zipfile.ZipFile(out_starter, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in starter:
            z.write(os.path.join(src, f), os.path.join('sakhi-vani-windows-starter', f))

if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2], sys.argv[3])
