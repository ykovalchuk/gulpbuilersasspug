var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    connect = require('gulp-connect'),
    plumber = require('gulp-plumber'),
    spritesmith = require('gulp.spritesmith'),
    newer = require('gulp-newer'),
    clean = require('gulp-clean'),
    replace = require('gulp-replace'),
    pug = require('gulp-pug'),
    svgSprite = require('gulp-svg-sprite');

var config = {
    transform: [],
    mode: {
        symbol: {
            dest: '.',
            bust: false,
            sprite: "sprite.svg",
            // example: true
        }
    },
    svg: {
        xmlDeclaration: false
    }
};

gulp.task('svg', function() {
    gulp.src('img/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(replace('&gt;', '>'))
        .pipe(gulp.dest('img/svgsprite/'));
});


gulp.task('default', ['concat', 'sass', 'pug', 'connect', 'watch']);

gulp.task('sprite', function(){
    var spriteData = gulp.src('img/sprites/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.scss',
        algorithm: 'binary-tree',
    }));
    spriteData.img.pipe(gulp.dest('img/pngsprite'));
    spriteData.css.pipe(gulp.dest('dev/scss/temp/'));

    gulp.src(['dev/scss/temp/sprite.scss'])
        .pipe(replace('url(#{$sprite-image})', 'url(../img/pngsprite/#{$sprite-image})'))
        .pipe(gulp.dest('dev/scss/abstracts'));
    setTimeout(function() {
        return gulp.src('dev/scss/temp', {
                read: false
            })
            .pipe(clean());
    }, 1000)
});

gulp.task('pug', function() {
    gulp.src('./dev/templates/*.pug')
        // .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('./'))
});


gulp.task('sass', function() {
    gulp.src('./dev/scss/style.scss')
        .pipe(sourcemaps.init())
        .pipe(plumber({
            // errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass({
            includePaths: require('node-bourbon').includePaths,
            outputStyle: 'compressed'
        }))
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./css'));
});

gulp.task('connect', function() {
    connect.server({
        port: 1337,
        livereload: true
    });
});
//Sprite Generator

gulp.task('html', function() {
    gulp.src('*.html')
        .pipe(connect.reload());
});
gulp.task('css', function() {
    gulp.src('css/*.css')
        .pipe(connect.reload());
});

gulp.task('concat', function() {
    return gulp.src(['./dev/js/jquery-1.11.1.min.js', './dev/js/lib/*.js'])
        .pipe(concat('libs.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./js/'));
});

gulp.task('watch', function() {
    gulp.watch('dev/scss/*.scss', ['sass']);
    gulp.watch('dev/scss/*.sass', ['sass']);
    gulp.watch('dev/scss/**/*.scss', ['sass']);
    gulp.watch('dev/scss/**/.sass', ['sass']);
    gulp.watch('dev/chunks/*.pug', ['pug']);
    gulp.watch('dev/templates/*.pug', ['pug']);
    gulp.watch('img/svg/*.svg', ['svg']);
    gulp.watch(['*.html'], ['html']);
    gulp.watch(['css/*.css'], ['css']);
});
