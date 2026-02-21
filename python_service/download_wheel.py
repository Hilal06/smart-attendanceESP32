import urllib.request
import sys
import os

url = "https://github.com/z-mahmud22/Dlib_Windows_Python3.x/raw/main/dlib-19.24.99-cp312-cp312-win_amd64.whl"
filename = "dlib-19.24.99-cp312-cp312-win_amd64.whl"

print(f"Downloading {url} to {filename}...")
try:
    urllib.request.urlretrieve(url, filename)
    print("Download successful.")
    size = os.path.getsize(filename)
    if size < 100000:
        print(f"Warning: File size is {size} bytes, it might be an HTML page.")
        with open(filename, 'rb') as f:
            print(f.read(100))
except Exception as e:
    print(f"Error downloading: {e}")
