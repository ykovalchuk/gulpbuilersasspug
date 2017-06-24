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
    svgSprite = require('gulp-svg-sprite'),
    inject = require('gulp-inject'),
    htmlreplace = require('gulp-html-replace'),
    fs = require('fs');

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
    gulp.src('dist/img/svg/*.svg')
        .pipe(svgSprite(config))
        .pipe(replace('&gt;', '>'))
        .pipe(gulp.dest('dist/img/svgsprite/'));
});

gulp.task('build', ['concat', 'sass', 'pug', 'connect', 'watch']);
gulp.task('production', ['getscript', 'sass-prod'])

gulp.task('getscript', function() {
    gulp.src(['./src/js/**/*.js']).pipe(gulp.dest('./dist/js/vendor/'));

    var checker = setInterval(function(){
        fs.stat('./dist/js/vendor',function(err,stat){
            if (err == null){
                console.log('replace scripts');
                var sources = gulp.src(['./dist/js/vendor/**/*.js'], {
                    read: false
                });
                gulp.src('./dist/*.html')
                    .pipe(inject(sources))
                    .pipe(htmlreplace({
                        'js': ''
                    }))
                    .pipe(replace('/dist/', ''))
                    .pipe(gulp.dest('./dist/'));
                gulp.src('./dist/css/style.css.map')
                    .pipe(clean());
                clearInterval(checker);
            } else{
                console.log('Wait for vendor folder, error code: '+err.code);
            }
        })
    },500)
})

gulp.task('sprite', function() {
    var spriteData = gulp.src('dist/img/sprites/*.png').pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.scss',
        algorithm: 'binary-tree',
    }));
    spriteData.img.pipe(gulp.dest('dist/img/pngsprite'));
    spriteData.css.pipe(gulp.dest('src/scss/temp/'));

    var spriteCheck = setInterval(function(){
        console.log('Replace paths for background images');
        fs.stat('src/scss/temp',function(err,stat){
            if (err == null){
                console.log('Status: success');
                clearInterval(spriteCheck)
                gulp.src(['src/scss/temp/sprite.scss'])
                    .pipe(replace('url(#{$sprite-image})', 'url(../img/pngsprite/#{$sprite-image})'))
                    .pipe(gulp.dest('src/scss/abstracts'));
                gulp.src('src/scss/temp')
                    .pipe(clean());
            } else{
                console.log('Wait for vendor folder, error code: '+err.code);
            }
        })
    },500)
});

gulp.task('pug', function() {
    gulp.src('./src/templates/*.pug')
        .pipe(plumber({}))
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('sass', function() {
    gulp.src('./src/scss/style.scss')
        .pipe(sourcemaps.init())
        .pipe(plumber({
            // errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sass({
            includePaths: require('bourbon').includePaths,
            outputStyle: 'compressed'
        }))
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist/css'));
});


gulp.task('sass-prod', function() {
    gulp.src('./src/scss/style.scss')
        .pipe(sass({
            includePaths: require('bourbon').includePaths,
        }))
        .pipe(autoprefixer({
            browsers: ['last 3 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('connect', function() {
    connect.server({
        port: 1337,
        root: 'dist',
        livereload: true
    });
});

gulp.task('html', function() {
    gulp.src('./dist/*.html')
        .pipe(connect.reload());
});
gulp.task('css', function() {
    gulp.src('./dist/css/*.css')
        .pipe(connect.reload());
});

gulp.task('concat', function() {
    gulp.src('./dist/js/vendor')
        .pipe(clean());
    return gulp.src(['./src/js/jquery-1.11.1.min.js', './src/js/lib/*.js'])
        .pipe(concat('libs.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('watch', function() {
    gulp.watch('src/scss/*.scss', ['sass']);
    gulp.watch('src/scss/*.sass', ['sass']);
    gulp.watch('src/scss/**/*.scss', ['sass']);
    gulp.watch('src/scss/**/.sass', ['sass']);
    gulp.watch('src/chunks/*.pug', ['pug']);
    gulp.watch('src/templates/*.pug', ['pug']);
    gulp.watch('src/js/lib/*.js',['concat']);
    gulp.watch('dist/img/svg/*.svg', ['svg'])
    gulp.watch(['dist/*.html'], ['html']);
    gulp.watch(['dist/css/*.css'], ['css']);
});
