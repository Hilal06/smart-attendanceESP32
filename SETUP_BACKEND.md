# Setup Backend Guide

To run the backend for this project, you need **PHP** and **Composer** installed. Currently, they are missing from your system.

## 1. Install PHP & Composer

### Option A: Laragon (Recommended for Windows)
1. Download **Laragon WAMP** from [laragon.org](https://laragon.org/download/).
2. Install and run it.
3. Click **Start All** to enable PHP and Nginx/Apache.
4. Open the **Terminal** in Laragon (cmder) to run commands effectively.

### Option B: Manual Installation
1. **PHP**: Download PHP 8.2+ from [windows.php.net](https://windows.php.net/download/).
   - Extract to `C:\php`.
   - Add `C:\php` to your System PATH environment variable.
2. **Composer**: Download & Install from [getcomposer.org](https://getcomposer.org/download/).

## 2. Verify Installation
Open a new terminal and run:
```bash
php -v
composer -V
```
You should see versions output (e.g., PHP 8.2.x, Composer 2.x).

## 3. Initialize Project
Once installed, run these commands in the project root:

```bash
# 1. Initialize Laravel dependencies (creates composer.json)
composer create-project laravel/laravel temp_app

# 2. Move critical files from temp_app to current folder
# (Manual step: copy composer.json, artisan, bootstrap/, public/, config/ to root)
# OR let me do this for you once PHP is installed.
```
