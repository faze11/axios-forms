const mix = require('laravel-mix');

mix.js('src/axios-forms.js', 'dist')
    .setPublicPath('dist');
